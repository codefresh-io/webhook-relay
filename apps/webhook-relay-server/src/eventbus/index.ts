import { noop } from 'lodash'
import IORedis, { Redis } from 'ioredis'

import EventEmitter from 'events'
import { EventBusConfig } from '../config'
import { LoggerService } from '../types'
import { createBackoffTimeoutCalculator } from '../utils'

// The namespace to which all Redis clients of all server instances will publish and subscribe.
const REDIS_NAMESPACE = 'global'

/**
 * This class extends the EventEmitter to act as a pub/sub message bus,
 * allowing payloads to be received by one instance of the Server and sent by
 * others. This allows the Server HA.
 */
export class EventBus {
    private readonly emitter = new EventEmitter()
    private pub: Redis
    private sub: Redis
    private isRedisEnabled = false

    constructor(
        private readonly config: EventBusConfig,
        private readonly logger: LoggerService
    ) {}

    /**
     * Start EventBus and connect to Redis (if Redis enabled)
     * @param {Function} onReady - callback that is called when the EventBus is marked as ready
     * @param {Function} onNotReady - callback that is called when the EventBus is marked as not ready
     */
    async start(onReady = noop, onNotReady = noop): Promise<void> {
        // Subscribe to EventBus ready events (emitted when all Redis connections are ready)
        this.subscribeEventBusReadyEvent(onReady)

        // If Redis isn't enabled, don't try to connect and publish EventBus ready event immediately
        if (!this.config.redis.url) {
            this.publishEventBusReadyEvent()
            return
        }

        // Connect to Redis
        this.isRedisEnabled = true
        await this.initRedis(onNotReady)
    }

    /**
     * Close EventBus and disconnect from Redis gracefully (if Redis enabled)
     */
    close(): void {
        if (this.isRedisEnabled) {
            this.sub.disconnect()
            this.pub.disconnect()
            this.isRedisEnabled = false
        }

        this.logger.info('EventBus closed.')
    }

    /**
     * Subscribe a listener to events on a specific channel
     * @param {string} channel - Channel name
     * @param {Function} listener - Handler function that will listen to events on the channel
     */
    subscribe(channel: string, listener: (...args: any[]) => void): void {
        this.emitter.on(channel, listener)
    }

    /**
     * Unsubscribe a listener from a specific channel
     * @param {string} channel - Channel name
     * @param {Function} listener - Handler function that needs to be unsubscribed from the channel
     */
    unsubscribe(channel: string, listener: (...args: any[]) => void): void {
        this.emitter.removeListener(channel, listener)
    }

    /**
     * Get the number of subscribers listening to a channel on this server instance
     * @param {string} channel - Channel name
     */
    subscribersCount(channel: string): number {
        return this.emitter.listenerCount(channel)
    }

    /**
     * Publish an event to all the subscribers
     * @param {string} channel - Channel name
     * @param {any} payload - Event payload
     */
    async publish(channel: string, payload: any): Promise<void> {
        return this.isRedisEnabled ?
            this.publishRedisEvent(channel, payload) :
            this.publishLocalEvent(channel, payload)
    }

    /**
     * Initialise all Redis connections
     * @param {Function} onNotReady - callback that is called when the EventBus is marked as not ready
     * @private
     */
    private async initRedis(onNotReady: () => void): Promise<void> {
        const options: IORedis.RedisOptions = this.getRedisClientOptions(onNotReady)

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
            const { channel, payload } = JSON.parse(message)
            return this.publishLocalEvent(channel, payload)
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
     * @param {Function} onNotReady - callback that is called when the EventBus is marked as not ready
     * @private
     */
    private getRedisClientOptions(onNotReady: () => void): IORedis.RedisOptions {
        const { autoReconnectStrategy, requestRetryStrategy, enableOfflineQueue } = this.config.redis
        const backoffDelayCalculator = createBackoffTimeoutCalculator(autoReconnectStrategy.reconnectBackoff)
        return {
            enableOfflineQueue,
            maxRetriesPerRequest: requestRetryStrategy.maxRetriesPerRequest,
            // retryStrategy is a function that will be called when the connection is lost.
            // When reconnected, the client will auto subscribe to everything that the previous connection was subscribed to.
            // If the previous connection has some unfulfilled commands, the client will resend them when reconnected.
            retryStrategy(reconnectAttemptsCount: number): number | null {
                if (reconnectAttemptsCount === autoReconnectStrategy.maxReconnectAttempts) {
                    onNotReady()
                    return null // stop retrying
                }

                if (reconnectAttemptsCount === autoReconnectStrategy.maxReconnectAttemptsBeforeReadinessFailure) {
                    onNotReady()
                    // continue retrying
                }

                // return the delay in milliseconds till next retry attempt
                return backoffDelayCalculator(reconnectAttemptsCount)
            },
        }
    }

    /**
     * Publish event on the Redis bus, which will tell all server instances about it
     * @param {string} channel - Channel name
     * @param {any} payload - Event payload
     * @private
     */
    private async publishRedisEvent(channel: string, payload: any): Promise<void> {
        const message = JSON.stringify({ channel, payload })
        await this.pub.publish(REDIS_NAMESPACE, message)
    }

    /**
     * Publish event on this machine's in-memory EventEmitter
     * @param {string} channel - Channel name
     * @param {any} payload - Event payload
     * @private
     */
    private publishLocalEvent(channel: string, payload: any): void {
        this.emitter.emit(channel, payload)
    }

    /**
     * Publish EventBus 'ready' event
     * NOTE: if Redis enabled, this event will be published only if all Redis connections are ready
     * @private
     */
    private publishEventBusReadyEvent(): void {
        this.publishLocalEvent('ready', {})
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

    /**
     * Subscribe to EventBus 'ready' event
     * NOTE: if Redis enabled, this event will be published only if all Redis connections are ready
     * @param {Function} onReady - callback that is called when the EventBus is marked as ready
     * @private
     */
    private subscribeEventBusReadyEvent(onReady: (isFirstTime: boolean) => void): void {
        this.emitter.once('ready', () => {
            // Mark first event by passing true as argument
            onReady(true)

            // Subscribe to all future EventBus ready events
            this.emitter.on('ready', () => onReady(false))
        })
    }
}
