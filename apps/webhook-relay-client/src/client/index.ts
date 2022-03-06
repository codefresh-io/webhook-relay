import EventSource from 'eventsource'
import axios from 'axios'

import { LoggerService } from '../types'
import { ClientConfig } from '../config'
import { Timer } from '../utils'
import { isValidUrl } from './utils'

export class Client {
    private readonly sourceUrl: string
    private readonly targetBaseUrl: string
    private readonly logger: LoggerService
    private readonly serverHeartbeatTimer: Timer
    private readonly reconnectIntervalSecs: number
    private events: EventSource

    constructor(
        { sourceUrl, targetBaseUrl, serverHeartbeatTimeoutSecs, reconnectIntervalSecs }: ClientConfig,
        logger: LoggerService
    ) {
        if (!isValidUrl(sourceUrl)) {
            throw new Error(`The provided source URL is invalid: ${sourceUrl}`)
        }

        if (!isValidUrl(targetBaseUrl)) {
            throw new Error(`The provided target URL is invalid: ${targetBaseUrl}`)
        }

        if (reconnectIntervalSecs >= serverHeartbeatTimeoutSecs) {
            throw new Error(`serverHeartbeatTimeoutSecs (${serverHeartbeatTimeoutSecs}) must be larger than reconnectIntervalSecs (${reconnectIntervalSecs})`)
        }

        this.sourceUrl = sourceUrl
        this.targetBaseUrl = targetBaseUrl
        this.reconnectIntervalSecs = reconnectIntervalSecs
        this.logger = logger

        // serverHeartbeatTimer handler will try to recover the connection to the server in case no message
        // is sent from the server for `serverHeartbeatTimeout` milliseconds
        this.serverHeartbeatTimer = new Timer(() => {
            this.logger.warn('Client did not receive an heartbeat from the server, trying to recover the connection...')
            this.recover()
        }, serverHeartbeatTimeoutSecs * 1000)
    }

    start(): void {
        this.events = new EventSource(this.sourceUrl)
        this.setReconnectInterval()

        // Register event handlers
        this.on('message', this.handleMessageEvent.bind(this))
        this.on('open', this.handleConnectionOpenEvent.bind(this))
        this.on('error', this.handleConnectionErrorEvent.bind(this))
        this.on('ping', () => {}) // no-op just to make sure serverHeartbeatTimer is being reset

        this.logger.info(`Forwarding ${this.sourceUrl} to ${this.targetBaseUrl}`)

        this.serverHeartbeatTimer.start()
    }

    close(): void {
        this.serverHeartbeatTimer.stop()
        this.events.close()
        this.logger.info('Connection closed:', this.sourceUrl)
    }

    recover(): void {
        this.close()
        this.start()
    }

    private setReconnectInterval(): void {
        // This isn't a valid property of type EventSource
        (this.events as any).reconnectInterval = this.reconnectIntervalSecs * 1000
    }

    private on(eventType: string, handler: (event: MessageEvent<any>) => void): void {
        this.events.addEventListener(eventType, (event) => {
            this.serverHeartbeatTimer.reset()
            handler(event)
        })
    }

    private async handleMessageEvent(msg: MessageEvent<any>): Promise<void> {
        const data = JSON.parse(msg.data)
        const target = new URL(data.path, this.targetBaseUrl)

        try {
            const res = await axios.post(target.toString(), data.body, {
                headers: {
                    ...data.headers,
                    'content-length': `${Buffer.byteLength(JSON.stringify(data.body))}`,
                },
            })
            this.logger.info(`${res.config.method?.toUpperCase()} ${res.config.url} - ${res.status}`)
        } catch (err) {
            this.logger.error(`Failed to proxy request to ${target}`, err)
        }
    }

    private handleConnectionOpenEvent(): void {
        this.logger.info('Connected:', this.events.url)
    }

    private handleConnectionErrorEvent(err: MessageEvent<any>): void {
        this.logger.error('Connection error:', err)
    }
}
