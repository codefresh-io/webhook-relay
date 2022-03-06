import { Config } from './types'

export * from './types'

export const config: Config = {
    server: {
        port: Number(process.env.PORT || 3000),
        heartbeatIntervalSecs: Number(process.env.SERVER_HEARTBEAT_INTERVAL_SECS || 5),
    },
    eventbus: {
        redisUrl: process.env.REDIS_URL,
    },
    healthService: {
        port: Number(process.env.HEALTH_SERVICE_PORT || 9000),
        detectKubernetes: process.env.HEALTH_SERVICE_DETECT_KUBERNETES === 'true',
        shutdownDelay: Number(process.env.HEALTH_SERVICE_SHUTDOWN_DELAY_SECS || 5) * 1000,
        shutdownHandlerTimeout: Number(process.env.HEALTH_SERVICE_SHUTDOWN_HANDLER_TIMEOUT_SECS || 10) * 1000,
    },
}
