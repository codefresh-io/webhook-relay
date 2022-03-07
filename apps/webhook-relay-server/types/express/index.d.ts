declare namespace Express {
    export interface Response {
        pushEvent: (eventData: Record<string, any>, eventType?: string) => void;
        pushHeartbeatEvent: () => void;
        pushReadyEvent: () => void;
    }
}
