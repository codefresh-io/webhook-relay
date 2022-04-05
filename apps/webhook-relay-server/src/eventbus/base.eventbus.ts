import EventEmitter from 'events'
import { EventBus } from './types'

/**
 * This class extends the EventEmitter to act as a pub/sub message bus
 */
export abstract class BaseEventBus implements EventBus {
    protected readonly emitter = new EventEmitter()

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
     * Publish EventBus 'ready' event
     * NOTE: if Redis enabled, this event will be published only if all Redis connections are ready
     * @private
     */
    protected publishEventBusReadyEvent(): void {
        this.emitter.emit('ready', {})
    }

    /**
     * Subscribe to EventBus 'ready' event
     * NOTE: if Redis enabled, this event will be published only if all Redis connections are ready
     * @param {Function} onReady - callback that is called when the EventBus is marked as ready
     * @protected
     */
    protected subscribeEventBusReadyEvent(onReady: (isFirstTime: boolean) => void): void {
        this.emitter.once('ready', () => {
            // Mark first event by passing true as argument
            onReady(true)

            // Subscribe to all future EventBus ready events
            this.emitter.on('ready', () => onReady(false))
        })
    }

    /**
     * Publish EventBus 'notReady' event
     * NOTE: if Redis enabled, this event will be published if any of the Redis connections are not ready
     * @protected
     */
    protected publishEventBusNotReadyEvent(): void {
        this.emitter.emit('notReady', {})
    }

    /**
     * Subscribe to EventBus 'ready' event
     * NOTE: if Redis enabled, this event will be published if any of the Redis connections are not ready
     * @param {Function} onNotReady - callback that is called when the EventBus is marked as not ready
     * @protected
     */
    protected subscribeEventBusNotReadyEvent(onNotReady: () => void): void {
        this.emitter.on('notReady', onNotReady)
    }

    /**
     * Start EventBus
     * @param {Function} onReady - callback that is called when the EventBus is marked as ready
     * @param {Function} onNotReady - callback that is called when the EventBus is marked as not ready
     */
    abstract start(onReady?: (isFirstTime: boolean) => void, onNotReady?: () => void): Promise<void>

    /**
     * Close EventBus
     */
    abstract close(): void

    /**
     * Publish an event to all the subscribers
     * @param {string} channel - Channel name
     * @param {any} payload - Event payload
     */
    abstract publish(channel: string, payload: any): Promise<void>
}
