import { ExponentialBackoffOptions } from '../../utils'

export interface AutoReconnectStrategy {
    // Exponential backoff options that are used for reconnecting to Redis when the connection is lost.
    // The formula used to calculate the individual timeouts is:
    // Math.min(random * minTimeout * Math.pow(factor, attempt), maxTimeout)
    reconnectBackoff: ExponentialBackoffOptions

    // Maximum number of reconnection attempts when the connection to Redis is lost.
    // After this limit is exceeded, the connection will be lost "forever" and liveness probe will start to fail.
    // Set to -1 for unlimited.
    // Default: 20
    maxReconnectAttempts: number
}

export interface RequestRetryStrategy {
    // Maximum number of retry attempts for a pending Redis command before it gets flushed with an error.
    // Default: -1 (unlimited)
    maxRetriesPerRequest: number
}

export interface RedisConfig {
    // Redis URL for Server HA
    url?: string

    // Redis auto-reconnect strategy when connection is lost
    autoReconnectStrategy: AutoReconnectStrategy

    // Redis request retry strategy when Redis request (publish, subscribe, etc.) fails
    requestRetryStrategy: RequestRetryStrategy

    // If enabled, when a command can't be processed by Redis (being sent before the EventBus ready event),
    // it's added to the offline queue and will be executed when it can be processed.
    // Default: true
    enableOfflineQueue: boolean

    // If enabled, the EventBus will emit ready event when the Redis server reports that it is ready to receive commands (e.g. finish loading data from disk).
    // Otherwise, ready will be emitted immediately right after the Redis connect event.
    // NOTE: When a connection is established to Redis, the Redis server might still be loading the database from disk.
    // While loading, the Redis server does not respond to any commands. To work around this, when this option is true,
    // the ready event will be emitted only when the Redis server is able to process commands and its status is changed to ready.
    // Default: true
    enableReadyCheck: boolean
}

export interface EventBusConfig {
    // Redis configuration
    redis: RedisConfig
}

export interface HealthServiceConfig {
    // Health service port.
    // Default: 9000
    port: number

    // Start health service only if K8s env is detected.
    // Default: false
    detectKubernetes: boolean

    // Delays the shutdown handler by X milliseconds.
    // This value should match `readinessProbe.periodSeconds`.
    // Default: 5000
    shutdownDelay: number

    // Time in milliseconds before forceful termination if shutdown handlers do not complete.
    // Default: 10,000
    shutdownHandlerTimeout: number
}

export interface ServerConfig {
    // Server port
    // Default: 3000
    port: number

    // Controls the maximum request body size.
    // If this is a number, then the value specifies the number of bytes;
    // If it is a string (e.g. '100kb', '5mb'), the value will be parsed.
    // Default: '1mb'
    maxPayloadSizeLimit?: number | string

    // Delay in milliseconds between each heartbeat that the server will send to the clients.
    // Default: 5000
    heartbeatInterval?: number
}

export interface Config {
    server: ServerConfig
    eventbus: EventBusConfig
    healthService: HealthServiceConfig
}
