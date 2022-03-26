import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { createHttpTerminator, HttpTerminator } from 'http-terminator'
import { LoggerService } from '@codefresh-io/logger'

import http from 'http'
import { setTimeout as delay } from 'timers/promises'
import { use } from './utils'
import { errorHandler, sse } from './middlewares'
import { AppController } from './controllers'
import { EventBus } from '../eventbus'
import { ServerConfig } from '../config'

export class Server {
    private readonly server: http.Server
    private readonly terminator: HttpTerminator
    private readonly port: number
    private readonly logger: LoggerService

    constructor(
        { port, maxPayloadSizeLimit, heartbeatInterval = 5 * 1000 }: ServerConfig,
        eventbus: EventBus,
        logger: LoggerService
    ) {
        const controller = new AppController(eventbus, logger, { heartbeatInterval })
        const app = express()

        app.use(cors())
        app.use(express.raw({
            type: [
                'application/json',
                'application/x-www-form-urlencoded',
            ],
            limit: maxPayloadSizeLimit,
        }))

        app.get('/subscribe/:channel', sse, use(controller.subscribeClientToChannel.bind(controller)))

        // Don't log keep-alive (SSE) requests
        app.use(morgan('tiny', { stream: { write: message => logger.info(message.trim()) } }))

        app.post('/webhooks/:channel/*', use(controller.publishEventOnChannel.bind(controller)))

        app.use(errorHandler)

        this.server = http.createServer(app)
        this.terminator = createHttpTerminator({ server: this.server })
        this.port = port
        this.logger = logger
    }

    start(
        onStart: () => void,
        onError: (err: Error) => void
    ): void {
        this.server
            .listen(this.port, onStart)
            .on('error', onError)
    }

    async close(): Promise<void> {
        // Stop accepting new connections and close all keep-alive connections
        await this.terminator.terminate()
        // Wait for all active requests to finish
        await delay(2 * 1000)

        this.logger.info('Server closed.')
    }
}
