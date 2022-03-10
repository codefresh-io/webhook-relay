export interface LoggerService {
    info(message: any, ...meta: any[]): any
    error(message: any, ...meta: any[]): any
    warn(message: any, ...meta: any[]): any
    debug(message: any, ...meta: any[]): any
}

export enum LogLevel {
    INFO = 'info',
    DEBUG = 'debug',
    WARN = 'warn',
    ERROR = 'error',
}

export enum LogTransport {
    CONSOLE = 'console',
    FILE = 'file',
}
