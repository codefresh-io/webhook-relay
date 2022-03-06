import IORedis, { Redis } from 'ioredis'

import EventEmitter from 'events'
import { EventBusConfig } from '../config'

/*TODO:
*   * think about redis disconnection strategy, maybe modify 'maxRetriesPerRequest' (default is 20), 'retryStrategy' etc. https://www.npmjs.com/package/ioredis
*/

// The namespace to which all Redis clients of all server instances will publish and subscribe to.
const REDIS_NAMESPACE = 'global'

/**
 * This class extends the EventEmitter to act as a pub/sub message bus,
 * allowing payloads to be received by one instance of the Server and sent by
 * others. This allows the Server HA.
 */
export class EventBus {
    private emitter = new EventEmitter()
    private pub: Redis
    private sub: Redis
    private isRedisEnabled = false

    constructor({ redisUrl }: EventBusConfig) {
        // If Redis isn't enabled, don't try to connect
        if (!redisUrl) return

        // Need two Redis clients; one cannot subscribe and publish.
        this.initRedisPublisher(redisUrl)
        this.initRedisSubscriber(redisUrl)

        this.isRedisEnabled = true
    }

    /**
     * Subscribe a listener to events on a specific channel
     * @param {string} channel - Channel name
     * @param {function} listener - Handler function that will listen to events on the channel
     */
    subscribe(channel: string, listener: (...args: any[]) => void): void {
        this.emitter.on(channel, listener)
    }

    /**
     * Unsubscribe a listener from a specific channel
     * @param {string} channel - Channel name
     * @param {function} listener - Handler function that needs to be unsubscribed from the channel
     */
    unsubscribe(channel: string, listener: (...args: any[]) => void): void {
        this.emitter.removeListener(channel, listener)
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
     * Get the number of subscribers listening to a channel on this server instance
     * @param {string} channel - Channel name
     */
    subscribersCount(channel: string): number {
        return this.emitter.listenerCount(channel)
    }

    /**
     * Close all Redis connections gracefully
     */
    close(): void {
        if (this.isRedisEnabled) {
            this.sub.disconnect()
            this.pub.disconnect()
            this.isRedisEnabled = false
        }
    }

    private initRedisPublisher(redisUrl: string): void {
        this.pub = new IORedis(redisUrl)
    }

    private initRedisSubscriber(redisUrl: string): void {
        this.sub = new IORedis(redisUrl)

        // Subscribe to the Redis event channel
        this.sub.subscribe(REDIS_NAMESPACE)

        // When we get a message, parse it and
        // throw it over to the EventEmitter.
        this.sub.on('message', (_, message) => {
            const { channel, payload } = JSON.parse(message)
            return this.publishLocalEvent(channel, payload)
        })
    }

    /**
     * Emit an event to the Redis bus, which will tell all server instances about it
     * @param {string} channel - Channel name
     * @param {any} payload - Event payload
     */
    private async publishRedisEvent(channel: string, payload: any): Promise<void> {
        const message = JSON.stringify({ channel, payload })
        await this.pub.publish(REDIS_NAMESPACE, message)
    }

    /**
     * Emit an event to this machine's in-memory EventEmitter
     * @param {string} channel - Channel name
     * @param {any} payload - Event payload
     */
    private publishLocalEvent(channel: string, payload: any): void {
        this.emitter.emit(channel, payload)
    }
}
