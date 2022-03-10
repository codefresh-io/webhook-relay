export function parseList<DefaultValue = Array<string>>(
    value: string | undefined,
    defaultValue: DefaultValue
): Array<string> | DefaultValue {
    if (!value) return defaultValue

    return value.split(',')
}

export function parseBoolean<DefaultValue = boolean>(
    value: string | undefined,
    defaultValue: DefaultValue
): boolean | DefaultValue {
    if (!value) return defaultValue

    return ([ '1', 'true' ].includes(value))
}

export function parseNumber<DefaultValue = number>(
    value: string | undefined,
    defaultValue: DefaultValue
): number | DefaultValue {
    if (!value) return defaultValue

    return Number.parseFloat(value)
}
