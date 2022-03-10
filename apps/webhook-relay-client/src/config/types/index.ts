export interface ClientConfig {
    // Full URL (including full path that contains channel name) of the Webhook Relay Server.
    sourceUrl: string

    // URL of the target service the events will be forwarded to.
    targetBaseUrl: string

    // Interval in seconds before the Client will try to reconnect the Server in case of connection error events.
    reconnectIntervalSecs: number

    // Time in seconds that the Client should wait for Server heartbeat before trying to recover the connection.
    // Use Cases:
    // On some rare occasions, the keep-alive connection to the Server might be cut off without any connection error events
    // being emitted, which will prevent the auto reconnect from kicking in.
    // Also, the more obvious use case is to make sure that the Server instance is still healthy.
    // To prevent the Client from hanging, the Client will listen for heartbeats from the Server to make sure
    // the connection is still alive, otherwise it will try to recover.
    // IMPORTANT: this value must be greater than `reconnectIntervalSecs` in the Client config and
    // also greater than the heartbeat interval in the Server config.
    serverHeartbeatTimeoutSecs: number
}

export interface Config {
    client: ClientConfig
}
