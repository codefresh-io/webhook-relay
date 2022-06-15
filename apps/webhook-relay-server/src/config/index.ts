import { parseNumber, parseBoolean } from '@codefresh-io/common'

import { Config } from './types'

export * from './types'

export const config: Config = {
    server: {
        port: parseNumber(process.env.SERVER_PORT, 3000),
        maxPayloadSizeLimit: process.env.SERVER_MAX_PAYLOAD_SIZE_LIMIT || '3mb',
        heartbeatInterval: parseNumber(process.env.SERVER_HEARTBEAT_INTERVAL, 5 * 1000),
        authToken: process.env.AUTH_TOKEN,
    },
    eventbus: {
        redis: {
            url: process.env.REDIS_URL,
            autoReconnectStrategy: {
                reconnectBackoff: {
                    factor: parseNumber(process.env.REDIS_RECONNECT_BACKOFF_FACTOR, 1),
                    initialTimeout: parseNumber(process.env.REDIS_RECONNECT_BACKOFF_INITIAL_TIMEOUT, 1 * 1000),
                    maxTimeout: parseNumber(process.env.REDIS_RECONNECT_BACKOFF_MAX_TIMEOUT, Number.POSITIVE_INFINITY),
                    randomize: parseBoolean(process.env.REDIS_RECONNECT_BACKOFF_RANDOMIZE, false),
                },
                maxReconnectAttempts: parseNumber(process.env.REDIS_MAX_RECONNECT_ATTEMPTS, 20),
            },
            requestRetryStrategy: {
                maxRetriesPerRequest: parseNumber(process.env.REDIS_MAX_RETRIES_PER_REQUEST, -1), // -1 => unlimited
            },
            enableOfflineQueue: parseBoolean(process.env.REDIS_ENABLE_OFFLINE_QUEUE, true),
            enableReadyCheck: parseBoolean(process.env.REDIS_ENABLE_READY_CHECK, true),
        },
    },
    healthService: {
        port: parseNumber(process.env.HEALTH_SERVICE_PORT, 9000),
        detectKubernetes: parseBoolean(process.env.HEALTH_SERVICE_DETECT_KUBERNETES, true),
        shutdownDelay: parseNumber(process.env.HEALTH_SERVICE_SHUTDOWN_DELAY, 5 * 1000),
        shutdownHandlerTimeout: parseNumber(process.env.HEALTH_SERVICE_SHUTDOWN_HANDLER_TIMEOUT, 10 * 1000),
    },
}
