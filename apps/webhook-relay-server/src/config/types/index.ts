import { ExponentialBackoffOptions } from '../../utils'

export interface AutoReconnectStrategy {
    // Exponential backoff options that are used for reconnecting to Redis when the connection is lost.
    // The formula used to calculate the individual timeouts is:
    // Math.min(random * minTimeout * Math.pow(factor, attempt), maxTimeout)
    reconnectBackoff: ExponentialBackoffOptions

    // Maximum number of reconnection attempts when the connection to Redis is lost.
    // Default: unlimited.
    // NOTE: Regardless of the value set in `maxReconnectAttemptsBeforeReadinessFailure`, readiness prob will
    // start failing after this limit is exceeded
    maxReconnectAttempts: number | null

    // Maximum number of Redis reconnection attempts before readiness prob of the server starts to fail.
    // Default: 20.
    // NOTE: This option gives the ability to fail the readiness prob after some grace period but still allow Redis
    // to keep trying to reconnect according to the `maxReconnectAttempts` that is configured.
    maxReconnectAttemptsBeforeReadinessFailure: number | null
}

export interface RequestRetryStrategy {
    // Maximum number of retry attempts for a pending Redis command before it gets flushed with an error.
    // Default: unlimited
    maxRetriesPerRequest: number | null
}

export interface RedisConfig {
    // Redis URL for Server HA
    url?: string

    // Redis auto-reconnect strategy when connection is lost
    autoReconnectStrategy: AutoReconnectStrategy

    // Redis request retry strategy when Redis request (publish, subscribe, etc.) fails
    requestRetryStrategy: RequestRetryStrategy

    // If enabled, when a command can't be processed by Redis (being sent before the ready event),
    // it's added to the offline queue and will be executed when it can be processed.
    // Default true
    enableOfflineQueue: boolean
}

export interface EventBusConfig {
    // Redis configuration
    redis: RedisConfig
}

export interface HealthServiceConfig {
    // Health service port.
    // Default 9000
    port: number

    // Start health service only if K8s env is detected.
    // Default false
    detectKubernetes: boolean

    // Delays the shutdown handler by X milliseconds.
    // This value should match `readinessProbe.periodSeconds`.
    // Default 5000
    shutdownDelay: number

    // Time in milliseconds before forceful termination if shutdown handlers do not complete.
    // Default 10,000
    shutdownHandlerTimeout: number
}

export interface ServerConfig {
    // Server port
    port: number

    // Delay in milliseconds between each heartbeat that the server will send to the clients
    heartbeatIntervalSecs: number
}

export interface Config {
    server: ServerConfig
    eventbus: EventBusConfig
    healthService: HealthServiceConfig
}
