import { LogLevel, LogTransport } from '../../types'

export interface LoggerConfig {
    level: LogLevel,
    transports: LogTransport[],
    appName: string
}
