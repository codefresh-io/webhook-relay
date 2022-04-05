import { noop } from 'lodash'

import { BaseEventBus } from './base.eventbus'

export class LocalEventBus extends BaseEventBus {
    /**
     * Start EventBus
     * @param {Function} onReady - callback that is called when the EventBus is marked as ready
     * @param {Function} onNotReady - callback that is called when the EventBus is marked as not ready
     */
    async start(onReady = noop, onNotReady = noop): Promise<void> {
        this.subscribeEventBusReadyEvent(onReady)
        this.subscribeEventBusNotReadyEvent(onNotReady)

        // Publish EventBus ready event immediately when using local EventBus
        this.publishEventBusReadyEvent()
    }

    /**
     * Close EventBus
     */
    close(): void {}

    /**
     * Publish an event to all the subscribers
     * @param {string} channel - Channel name
     * @param {any} event - Event payload
     */
    async publish(channel: string, event: any): Promise<void> {
        this.emitter.emit(channel, event)
    }
}
