import express, { Application } from 'express'
import cors from 'cors'
import { createHttpTerminator, HttpTerminator } from 'http-terminator'

import http from 'http'

export * from './middleware'

export interface TestServerOptions {
    rootRouter: express.Router
    done: jest.DoneCallback
    onStart: () => void
}

export class TestServer {
    private server: http.Server | undefined
    private terminator: HttpTerminator | undefined

    constructor(
        private readonly port: number
    ) {}

    private static createExpressApp({ rootRouter, done }: TestServerOptions): Application {
        const app = express()

        app.use(cors())
        app.use(express.json({
            verify(req: express.Request, res: express.Response, buf: Buffer, encoding: BufferEncoding): void {
                req.rawBody = buf.toString(encoding)
            },
        }))
        app.use(express.urlencoded({
            extended: true,
            verify(req: express.Request, res: express.Response, buf: Buffer, encoding: BufferEncoding): void {
                req.rawBody = buf.toString(encoding)
            },
        }))

        app.use(rootRouter)

        app.use((err, req, res, next) => {
            console.log('here err')
            done(err)
            next(err)
        })

        return app
    }

    start(options: TestServerOptions): void {
        this.server = TestServer.createExpressApp(options)
            .listen(this.port, options.onStart)
        this.terminator = createHttpTerminator({
            server: this.server,
            gracefulTerminationTimeout: 100,
        })
    }

    async close(): Promise<void> {
        return this.terminator && this.terminator.terminate()
    }
}
