import { parseNumber } from '@codefresh-io/common'

import { Config } from './types'

export * from './types'

export const config: Config = {
    client: {
        sourceUrl: process.env.SOURCE_URL || 'http://127.0.0.1:3000/webhooks/test-runtime1',
        targetBaseUrl: process.env.TARGET_BASE_URL || 'http://127.0.0.1:3001',
        reconnectIntervalSecs: parseNumber(process.env.RECONNECT_INTERVAL_SECS, 1),
        serverHeartbeatTimeoutSecs: parseNumber(process.env.SERVER_HEARTBEAT_TIMEOUT_SECS, 10),
    },
}
