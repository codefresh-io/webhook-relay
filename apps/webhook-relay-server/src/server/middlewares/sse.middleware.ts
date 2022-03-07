import { NextFunction, Request, Response } from 'express'

import { HttpStatus } from '../types'

export function sse(req: Request, res: Response, next: NextFunction): void {
    req.socket.setTimeout(0)
    res.statusCode = HttpStatus.OK
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    let messageCount = 0
    res.pushEvent = (eventData: Record<string, any>, eventType?: string): void => {
        res.write(`id: ${messageCount}\n`)
        if (eventType) {
            res.write(`event: ${eventType}\n`)
        }
        res.write(`data: ${JSON.stringify(eventData)}\n\n`)

        messageCount++
    }

    res.pushHeartbeatEvent = (): void => {
        res.pushEvent({}, 'heartbeat')
    }

    res.pushReadyEvent = (): void => {
        res.pushEvent({}, 'ready')
    }

    next()
}
