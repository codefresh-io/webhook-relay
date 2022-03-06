import { createLightship } from 'lightship'

import { Server } from './server'
import { config } from './config'
import { EventBus } from './eventbus'
import { registerUncaughtErrorsHandler } from './utils'

async function main(): Promise<void> {
    const logger = console
    const healthService = await createLightship(config.healthService)
    const eventbus = new EventBus(config.eventbus)
    const server = new Server(config.server, eventbus, logger)

    server.start(
        () => {
            healthService.signalReady()
            logger.info(`Server is listening on port ${config.server.port}.`)
        },
        (err) => {
            logger.error(err)
            healthService.shutdown()
        }
    )

    healthService.registerShutdownHandler(async () => {
        // Wait for a few seconds (`shutdownDelay` property), and then
        logger.info('Starting graceful shutdown...')
        // Stop accepting new connections, close all keep-alive connections and
        // wait for all active requests to finish
        await server.close()
        // Close eventbus connection
        eventbus.close()
        // Shut down completely
        logger.info('Bye.')
        // For more info: https://github.com/gajus/lightship#best-practices
    })
    registerUncaughtErrorsHandler((...args) => {
        logger.error('Uncaught Error:', ...args)
    })
}

main()
