import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { createHttpTerminator, HttpTerminator } from 'http-terminator'

import http from 'http'
import { setTimeout as delay } from 'timers/promises'
import { use } from './utils'
import { errorHandler, sse } from './middlewares'
import { AppController } from './controllers'
import { EventBus } from '../eventbus'
import { LoggerService } from '../types'
import { ServerConfig } from '../config'

export class Server {
    private readonly server: http.Server
    private readonly terminator: HttpTerminator
    private readonly port: number

    constructor(
        { port, heartbeatIntervalSecs }: ServerConfig,
        eventbus: EventBus,
        logger: LoggerService
    ) {
        const controller = new AppController(eventbus, logger, { heartbeatIntervalSecs })
        const app = express()

        app.use(cors())
        app.use(express.json())
        app.use(express.urlencoded({ extended: true }))

        app.get('/webhooks/:channel', sse, use(controller.subscribeClientToChannel.bind(controller)))

        // Don't log keep-alive requests
        app.use(morgan('tiny'))

        app.post('/webhooks/:channel/*', use(controller.publishEventOnChannel.bind(controller)))

        app.use(errorHandler)

        this.server = http.createServer(app)
        this.terminator = createHttpTerminator({ server: this.server })
        this.port = port
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
    }
}
