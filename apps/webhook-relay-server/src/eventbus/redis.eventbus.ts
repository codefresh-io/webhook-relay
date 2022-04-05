import { noop } from 'lodash'
import IORedis, { Redis } from 'ioredis'
import { LoggerService } from '@codefresh-io/logger'

import { EventBusConfig } from '../config'
import { createBackoffTimeoutCalculator } from '../utils'
import { BaseEventBus } from './base.eventbus'

// The namespace to which all Redis clients of all server instances will publish and subscribe.
const REDIS_NAMESPACE = 'global'

/**
 * This class extends the EventEmitter to act as a pub/sub message bus,
 * allowing payloads to be received by one instance of the Server and sent by
 * others. This allows the Server HA.
 */
export class RedisEventBus extends BaseEventBus {
    private pub: Redis
    private sub: Redis

    constructor(
        protected readonly config: EventBusConfig,
        protected readonly logger: LoggerService
    ) {
        super()
    }

    /**
     * Start EventBus and connect to Redis
     * @param {Function} onReady - callback that is called when the EventBus is marked as ready
     * @param {Function} onNotReady - callback that is called when the EventBus is marked as not ready
     */
    async start(onReady = noop, onNotReady = noop): Promise<void> {
        // Subscribe to EventBus ready events (emitted when all Redis connections are ready)
        this.subscribeEventBusReadyEvent(onReady)

        // Subscribe to EventBus not ready events (emitted when any of the Redis connections are not ready)
        this.subscribeEventBusNotReadyEvent(onNotReady)

        if (!this.config.redis.url) throw new Error('Redis url is required for RedisEventBus')

        // Connect to Redis
        await this.initRedis()
    }

    /**
     * Close EventBus and disconnect from Redis gracefully
     */
    close(): void {
        this.sub.disconnect()
        this.pub.disconnect()

        this.logger.info('EventBus closed.')
    }

    /**
     * Publish an event to all the subscribers
     * @param {string} channel - Channel name
     * @param {any} event - Event payload
     */
    async publish(channel: string, event: any): Promise<void> {
        const message = JSON.stringify({ channel, event })
        await this.pub.publish(REDIS_NAMESPACE, message)
    }

    /**
     * Initialise all Redis connections
     * @private
     */
    private async initRedis(): Promise<void> {
        const options: IORedis.RedisOptions = this.getRedisClientOptions()

        // Need two Redis clients; one cannot subscribe and publish.
        this.initRedisPublisher(options)
        await this.initRedisSubscriber(options)
    }

    /**
     * Initialise publisher Redis connection
     * @param {Object} options
     * @private
     */
    private initRedisPublisher(options: IORedis.RedisOptions): void {
        this.pub = new IORedis(this.config.redis.url, options)

        this.pub.on('ready', this.publishEventBusReadyEventIfAllRedisConnectionsReady.bind(this))

        this.pub.on('error', (err) => {
            this.logger.error('Redis publisher connection error:', err)
        })
    }

    /**
     * Initialise subscriber Redis connection
     * @param {Object} options
     * @private
     */
    private async initRedisSubscriber(options: IORedis.RedisOptions): Promise<void> {
        this.sub = new IORedis(this.config.redis.url, options)

        this.sub.on('ready', this.publishEventBusReadyEventIfAllRedisConnectionsReady.bind(this))

        // When we get a message, parse it and
        // throw it over to the EventEmitter.
        this.sub.on('message', (_, message) => {
            const { channel, event } = JSON.parse(message)
            this.emitter.emit(channel, event)
        })

        this.sub.on('error', (err) => {
            this.logger.error('Redis subscriber connection error:', err)
        })

        // Subscribe to the Redis event channel.
        // The Promise is resolved once Redis is ready and the command is fulfilled
        await this.sub.subscribe(REDIS_NAMESPACE)
    }

    /**
     * Gets Redis client options which are required to initialise Redis
     * @private
     */
    private getRedisClientOptions(): IORedis.RedisOptions {
        const { autoReconnectStrategy, requestRetryStrategy, enableOfflineQueue, enableReadyCheck } = this.config.redis
        const backoffDelayCalculator = createBackoffTimeoutCalculator(autoReconnectStrategy.reconnectBackoff)
        return {
            enableOfflineQueue,
            enableReadyCheck,
            maxRetriesPerRequest: requestRetryStrategy.maxRetriesPerRequest === -1 ? null : requestRetryStrategy.maxRetriesPerRequest,
            // retryStrategy is a function that will be called when the connection is lost.
            // When reconnected, the client will auto subscribe to everything that the previous connection was subscribed to.
            // If the previous connection has some unfulfilled commands, the client will resend them when reconnected.
            retryStrategy: (reconnectAttemptsCount: number): number | null => {
                if (autoReconnectStrategy.maxReconnectAttempts !== -1 &&
                    autoReconnectStrategy.maxReconnectAttempts <= reconnectAttemptsCount) {
                    this.logger.error('Reached max reconnect attempts limit, giving up on Redis connection...')
                    this.publishEventBusNotReadyEvent()
                    return null // stop retrying
                }

                // return the delay in milliseconds till next retry attempt
                return backoffDelayCalculator(reconnectAttemptsCount)
            },
        }
    }

    /**
     * Publish EventBus 'ready' event only if all Redis connections are ready
     * @private
     */
    private publishEventBusReadyEventIfAllRedisConnectionsReady(): void {
        if (this.pub.status === 'ready' && this.sub.status === 'ready') {
            this.publishEventBusReadyEvent()
        }
    }
}
