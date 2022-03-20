import request from 'supertest'
import express from 'express'

import { setTimeout as delay } from 'timers/promises'
import {
    TestServer,
    verifyGithubPayload,
    githubPayloadSignatureHeaderName,
} from './server'
import {
    githubWebhookSecret,
    jsonGithubPayload,
    jsonGithubPayloadSha256Signature,
    urlencodedGithubPayload,
    urlencodedGithubPayloadSha256Signature,
} from './mock-data'
import { config } from './config'
// const config.webhookRelayChannel = process.env.WEBHOOK_RELAY_CLIENT_CHANNEL || 'test'

// jest.setTimeout(60 * 1000)

describe('Integration Tests', function () {
    describe('POST /webhooks/:channel', function () {
        let testServer: TestServer

        beforeEach(() => {
            testServer = new TestServer(config.port)
        })

        afterEach(async () => {
            await testServer.close()
        })

        describe('given the same channel that the Webhook Relay Client is listening to', function () {
            describe('when content-type is json', function () {
                it('should get a 200 response (ack) from the Webhook Relay Server', function (done) {
                    request(config.webhookRelayServerBaseUrl)
                        .post(`/webhooks/${config.webhookRelayChannel}/push-github`)
                        .set('content-type', 'application/json')
                        .send({ test: true })
                        .expect(200) // expect ack from Webhook Relay Server
                        .then(() => done())
                        .catch(done)
                })

                it('should forward the payload to the target test server', function (done) {
                    const payload = { test: true }
                    const rootRouter = express.Router()
                    rootRouter.post(`/webhooks/${config.webhookRelayChannel}/push-github`, function (req, res) {
                        expect(req.body).toEqual(payload)
                        res.status(200).end()
                        done()
                    })
                    rootRouter.use('*', (req, res) => {
                        res.status(200).end()
                        done(new Error('Wrong route'))
                    })

                    testServer.start({
                        rootRouter,
                        done,
                        onStart: () => {
                            // send request to Webhook Relay and expect it to forward the request to the test server
                            request(config.webhookRelayServerBaseUrl)
                                .post(`/webhooks/${config.webhookRelayChannel}/push-github`)
                                .set('content-type', 'application/json')
                                .send(payload)
                                .catch(done)
                        },
                    })
                })

                it('should forward json content-type header to the target test server', function (done) {
                    const payload = { test: true }
                    const rootRouter = express.Router()
                    rootRouter.post(`/webhooks/${config.webhookRelayChannel}/push-github`, function (req, res) {
                        expect(req.headers['content-type']).toEqual('application/json')
                        res.status(200).end()
                        done()
                    })
                    rootRouter.use('*', (req, res) => {
                        res.status(200).end()
                        done(new Error('Wrong route'))
                    })

                    testServer.start({
                        rootRouter,
                        done,
                        onStart: () => {
                            // send request to Webhook Relay and expect it to forward the request to the test server
                            request(config.webhookRelayServerBaseUrl)
                                .post(`/webhooks/${config.webhookRelayChannel}/push-github`)
                                .set('content-type', 'application/json')
                                .send(payload)
                                .catch(done)
                        },
                    })
                })
            })

            describe('when content-type is x-www-form-urlencoded', function () {
                it('should get a 200 response (ack) from the Webhook Relay Server', function (done) {
                    const payload = { test: 'true' }
                    request(config.webhookRelayServerBaseUrl)
                        .post(`/webhooks/${config.webhookRelayChannel}/push-github`)
                        .set('content-type', 'application/x-www-form-urlencoded')
                        .send(payload)
                        .expect(200) // expect ack from Webhook Relay Server
                        .then(() => done())
                        .catch(done)
                })

                it('should forward the payload to the target test server', function (done) {
                    const payload = { test: 'true' }
                    const rootRouter = express.Router()
                    rootRouter.post(`/webhooks/${config.webhookRelayChannel}/push-github`, function (req, res) {
                        expect(req.body).toEqual(payload)
                        res.status(200).end()
                        done()
                    })
                    rootRouter.use('*', (req, res) => {
                        res.status(200).end()
                        done(new Error('Wrong route'))
                    })

                    testServer.start({
                        rootRouter,
                        done,
                        onStart: () => {
                            // send request to Webhook Relay and expect it to forward the request to the test server
                            request(config.webhookRelayServerBaseUrl)
                                .post(`/webhooks/${config.webhookRelayChannel}/push-github`)
                                .set('content-type', 'application/x-www-form-urlencoded')
                                .send(payload)
                                .catch(done)
                        },
                    })
                })

                it('should forward x-www-form-urlencoded content-type header to the target test server', function (done) {
                    const payload = { test: 'true' }
                    const rootRouter = express.Router()
                    rootRouter.post(`/webhooks/${config.webhookRelayChannel}/push-github`, function (req, res) {
                        expect(req.headers['content-type']).toEqual('application/x-www-form-urlencoded')
                        res.status(200).end()
                        done()
                    })
                    rootRouter.use('*', (req, res) => {
                        res.status(200).end()
                        done(new Error('Wrong route'))
                    })

                    testServer.start({
                        rootRouter,
                        done,
                        onStart: () => {
                            // send request to Webhook Relay and expect it to forward the request to the test server
                            request(config.webhookRelayServerBaseUrl)
                                .post(`/webhooks/${config.webhookRelayChannel}/push-github`)
                                .set('content-type', 'application/x-www-form-urlencoded')
                                .send(payload)
                                .catch(done)
                        },
                    })
                })
            })

            it('should forward the query params to the target test server', function (done) {
                const payload = { test: 'true' }
                const queryParams = { a: '1', b: '2', c: '3' }
                const rootRouter = express.Router()
                rootRouter.post(`/webhooks/${config.webhookRelayChannel}/push-github`, function (req, res) {
                    expect(req.query).toEqual(queryParams)
                    res.status(200).end()
                    done()
                })
                rootRouter.use('*', (req, res) => {
                    res.status(200).end()
                    done(new Error('Wrong route'))
                })

                testServer.start({
                    rootRouter,
                    done,
                    onStart: () => {
                        // send request to Webhook Relay and expect it to forward the request to the test server
                        request(config.webhookRelayServerBaseUrl)
                            .post(`/webhooks/${config.webhookRelayChannel}/push-github`)
                            .query(queryParams)
                            .send(payload)
                            .catch(done)
                    },
                })
            })

            it('should forward custom headers to the target test server', function (done) {
                const payload = { test: 'true' }
                const rootRouter = express.Router()
                rootRouter.post(`/webhooks/${config.webhookRelayChannel}/push-github`, function (req, res) {
                    expect(req.headers['x-github-event']).toEqual('push')
                    res.status(200).end()
                    done()
                })
                rootRouter.use('*', (req, res) => {
                    res.status(200).end()
                    done(new Error('Wrong route'))
                })

                testServer.start({
                    rootRouter,
                    done,
                    onStart: () => {
                        // send request to Webhook Relay and expect it to forward the request to the test server
                        request(config.webhookRelayServerBaseUrl)
                            .post(`/webhooks/${config.webhookRelayChannel}/push-github`)
                            .set('x-github-event', 'push')
                            .send(payload)
                            .catch(done)
                    },
                })
            })

            describe('when receiving github payload signed with secret', function () {
                it('should verify the signature successfully1', function (done) {
                    const rootRouter = express.Router()
                    rootRouter.use(verifyGithubPayload(githubWebhookSecret))
                    rootRouter.post(`/webhooks/${config.webhookRelayChannel}/push-github`, function (req, res) {
                        expect(req.headers['content-type']).toEqual('application/json')
                        res.status(200).end()
                        done()
                    })
                    rootRouter.use('*', (req, res) => {
                        res.status(200).end()
                        done(new Error('Wrong route'))
                    })

                    testServer.start({
                        rootRouter,
                        done,
                        onStart: () => {
                            // send request to Webhook Relay and expect it to forward the request to the test server
                            request(config.webhookRelayServerBaseUrl)
                                .post(`/webhooks/${config.webhookRelayChannel}/push-github`)
                                .set('content-type', 'application/json')
                                .set(githubPayloadSignatureHeaderName, jsonGithubPayloadSha256Signature)
                                .send(jsonGithubPayload)
                                .catch(done)
                        },
                    })
                })

                it('should verify the signature successfully2', function (done) {
                    const rootRouter = express.Router()
                    rootRouter.use(verifyGithubPayload(githubWebhookSecret))
                    rootRouter.post(`/webhooks/${config.webhookRelayChannel}/push-github`, function (req, res) {
                        expect(req.headers['content-type']).toEqual('application/x-www-form-urlencoded')
                        res.status(200).end()
                        done()
                    })
                    rootRouter.use('*', (req, res) => {
                        res.status(200).end()
                        done(new Error('Wrong route'))
                    })

                    testServer.start({
                        rootRouter,
                        done,
                        onStart: () => {
                            // send request to Webhook Relay and expect it to forward the request to the test server
                            request(config.webhookRelayServerBaseUrl)
                                .post(`/webhooks/${config.webhookRelayChannel}/push-github`)
                                .set('content-type', 'application/x-www-form-urlencoded')
                                .set(githubPayloadSignatureHeaderName, urlencodedGithubPayloadSha256Signature)
                                .send(urlencodedGithubPayload)
                                .catch(done)
                        },
                    })
                })
            })
        })

        describe('given a different channel from the one that the Webhook Relay Client is listening to', function () {
            const wrongChannel = 'wrong-channel'

            it('should get a 200 response from the Webhook Relay Server', function (done) {
                request(config.webhookRelayServerBaseUrl)
                    .post(`/webhooks/${wrongChannel}/push-github`)
                    .send({ test: true })
                    .expect(200) // expect ack from Webhook Relay Server
                    .then(() => done())
                    .catch(done)
            })

            it('should not forward the request to the test server', function (done) {
                const rootRouter = express.Router()
                const mockController = jest.fn()
                rootRouter.use('*', mockController)

                testServer.start({
                    rootRouter,
                    done,
                    onStart: () => {
                        // send request to Webhook Relay and expect it to forward the request to the test server
                        request(config.webhookRelayServerBaseUrl)
                            .post(`/webhooks/${wrongChannel}/push-github`)
                            .send({ test: true })
                            .then(() => delay(5 * 1000)) // wait few secs before testing if the controller was called
                            .then(() => {
                                expect(mockController).not.toBeCalled()
                                done()
                            })
                            .catch(done)
                    },
                })
            }, 10 * 1000)
        })
    })
})
