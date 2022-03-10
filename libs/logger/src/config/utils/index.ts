import { LoggerConfig } from '../types'
import { LogLevel, LogTransport } from '../../types'

export function parseList(value?: string): Array<string> | undefined {
    if (!value) return

    return value.split(',')
}

export function isValueInEnum<Enum extends Record<any, any>>(e: Enum, value: string): boolean {
    return Object.values(e).includes(value)
}

export function enumValuesToString<Enum extends Record<any, any>>(e: Enum): string {
    return Object.values(e).join(', ')
}

export function validateConfig({ level, transportKinds }: LoggerConfig): void {
    if (level !== undefined && !isValueInEnum(LogLevel, level)) {
        throw new Error(`Log level must be one of: ${enumValuesToString(LogLevel)}`)
    }

    transportKinds?.forEach(kind => {
        if (!isValueInEnum(LogTransport, kind)) {
            throw new Error(`Log transport must be one of: ${enumValuesToString(LogTransport)}`)
        }
    })
}
