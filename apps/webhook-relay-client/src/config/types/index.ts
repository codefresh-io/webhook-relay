export interface Config {
    client: ClientConfig
}

export interface ClientConfig {
    // Full URL (including full path that contains channel name) of the Webhook Relay Server.
    // Environment variable: SOURCE_URL.
    sourceUrl: string

    // URL of the target service the events will be forwarded to.
    // Environment variable: TARGET_BASE_URL.
    targetBaseUrl: string

    // Interval in milliseconds before the Client will try to reconnect to the Server in case of connection error events.
    // Environment variable: RECONNECT_INTERVAL.
    // Default: 1000.
    reconnectInterval: number
    
    // okokokokok
    shimon: number
}
