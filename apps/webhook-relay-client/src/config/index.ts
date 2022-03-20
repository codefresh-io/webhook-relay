import { parseNumber } from '@codefresh-io/common'

import { Config } from './types'

export * from './types'

export const config: Config = {
    client: {
        sourceUrl: process.env.SOURCE_URL || 'http://127.0.0.1:3000/webhooks/test-runtime1',
        targetBaseUrl: process.env.TARGET_BASE_URL || 'http://127.0.0.1:3001',
        reconnectInterval: parseNumber(process.env.RECONNECT_INTERVAL, 1 * 1000),
        serverHeartbeatTimeout: parseNumber(process.env.SERVER_HEARTBEAT_TIMEOUT, 10 * 1000),
    },
}
