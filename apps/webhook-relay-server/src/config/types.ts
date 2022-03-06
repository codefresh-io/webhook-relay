export interface ServerConfig {
    // Server port
    port: number

    // Delay in milliseconds between each heartbeat that the server will send to the clients
    heartbeatIntervalSecs: number
}

export interface EventBusConfig {
    // Redis URL for Server HA
    redisUrl?: string
}

export interface HealthServiceConfig {
    // Health service port
    port: number

    // Start health service only if K8s env is detected
    detectKubernetes: boolean

    // Delays the shutdown handler by X milliseconds.
    // This value should match `readinessProbe.periodSeconds`
    shutdownDelay: number

    // Time in milliseconds before forceful termination if shutdown handlers do not complete.
    shutdownHandlerTimeout: number
}

export interface Config {
    server: ServerConfig
    eventbus: EventBusConfig
    healthService: HealthServiceConfig
}
