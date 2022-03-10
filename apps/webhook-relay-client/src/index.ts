import { Logger } from '@codefresh-io/logger'

import { Client } from './client'
import { config } from './config'
import { registerShutdownHandler, registerUncaughtErrorsHandler } from './utils'

function main(): void {
    const logger = new Logger()
    const client = new Client(config.client, logger)

    client.start()

    registerShutdownHandler(() => {
        logger.info('Starting graceful shutdown...')
        // Disconnect from the server and stop forwarding events
        client.close()
        logger.info('Bye.')
    })
    registerUncaughtErrorsHandler((...args) => {
        logger.error('Uncaught Error:', ...args)
    })
}

main()
