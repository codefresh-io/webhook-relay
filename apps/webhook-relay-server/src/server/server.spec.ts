import request from 'supertest'
import EventSource from 'eventsource'
import { LoggerService } from '@codefresh-io/logger'
import { AUTH_TOKEN_HTTP_HEADER } from '@codefresh-io/common'

import { Server } from './index'
import { createEventBus, EventBus } from '../eventbus'
import { EventBusConfig, ServerConfig, config } from '../config'
import http from 'http'

const getNativeHttpServer = (serverWrap: Server): http.Server => {
    return (serverWrap as any).server // 'server' is a private field
}

interface EventSourceConfig {
    channel: string
    headers?: Record<string, string>
}

interface InitTestArgs {
    eventSourceConfig: EventSourceConfig
    eventbusConfig?: EventBusConfig
    serverConfig?: ServerConfig
    logger?: LoggerService
}

interface InitTestResolveValue {
    eventbus: EventBus
    server: Server
    eventSource: EventSource
}

const defaultServerConfig: ServerConfig = {
    port: 0, // allow the server to select an available port
    heartbeatInterval: 100,
}
const defaultEventbusConfig: EventBusConfig = {
    ...config.eventbus,
}

const initTest = async ({
    eventSourceConfig,
    eventbusConfig = defaultEventbusConfig,
    serverConfig = defaultServerConfig,
    logger = console,
}: InitTestArgs): Promise<InitTestResolveValue> => {
    // init eventbus
    const eventbus = createEventBus(eventbusConfig, logger)
    await eventbus.start()

    // init server
    const server = new Server(serverConfig, eventbus, logger)
    const serverStartedPromise = new Promise(((resolve, reject) => {
        server.start(() => resolve(null), reject)
    }))
    await serverStartedPromise

    // init eventSource (client)
    const { port } = getNativeHttpServer(server).address() as { port: number }
    const eventSource = new EventSource(
        `http://127.0.0.1:${port}/subscribe/${eventSourceConfig.channel}/`,
        eventSourceConfig.headers && { headers: eventSourceConfig.headers },
    )

    return { eventbus, server, eventSource }
}

