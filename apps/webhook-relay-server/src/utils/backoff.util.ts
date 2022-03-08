export interface ExponentialBackoffOptions {
    // The exponential factor to use.
    // Default: 1
    factor?: number

    // The initial duration in milliseconds before starting the first retry
    // Default: 1000
    initialTimeout?: number

    // The maximum duration in milliseconds between two retries
    // Default: Infinity
    maxTimeout?: number

    // Randomizes the timeouts by multiplying with a factor between 1 and 2.
    // Default: false
    randomize?: boolean
}

export type BackoffDelayCalculator = (attempt: number) => number

/**
 * Creates a function that calculates the backoff timeout according to the current retry attempt
 * @param {number} factor - The exponential factor to use
 * @param {number} initialTimeout - The initial duration in milliseconds before starting the first retry
 * @param {number} maxTimeout - The maximum duration in milliseconds between two retries
 * @param {boolean} randomize - Randomizes the timeouts by multiplying with a factor between 1 and 2
 */
export function createBackoffTimeoutCalculator({
    factor = 1,
    initialTimeout = 1000,
    maxTimeout = Number.POSITIVE_INFINITY,
    randomize = false,
}: ExponentialBackoffOptions): BackoffDelayCalculator {
    return function (attempt) {
        const random = randomize ? (Math.random() + 1) : 1
        const timeout = Math.round(random * Math.max(initialTimeout, 1) * Math.pow(factor, attempt))
        return Math.min(timeout, maxTimeout)
    }
}
