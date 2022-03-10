import { enumValuesToString, isValueInEnum } from '@codefresh-io/common'

import { LoggerConfig } from '../types'
import { LogLevel, LogTransport } from '../../types'

export function validateConfig({ level, transports }: LoggerConfig): void {
    if (!isValueInEnum(LogLevel, level)) {
        throw new Error(`Log level must be one of: ${enumValuesToString(LogLevel)}`)
    }

    transports.forEach(transport => {
        if (!isValueInEnum(LogTransport, transport)) {
            throw new Error(`Log transport must be one of: ${enumValuesToString(LogTransport)}`)
        }
    })
}
