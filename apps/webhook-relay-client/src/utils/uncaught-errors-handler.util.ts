export function registerUncaughtErrorsHandler(handler: (...args: any[]) => void): void {
    process.on('unhandledRejection', handler)
    process.on('uncaughtException', handler)
}
