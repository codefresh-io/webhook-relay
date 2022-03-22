import request from 'supertest'
import EventSource from 'eventsource'

import { Server } from '../src/server'
import { createEventBus, EventBus } from '../src/eventbus'
import { EventBusConfig, ServerConfig, config } from '../src/config'
import http from 'http'

const getNativeHttpServer = (serverWrap: Server): http.Server => {
    return (serverWrap as any).server // 'server' is a private field
}

describe('Server', function () {
    const serverConfig: ServerConfig = {
        port: 0, // allow the server to select an available port
        heartbeatInterval: 100,
    }
    const eventbusConfig: EventBusConfig = { ...config.eventbus }
    const channel = 'fake-channel'
    const logger = console
    let server: Server
    let eventbus: EventBus
    let client: EventSource

    beforeEach(function (done) {
        eventbus = createEventBus(eventbusConfig, logger)
        eventbus.start()
            .then(() => {
                server = new Server(serverConfig, eventbus, logger)
                server.start(
                    () => {
                        const { port } = getNativeHttpServer(server).address() as { port: number }
                        client = new EventSource(`http://127.0.0.1:${port}/subscribe/${channel}/`)

                        // Wait for event source to be ready
                        client.addEventListener('ready', () => done())
                    },
                    done
                )
            })
            .catch(done)
    })

    afterEach(async function () {
        await server.close()
        eventbus.close()
        client.close()
    })

    describe('GET /webhooks/:channel', function () {
        describe('given that the client subscribed to SSE successfully (beforeEach)', function () {
            it('should get heartbeat event', function (done) {
                client.addEventListener('heartbeat', () => done())
            })
        })
    })

    describe('POST /webhooks/:channel', function () {
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
