import { Request, Response } from 'express'
import { LoggerService } from '@codefresh-io/logger'
import { Interval, WebhookPayloadEvent } from '@codefresh-io/common'

import { EventBus } from '../../eventbus'
import { HttpStatus } from '../types'

export class AppController {
    constructor(
        private eventbus: EventBus,
        private logger: LoggerService,
        private options: { heartbeatInterval: number }
    ) {}

    async subscribeClientToChannel(req: Request, res: Response): Promise<void> {
        const { channel } = req.params
        const { heartbeatInterval } = this.options
        const keepAliveInterval = new Interval(res.pushHeartbeatEvent, heartbeatInterval)
        const send = (eventData: Record<string, any>): void => {
            res.pushEvent(eventData)
        }
        const close = (): void => {
            this.eventbus.unsubscribe(channel, send)
            keepAliveInterval.stop()
            this.logger.info(`Client disconnected from channel "${channel}" with ${this.eventbus.subscribersCount(channel)} subscribers.`)
        }

        // Start keepAliveInterval to send heartbeats to the Client every few milliseconds to keep the connection alive
        keepAliveInterval.start()

        // Listen for events on this channel
        this.eventbus.subscribe(channel, send)

        // Clean up when the client disconnects
        res.on('close', close)

        // Let the Client know that the server is ready to send events
        res.pushReadyEvent({ heartbeatInterval })

        this.logger.info(`Client connected to SSE on channel "${channel}" with ${this.eventbus.subscribersCount(channel)} subscribers.`)
    }

    async publishEventOnChannel(req: Request, res: Response): Promise<void> {
        const { channel } = req.params
        const payload: WebhookPayloadEvent = {
            headers: req.headers,
            originalUrl: req.originalUrl,
            path: req.path,
            query: req.query,
            body: req.body.toString(), // body is raw buffer and needs to be stringified
            timestamp: Date.now(),
        }
        await this.eventbus.publish(channel, payload)

        res.status(HttpStatus.OK).end()
    }
}
