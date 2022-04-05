export interface EventBus {
    /**
     * Start EventBus and connect to Redis (if Redis enabled)
     * @param {Function} onReady - callback that is called when the EventBus is marked as ready
     * @param {Function} onNotReady - callback that is called when the EventBus is marked as not ready
     */
    start(onReady?: (isFirstTime: boolean) => void, onNotReady?: () => void): Promise<void>

    /**
     * Close EventBus and disconnect from Redis gracefully (if Redis enabled)
     */
    close(): void

    /**
     * Subscribe a listener to events on a specific channel
     * @param {string} channel - Channel name
     * @param {Function} listener - Handler function that will listen to events on the channel
     */
    subscribe(channel: string, listener: (...args: any[]) => void): void

    /**
     * Unsubscribe a listener from a specific channel
     * @param {string} channel - Channel name
     * @param {Function} listener - Handler function that needs to be unsubscribed from the channel
     */
    unsubscribe(channel: string, listener: (...args: any[]) => void): void

    /**
     * Get the number of subscribers listening to a channel on this server instance
     * @param {string} channel - Channel name
     */
    subscribersCount(channel: string): number

    /**
     * Publish an event to all the subscribers
     * @param {string} channel - Channel name
     * @param {any} event - Event payload
     */
    publish(channel: string, event: any): Promise<void>
}
