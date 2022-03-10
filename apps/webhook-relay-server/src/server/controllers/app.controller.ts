import { Request, Response } from 'express'
import { LoggerService } from '@codefresh-io/logger'
import { Interval } from '@codefresh-io/common'

import { EventBus } from '../../eventbus'
import { HttpStatus } from '../types'

export class AppController {
    constructor(
        private eventbus: EventBus,
        private logger: LoggerService,
        private options: { heartbeatIntervalSecs: number }
    ) {}

    async subscribeClientToChannel(req: Request, res: Response): Promise<void> {
        const { channel } = req.params
        const keepAliveInterval = new Interval(res.pushHeartbeatEvent, this.options.heartbeatIntervalSecs * 1000)
        const send = (eventData: Record<string, any>): void => {
            res.pushEvent(eventData)
            keepAliveInterval.reset()
        }
        const close = (): void => {
            this.eventbus.unsubscribe(channel, send)
            keepAliveInterval.stop()
            this.logger.info(`Client disconnected from channel "${channel}" with ${this.eventbus.subscribersCount(channel)} subscribers.`)
        }

        // Start keepAliveInterval to send heartbeats to the Client every few seconds to keep the connection alive
        keepAliveInterval.start()

        // Listen for events on this channel
        this.eventbus.subscribe(channel, send)

        // Clean up when the client disconnects
        res.on('close', close)

        // Let the Client know that the server is ready to send events
        res.pushReadyEvent()

        this.logger.info(`Client connected to SSE on channel "${channel}" with ${this.eventbus.subscribersCount(channel)} subscribers.`)
    }

    async publishEventOnChannel(req: Request, res: Response): Promise<void> {
        const { channel } = req.params
        const payload = {
            headers: req.headers,
            path: req.originalUrl,
            body: req.body,
            query: req.query,
            timestamp: Date.now(),
        }
        await this.eventbus.publish(channel, payload)

        res.status(HttpStatus.OK).end()
    }
}
