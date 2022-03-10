export function parseList<DefaultValueType = Array<string>>(
    value: string | undefined,
    defaultValue: DefaultValueType
): Array<string> | DefaultValueType {
    if (!value) return defaultValue

    return value.split(',')
}

export function parseBoolean<DefaultValueType = boolean>(
    value: string | undefined,
    defaultValue: DefaultValueType
): boolean | DefaultValueType {
    if (!value) return defaultValue

    return ([ '1', 'true' ].includes(value))
}

export function parseNumber<DefaultValueType = number>(
    value: string | undefined,
    defaultValue: DefaultValueType
): number | DefaultValueType {
    if (!value) return defaultValue

    return Number.parseFloat(value)
}