describe('Server', function () {
    describe('GET /subscribe/:channel', function () {
        const channel = 'fake-channel'
        let server: Server
        let eventbus: EventBus
        let client: EventSource

        afterEach(async function () {
            await server.close()
            eventbus.close()
            client.close()
        })

        describe('given that the client subscribed to SSE successfully', function () {
            beforeEach(async function () {
                const result = await initTest({ eventSourceConfig: { channel } })
                server = result.server
                eventbus = result.eventbus
                client = result.eventSource

                const eventSourceReadyPromise = new Promise(resolve => {
                    client.addEventListener('ready', () => resolve(null))
                })
                await eventSourceReadyPromise
            })

            it('should get heartbeat from the server', function (done) {
                client.addEventListener('heartbeat', () => done())
            })
        })

        describe('given auth token', function () {
            describe('when auth token is provided to both client and server', function () {
                describe('when auth token is the same in both client and server', function () {
                    const authToken = 'test'

                    beforeEach(async function () {
                        const result = await initTest({
                            serverConfig: {
                                ...defaultServerConfig,
                                authToken,
                            },
                            eventSourceConfig: {
                                channel,
                                headers: { [AUTH_TOKEN_HTTP_HEADER]: authToken },
                            },
                        })
                        server = result.server
                        eventbus = result.eventbus
                        client = result.eventSource
                    })

                    it('should get heartbeat from the server', function (done) {
                        client.addEventListener('heartbeat', () => done())
                    })
                })

                describe('when auth token in client is different from auth token in server', function () {
                    const clientAuthToken = 'test1'
                    const serverAuthToken = 'test2'

                    beforeEach(async function () {
                        const result = await initTest({
                            serverConfig: {
                                ...defaultServerConfig,
                                authToken: serverAuthToken,
                            },
                            eventSourceConfig: {
                                channel,
                                headers: { [AUTH_TOKEN_HTTP_HEADER]: clientAuthToken },
                            },
                        })
                        server = result.server
                        eventbus = result.eventbus
                        client = result.eventSource
                    })

                    it('should close connection with error', function (done) {
                        client.addEventListener('error', (error: any) => {
                            expect(error.status).toEqual(401)
                            done()
                        })
                    })
                })
            })

            describe('when auth token is provided only to the client', function () {
                const clientAuthToken = 'test1'

                beforeEach(async function () {
                    const result = await initTest({
                        eventSourceConfig: {
                            channel,
                            headers: { [AUTH_TOKEN_HTTP_HEADER]: clientAuthToken },
                        },
                    })
                    server = result.server
                    eventbus = result.eventbus
                    client = result.eventSource
                })

                it('should get heartbeat from the server', function (done) {
                    client.addEventListener('heartbeat', () => done())
                })
            })

            describe('when auth token is provided only to the server', function () {
                const serverAuthToken = 'test1'

                beforeEach(async function () {
                    const result = await initTest({
                        serverConfig: {
                            ...defaultServerConfig,
                            authToken: serverAuthToken,
                        },
                        eventSourceConfig: {
                            channel,
                        },
                    })
                    server = result.server
                    eventbus = result.eventbus
                    client = result.eventSource
                })

                it('should close connection with error', function (done) {
                    client.addEventListener('error', (error: any) => {
                        expect(error.status).toEqual(401)
                        done()
                    })
                })
            })
        })
    })

    describe('POST /webhooks/:channel', function () {
        const channel = 'fake-channel'
        let server: Server
        let eventbus: EventBus
        let client: EventSource

        beforeEach(function (done) {
            initTest({ eventSourceConfig: { channel } })
                .then((initResult) => {
                    server = initResult.server
                    eventbus = initResult.eventbus
                    client = initResult.eventSource

                    // Wait for event source to be ready
                    client.addEventListener('ready', () => done())
                })
                .catch(done)
        })

        afterEach(async function () {
            await server.close()
            eventbus.close()
            client.close()
        })

        describe('when payload is of json type', function () {
            it('should publish payload', function (done) {
                const payload = { test: true }

                client.addEventListener('message', msg => {
                    const data = JSON.parse(msg.data)
                    // data.body is the raw request body, therefore it should be stringified
                    expect(data.body).toEqual(JSON.stringify(payload))

                    done()
                })

                request(getNativeHttpServer(server))
                    .post(`/webhooks/${channel}/`)
                    .set('content-type', 'application/json')
                    .send(payload)
                    .expect(200)
                    .catch(done)
            })

            it('should publish json content-type header', function (done) {
                const payload = { test: true }

                client.addEventListener('message', msg => {
                    const data = JSON.parse(msg.data)
                    // data.body is the raw request body, therefore it should be stringified
                    expect(data.headers['content-type']).toEqual('application/json')

                    done()
                })

                request(getNativeHttpServer(server))
                    .post(`/webhooks/${channel}/`)
                    .set('content-type', 'application/json')
                    .send(payload)
                    .expect(200)
                    .catch(done)
            })
        })

        describe('when payload is of x-www-form-urlencoded type', function () {
            it('should publish payload', function (done) {
                const payload = { payload: 'true' }

                client.addEventListener('message', msg => {
                    const data = JSON.parse(msg.data)
                    // data.body is the raw request body, therefore it should be stringified
                    expect(data.body).toEqual(new URLSearchParams(payload).toString())

                    done()
                })

                request(getNativeHttpServer(server))
                    .post(`/webhooks/${channel}/`)
                    .set('content-type', 'application/x-www-form-urlencoded')
                    .send(payload)
                    .expect(200)
                    .catch(done)
            })

            it('should publish x-www-form-urlencoded content-type header', function (done) {
                const payload = { test: true }

                client.addEventListener('message', msg => {
                    const data = JSON.parse(msg.data)
                    // data.body is the raw request body, therefore it should be stringified
                    expect(data.headers['content-type']).toEqual('application/x-www-form-urlencoded')

                    done()
                })

                request(getNativeHttpServer(server))
                    .post(`/webhooks/${channel}/`)
                    .set('content-type', 'application/x-www-form-urlencoded')
                    .send(payload)
                    .expect(200)
                    .catch(done)
            })
        })

        it('should publish custom header', function (done) {
            const payload = { test: true }

            client.addEventListener('message', msg => {
                const data = JSON.parse(msg.data)
                expect(data.headers['x-foo']).toEqual('bar')

                done()
            })

            request(getNativeHttpServer(server))
                .post(`/webhooks/${channel}/`)
                .set('X-Foo', 'bar')
                .send(payload)
                .expect(200)
                .catch(done)
        })

        it('should publish url path', function (done) {
            const payload = { test: true }
            const path = `/webhooks/${channel}/this-is-a-test`

            client.addEventListener('message', msg => {
                const data = JSON.parse(msg.data)
                expect(data.path).toEqual(path)

                done()
            })

            request(getNativeHttpServer(server))
                .post(path)
                .send(payload)
                .expect(200)
                .catch(done)
        })

        it('should publish query params', function (done) {
            const payload = { test: true }
            const path = `/webhooks/${channel}/this-is-a-test`
            const queryParams = { a: '1', b: '2', c: '3' }

            client.addEventListener('message', msg => {
                const data = JSON.parse(msg.data)
                expect(data.query).toEqual(queryParams)

                done()
            })

            request(getNativeHttpServer(server))
                .post(path)
                .query(queryParams)
                .send(payload)
                .expect(200)
                .catch(done)
        })
    })
})
