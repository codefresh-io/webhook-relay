import winston from 'winston'
import { SPLAT } from 'triple-beam'

import { LoggerService, LogTransport } from './types'
import { LoggerConfig } from './config'

const DEFAULT_LABEL = 'default'

export function createLoggerClass({ level, transports, appName }: LoggerConfig): new (label?: string) => LoggerService {
    const supportedTransports: Record<LogTransport, winston.transport> = {
        [LogTransport.CONSOLE]: new winston.transports.Console({
            format: winston.format.colorize({ all: true }),
        }),
        [LogTransport.FILE]: new winston.transports.File({
            filename: `${appName}.log`,
        }),
    }

    return class Logger implements LoggerService {
        private logger: winston.Logger

        constructor(label?: string) {
            let withLabel = true
            if (!label) {
                withLabel = false
                label = DEFAULT_LABEL
            }

            if (winston.loggers.has(label)) {
                this.logger = winston.loggers.get(label)
                return
            }

            this.logger = winston.loggers.add(label, {
                level,
                transports: transports.map(transport => supportedTransports[transport]),
                format: winston.format.combine(
                    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    winston.format.errors({ stack: true }),
                    ...(withLabel ? [ winston.format.label({ label }) ] : []),
                    winston.format.printf(this.logFormat.bind(this)),
                ),
            })
        }

        debug(message: any, ...meta: any[]): any {
            this.logger.debug(message, ...meta)
        }

        error(message: any, ...meta: any[]): any {
            this.logger.error(message, ...meta)
        }

        info(message: any, ...meta: any[]): any {
            this.logger.info(message, ...meta)
        }

        warn(message: any, ...meta: any[]): any {
            this.logger.warn(message, ...meta)
        }

        private metaFormat(meta: any): string {
            const splat: any[] | undefined = meta[SPLAT]
            if (!splat) return ''

            return splat.reduce((total, curr) => total + `${typeof curr === 'object' ? JSON.stringify(curr) : curr} `, '')
        }

        private logFormat({ message, stack, timestamp, level, label, ...meta }: winston.Logform.TransformableInfo): string {
            message = typeof message === 'object' ? JSON.stringify(message) : message
            message = stack ? `${message} -- ${stack}` : message
            label = label ? `[${label}] ` : ''

            return `[${timestamp}] [${level.toUpperCase()}] ${label}>>>> ${message} ${this.metaFormat(meta)}`
        }
    }
}
