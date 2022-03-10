import { Config } from './types'

export * from './types'

export const config: Config = {
    server: {
        port: Number(process.env.PORT || 3000),
        heartbeatIntervalSecs: Number(process.env.SERVER_HEARTBEAT_INTERVAL_SECS || 5),
    },
    eventbus: {
        redis: {
            url: process.env.REDIS_URL,
            autoReconnectStrategy: {
                reconnectBackoff: {
                    factor: Number(process.env.REDIS_RECONNECT_BACKOFF_FACTOR || 1),
                    initialTimeout: Number(process.env.REDIS_RECONNECT_BACKOFF_INITIAL_TIMEOUT || 1000),
                    maxTimeout: Number(process.env.REDIS_RECONNECT_BACKOFF_MAX_TIMEOUT || Number.POSITIVE_INFINITY),
                    randomize: process.env.REDIS_RECONNECT_BACKOFF_RANDOMIZE === 'true',
                },
                maxReconnectAttempts: process.env.REDIS_MAX_RECONNECT_ATTEMPTS ?
                    Number(process.env.REDIS_MAX_RECONNECT_ATTEMPTS) :
                    null, // null => unlimited
                maxReconnectAttemptsBeforeReadinessFailure: Number(process.env.REDIS_MAX_RECONNECT_ATTEMPTS_BEFORE_READINESS_FAIL || 20),
            },
            requestRetryStrategy: {
                maxRetriesPerRequest: process.env.REDIS_MAX_RETRIES_PER_REQUEST ?
                    Number(process.env.REDIS_MAX_RETRIES_PER_REQUEST) :
                    null, // null => unlimited
            },
            enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE ?
                process.env.REDIS_ENABLE_OFFLINE_QUEUE === 'true' :
                true,
        },
    },
    healthService: {
        port: Number(process.env.HEALTH_SERVICE_PORT || 9000),
        detectKubernetes: process.env.HEALTH_SERVICE_DETECT_KUBERNETES ?
            process.env.HEALTH_SERVICE_DETECT_KUBERNETES === 'true' :
            true,
        shutdownDelay: Number(process.env.HEALTH_SERVICE_SHUTDOWN_DELAY || 5 * 1000),
        shutdownHandlerTimeout: Number(process.env.HEALTH_SERVICE_SHUTDOWN_HANDLER_TIMEOUT || 10 * 1000),
    },
}
