import { IncomingHttpHeaders } from 'http'

export interface ConnectionReadyEvent {
    heartbeatInterval: number
}

export interface WebhookPayloadEvent {
    headers: IncomingHttpHeaders,
    originalUrl: string,
    path: string,
    query: Record<string, any>,
    body: string, // body is the raw data and is always stringified
    timestamp: number,
}
