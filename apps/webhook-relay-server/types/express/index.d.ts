import { ConnectionReadyEvent } from '@codefresh-io/common'

declare module 'express' {
    export interface Response {
        pushEvent: (eventData: Record<string, any>, eventType?: string) => void
        pushHeartbeatEvent: () => void
        pushReadyEvent: (eventData: ConnectionReadyEvent) => void
    }
}
