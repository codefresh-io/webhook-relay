import { LoggerService } from '@codefresh-io/logger'

import { EventBus } from './types'
import { EventBusConfig } from '../config'
import { RedisEventBus } from './redis.eventbus'
import { LocalEventBus } from './local.eventbus'

export * from './types'

export const createEventBus = (config: EventBusConfig, logger: LoggerService = console): EventBus => {
    return config.redis.url ?
        new RedisEventBus(config, logger) :
        new LocalEventBus()
}
