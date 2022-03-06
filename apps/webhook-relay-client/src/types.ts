export interface LoggerService {
    info(message: any, ...meta: any[]): any
    error(message: any, ...meta: any[]): any
    warn(message: any, ...meta: any[]): any
    debug?(message: any, ...meta: any[]): any
}
