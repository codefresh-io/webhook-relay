import { parseList } from '@codefresh-io/common'

import { LogLevel, LogTransport } from '../types'
import { validateConfig } from './utils'
import { LoggerConfig } from './types'

export const config: LoggerConfig = {
    level: process.env.LOG_LEVEL as (LogLevel | undefined) || LogLevel.DEBUG,
    transports: parseList(process.env.LOG_TRANSPORTS_LIST, [ LogTransport.CONSOLE ]) as LogTransport[],
    appName: process.env.APP_NAME || 'App',
}

validateConfig(config)

export * from './types'
