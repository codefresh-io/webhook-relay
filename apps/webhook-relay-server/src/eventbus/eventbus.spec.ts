import { createEventBus } from './index'
import { config } from '../config'

/**
 * Mocks 'emit' method of private field 'emitter'
 * @param eventbus
 * @param mock
 */
const mockEmit = (eventbus: any, mock: any): void => {
    eventbus.emitter = { emit: mock }
}

describe('EventBus', () => {
    describe('LocalEventBus', function () {
        it('should emit an event locally without Redis', async () => {
            const eventbus = createEventBus({
                redis: {
                    ...config.eventbus.redis,
                    url: undefined, // should create local eventbus
                },
            })
            await eventbus.start()
            mockEmit(eventbus, jest.fn())
            await eventbus.publish('some-channel', { foo: true })

            // 'emitter' is a private field and needs to be type asserted to 'any'
            expect((eventbus as any).emitter.emit).toHaveBeenCalled()
            expect((eventbus as any).emitter.emit).toHaveBeenCalledWith('some-channel', { foo: true })

            await eventbus.close()
        })
    })

    describe.skip('RedisEventBus', function () {
        it('should publish an event to Redis', async () => {
            const eventbus = createEventBus({
                redis: {
                    ...config.eventbus.redis,
                    url: 'redis://localhost:6379', // should create redis eventbus
                },
            })
            await eventbus.start()

            const pubSpy = jest.spyOn((eventbus as any).pub, 'publish')

            await eventbus.publish('some-channel', { foo: true })


            // Ensure that it published the event to Redis
            expect(pubSpy).toHaveBeenCalled()

            await eventbus.close()
        })

        it('should receive an event and emit it locally', async () => {
            const eventbus = createEventBus({
                redis: {
                    ...config.eventbus.redis,
                    url: 'redis://localhost:6379', // should create redis eventbus
                },
            })
            await eventbus.start()
            mockEmit(eventbus, jest.fn());

            // Emit the event to the subscriber
            (eventbus as any).sub.emit(
                'message',
                null,
                JSON.stringify({ channel: 'example', payload: { foo: true } })
            )

            expect((eventbus as any).emitter.emit).toHaveBeenCalled()
            expect((eventbus as any).emitter.emit.mock.calls[0][0]).toBe('example')
            expect((eventbus as any).emitter.emit.mock.calls[0][1]).toEqual({ foo: true })

            await eventbus.close()
        })
    })
})
