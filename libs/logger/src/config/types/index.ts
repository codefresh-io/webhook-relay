import { LogLevel, LogTransport } from '../../types'

export interface LoggerConfig {
    level?: LogLevel,
    transportKinds?: LogTransport[],
    appName?: string
}
