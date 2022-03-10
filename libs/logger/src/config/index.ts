import { LogLevel, LogTransport } from '../types'
import { parseList, validateConfig } from './utils'
import { LoggerConfig } from './types'

export const config: LoggerConfig = {
    level: process.env.LOG_LEVEL as (LogLevel | undefined),
    transportKinds: parseList(process.env.LOG_TRANSPORTS_LIST) as (LogTransport[] | undefined),
    appName: process.env.APP_NAME,
}

validateConfig(config)

export * from './types'
