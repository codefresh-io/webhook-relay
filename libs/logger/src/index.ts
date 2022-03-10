import { createLoggerClass } from './logger'
import { config } from './config'

export * from './types'

export const Logger = createLoggerClass(config)

