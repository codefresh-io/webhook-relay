declare namespace Express {
    export interface Response {
        pushEvent: (eventData: Record<string, any>, eventType?: string) => void;
        pushPingEvent: () => void;
        pushReadyEvent: () => void;
    }
}
