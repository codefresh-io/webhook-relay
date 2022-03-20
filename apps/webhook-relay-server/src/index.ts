import { createLightship } from 'lightship'
import { Logger } from '@codefresh-io/logger'
import { registerUncaughtErrorsHandler } from '@codefresh-io/common'

import { Server } from './server'
import { config } from './config'
import { EventBus } from './eventbus'

async function main(): Promise<void> {
    const logger = new Logger()
    const healthService = await createLightship(config.healthService)
    const eventbus = new EventBus(config.eventbus, logger)
    const server = new Server(config.server, eventbus, logger)

    await eventbus.start(
        (isFirstTime: boolean) => {
            if (!isFirstTime) {
                healthService.signalReady()
            }
            logger.info(`EventBus is ready`)
        },
        () => {
            healthService.signalNotReady()
            logger.warn(`EventBus is not ready`)
        }
    )
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
        // Wait for a few milliseconds (`shutdownDelay` property), and then
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
