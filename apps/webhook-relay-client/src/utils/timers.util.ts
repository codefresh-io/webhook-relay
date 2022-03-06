export class Timer {
    private id: number

    constructor(
        private handler: TimerHandler,
        private timeout: number
    ) {}

    start(): void {
        this.id = setTimeout(this.handler, this.timeout)
    }

    stop(): void {
        clearTimeout(this.id)
    }

    reset(): void {
        this.stop()
        this.start()
    }
}
