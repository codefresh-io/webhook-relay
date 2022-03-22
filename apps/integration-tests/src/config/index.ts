import { parseNumber } from '@codefresh-io/common'

import { Config } from './types'

export const config: Config = {
    webhookRelayServerBaseUrl: process.env.WEBHOOK_RELAY_SERVER_BASE_URL || 'http://localhost:3000',
    webhookRelayChannel: process.env.WEBHOOK_RELAY_CHANNEL || 'test',
    testServerPort: parseNumber(process.env.TEST_SERVER_PORT, 3001),
}
