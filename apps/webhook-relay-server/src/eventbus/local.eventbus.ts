import { noop } from 'lodash'

import { BaseEventBus } from './base.eventbus'

export class LocalEventBus extends BaseEventBus {
    async start(onReady = noop, onNotReady = noop): Promise<void> {
        this.subscribeEventBusReadyEvent(onReady)
        this.subscribeEventBusNotReadyEvent(onNotReady)
    }

    close(): void {}

    async publish(channel: string, payload: any): Promise<void> {
        this.emitter.emit(channel, payload)
    }
}
