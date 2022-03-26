# webhook-relay-server

## Configuration

```typescript
export interface Config {
    server: ServerConfig
    eventbus: EventBusConfig
    healthService: HealthServiceConfig
}

export interface ServerConfig {
    // Server port.
    // Environment variable: SERVER_PORT.
    // Default: 3000.
    port: number

    // Controls the maximum request body size.
    // If this is a number, then the value specifies the number of bytes;
    // If it is a string (e.g. '100kb', '5mb'), the value will be parsed.
    // Environment variable: SERVER_MAX_PAYLOAD_SIZE_LIMIT.
    // Default: "3mb".
    maxPayloadSizeLimit?: number | string

    // Delay in milliseconds between each heartbeat that the server will send to the clients.
    // Environment variable: SERVER_HEARTBEAT_INTERVAL.
    // Default: 5000.
    heartbeatInterval?: number
}

export interface HealthServiceConfig {
    // Health service port.
    // Environment variable: HEALTH_SERVICE_PORT.
    // Default: 9000.
    port: number

    // Start health service only if K8s env is detected.
    // Environment variable: HEALTH_SERVICE_DETECT_KUBERNETES.
    // Default: true.
    detectKubernetes: boolean

    // Delays the shutdown handler by X milliseconds.
    // This value should match `readinessProbe.periodSeconds`.
    // Environment variable: HEALTH_SERVICE_SHUTDOWN_DELAY.
    // Default: 5000.
    shutdownDelay: number

    // Time in milliseconds before forceful termination if shutdown handlers do not complete.
    // Environment variable: HEALTH_SERVICE_SHUTDOWN_HANDLER_TIMEOUT.
    // Default: 10,000.
    shutdownHandlerTimeout: number
}

export interface EventBusConfig {
    // Redis configuration.
    redis: RedisConfig
}

export interface RedisConfig {
    // Redis URL for Server HA.
    // Environment variable: REDIS_URL.
    url?: string

    // Redis auto-reconnect strategy when connection is lost.
    autoReconnectStrategy: AutoReconnectStrategy

    // Redis request retry strategy when Redis request (publish, subscribe, etc.) fails.
    requestRetryStrategy: RequestRetryStrategy

    // If enabled, when a command can't be processed by Redis (being sent before the EventBus ready event),
    // it's added to the offline queue and will be executed when it can be processed.
    // Environment variable: REDIS_ENABLE_OFFLINE_QUEUE.
    // Default: true.
    enableOfflineQueue: boolean

    // If enabled, the EventBus will emit ready event when the Redis server reports that it is ready to receive commands (e.g. finish loading data from disk).
    // Otherwise, ready will be emitted immediately right after the Redis connect event.
    // NOTE: When a connection is established to Redis, the Redis server might still be loading the database from disk.
    // While loading, the Redis server does not respond to any commands. To work around this, when this option is true,
    // the ready event will be emitted only when the Redis server is able to process commands and its status is changed to ready.
    // Environment variable: REDIS_ENABLE_READY_CHECK.
    // Default: true.
    enableReadyCheck: boolean
}

export interface AutoReconnectStrategy {
    // Exponential backoff options that are used for reconnecting to Redis when the connection is lost.
    // The formula used to calculate the individual timeouts is:
    // Math.min(random * minTimeout * Math.pow(factor, attempt), maxTimeout)
    // Environment variables: REDIS_RECONNECT_BACKOFF_FACTOR, REDIS_RECONNECT_BACKOFF_INITIAL_TIMEOUT, REDIS_RECONNECT_BACKOFF_MAX_TIMEOUT, REDIS_RECONNECT_BACKOFF_RANDOMIZE.
    // Defaults: 1, 1000 (ms), Infinity, false.
    reconnectBackoff: ExponentialBackoffOptions

    // Maximum number of reconnection attempts when the connection to Redis is lost.
    // After this limit is exceeded, the connection will be lost "forever" and liveness probe will start to fail.
    // Set to -1 for unlimited.
    // Environment variable: REDIS_MAX_RECONNECT_ATTEMPTS.
    // Default: 20.
    maxReconnectAttempts: number
}

export interface RequestRetryStrategy {
    // Maximum number of retry attempts for a pending Redis command before it gets flushed with an error.
    // Environment variable: REDIS_MAX_RETRIES_PER_REQUEST.
    // Default: -1 (unlimited).
    maxRetriesPerRequest: number
}
```

