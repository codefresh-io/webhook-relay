import { createLightship } from 'lightship'
import { Logger } from '@codefresh-io/logger'
import { registerUncaughtErrorsHandler } from '@codefresh-io/common'

import { config } from './config'
import { Server } from './server'
import { createEventBus } from './eventbus'

async function main(): Promise<void> {
    const logger = new Logger()
    const healthService = await createLightship(config.healthService)
    const eventbus = createEventBus(config.eventbus, logger)
    const server = new Server(config.server, eventbus, logger)

    await eventbus.start(
        (isFirstTime: boolean) => {
            logger.info(`EventBus is ready`)

            if (!isFirstTime) {
                healthService.signalReady()
                return
            }

            server.start(
                () => {
                    logger.info(`Server is listening on port ${config.server.port}.`)
                    healthService.signalReady()
                },
                (err) => {
                    logger.error('Server error:', err)
                    healthService.shutdown()
                }
            )
        },
        () => {
            logger.error(`EventBus is not ready`)
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
