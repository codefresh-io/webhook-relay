export function registerShutdownHandler(
    gracefulShutdown: ((...args: any[]) => void) | ((...args: any[]) => Promise<void>),
    gracefulShutdownTimeout = 5 * 1000,
    signals = [ 'SIGINT', 'SIGTERM', 'SIGHUP' ],
): void {
    const handler = async (...args: any[]): Promise<void> => {
        setTimeout(() => process.exit(1), gracefulShutdownTimeout)
        await gracefulShutdown(...args)
    }
    signals.forEach(signal => {
        process.on(signal, handler)
    })
}
