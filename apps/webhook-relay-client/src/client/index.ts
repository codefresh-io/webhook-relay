import EventSource from 'eventsource'
import axios, { AxiosRequestHeaders } from 'axios'
import { LoggerService } from '@codefresh-io/logger'
import { Timer, ConnectionReadyEvent, WebhookPayloadEvent, AUTH_TOKEN_HTTP_HEADER } from '@codefresh-io/common'

import { join } from 'path'
import { ClientConfig } from '../config'
import { isValidUrl } from './utils'

export class Client {
    private readonly sourceUrl: string
    private readonly targetBaseUrl: string
    private readonly logger: LoggerService
    private readonly reconnectInterval: number
    private readonly authToken?: string
    private serverHeartbeatTimer: Timer | undefined
    private events: EventSource

    constructor(
        { sourceUrl, targetBaseUrl, reconnectInterval, authToken }: ClientConfig,
        logger: LoggerService
    ) {
        if (!isValidUrl(sourceUrl)) {
            throw new Error(`The provided source URL is invalid: ${sourceUrl}`)
        }

        if (!isValidUrl(targetBaseUrl)) {
            throw new Error(`The provided target URL is invalid: ${targetBaseUrl}`)
        }

        this.sourceUrl = sourceUrl
        this.targetBaseUrl = targetBaseUrl
        this.reconnectInterval = reconnectInterval
        this.authToken = authToken
        this.logger = logger
    }

    start(): void {
        const esOptions = this.authToken ? { headers: { [AUTH_TOKEN_HTTP_HEADER]: this.authToken } } : undefined
        this.events = new EventSource(this.sourceUrl, esOptions)
        this.setReconnectInterval()

        this.logger.info(`Subscribing to ${this.sourceUrl}  ...`)

        // Register event handlers
        this.on('ready', this.handleConnectionReadyEvent.bind(this))
        this.on('error', this.handleConnectionErrorEvent.bind(this))
        this.on('message', this.handleMessageEvent.bind(this))
        this.on('heartbeat', this.handleHeartbeatEvent.bind(this))
    }

    close(): void {
        this.serverHeartbeatTimer?.stop()
        this.events.close()
        this.logger.info('Connection closed:', this.sourceUrl)
    }

    recover(): void {
        this.close()
        this.start()
    }

    private setReconnectInterval(): void {
        // This isn't a valid property of type EventSource
        (this.events as any).reconnectInterval = this.reconnectInterval
    }

    private setServerHeartbeatTimer(heartbeatInterval: number): void {
        // The `serverHeartbeatTimeout` has additional grace period on top
        // of the `heartbeatInterval` that is sent by the server
        const serverHeartbeatTimeout = heartbeatInterval + 1 * 1000

        // serverHeartbeatTimer handler will try to recover the connection to the server in case no heartbeat
        // is sent from the server for `serverHeartbeatTimeout` milliseconds
        this.serverHeartbeatTimer = new Timer(() => {
            this.logger.warn('Client did not receive an heartbeat from the server, trying to recover the connection...')
            this.recover()
        }, serverHeartbeatTimeout)

        this.serverHeartbeatTimer.start()
    }

    private on<EventData = any>(
        eventType: string,
        handler: (event: EventData) => void | Promise<void>
    ): void {
        this.events.addEventListener(eventType, async (event) => {
            const eventData: EventData = event.data ? JSON.parse(event.data) : event
            await handler(eventData)
        })
    }

    private handleHeartbeatEvent(): void {
        this.serverHeartbeatTimer?.reset()
    }

    private async handleMessageEvent(eventData: WebhookPayloadEvent): Promise<void> {
        const target = new URL(this.targetBaseUrl)
        target.pathname = join(target.pathname, eventData.path)
        target.search = new URLSearchParams(eventData.query).toString()
        delete eventData.headers.host

        try {
            const res = await axios.post(target.toString(), eventData.body, {
                headers: eventData.headers as AxiosRequestHeaders,
                timeout: 30 * 1000,
            })
            this.logger.info(`${res.config.method?.toUpperCase()} ${res.config.url} - ${res.status}`)
        } catch (err) {
            this.logger.error(`Failed to proxy request to ${target}`, err)
        }
    }

    private handleConnectionReadyEvent(readyEventData: ConnectionReadyEvent): void {
        this.logger.info(`Connected: ${this.events.url} . Forwarding to ${this.targetBaseUrl}`)

        this.setServerHeartbeatTimer(readyEventData.heartbeatInterval)
    }

    private handleConnectionErrorEvent(err: any): void {
        this.logger.error('Connection error:', err)

        // When connection error events occur, the server cannot send a heartbeat so the timer needs to be stopped.
        // At this point, the auto-reconnect mechanism of EventSource kicks in so there's no need to time out the connection.
        // If the connection is re-established, the timer will start ticking again.
        this.serverHeartbeatTimer?.stop()
    }
}
