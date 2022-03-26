# integration-tests

## Configuration

```typescript
export interface Config {
    // The base URL of the Webhook Relay Server that is being tested.
    // Environment variable: WEBHOOK_RELAY_SERVER_BASE_URL.
    // Default: "http://localhost:3000".
    webhookRelayServerBaseUrl: string

    // The name of the channel which the Webhook Relay Client subscribes to during the tests.
    // Environment variable: WEBHOOK_RELAY_CHANNEL.
    // Default: "test".
    webhookRelayChannel: string

    // The port of the target test server which the Webhook Relay Client should forward the payload to.
    // Environment variable: TEST_SERVER_PORT.
    // Default: 3001.
    testServerPort: number
}
```

