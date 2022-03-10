export function isValueInEnum<Enum extends Record<any, any>>(e: Enum, value: string): boolean {
    return Object.values(e).includes(value)
}

export function enumValuesToString<Enum extends Record<any, any>>(e: Enum): string {
    return Object.values(e).join(', ')
}
