# Webhook Relay
     
Webhook Relay is a webhook payload delivery service - it receives webhook payloads, and sends them to listening clients which then forward them to the specified target urls.<br>
The clients need to subscribe to a specific channel on the server (the name of the channel should equal the runtime name) - this can be done by passing `SOURCE_URL` environment variable to the client, with the following url format: `https://url-of-the-webhook-relay-server/subscribe/:channel/`.
When creating the webhook in your git provider, you need to make sure that the webhook url is configured in the following format: `https://url-of-the-webhook-relay-server/webhooks/:channel/*`. Each payload that will be sent to `/webhooks/:channel/*` endpoint, will be published immediately to all clients that are listening to the same channel on `/subscribe/:channel/` endpoint. The clients will then forward those payloads to the url that is set with `TARGET_BASE_URL` environment variable while keeping the original url path, for instance `https://base-url-of-your-runtime-cluster/webhooks/:channel/push-github/github-push-heads`. 
         
## How it works
   
Webhook Relay works with two components: the `webhook-relay-server` and the `webhook-relay-client`. They talk to each other via [Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html), a type of connection that allows for messages to be sent from a source to any clients listening.

This means that channels are just an abstraction - all the server does is forwarding payloads to any _actively connected clients_.
 
 
### Running multiple instances of Webhook Relay Server

If you need to run multiple instances of the server, you need a way to share events across those instances. A client may be connected to instance A, so if a relevant event is sent to instance B, instance A needs to know about it too.

For that reason, Webhook Relay Server has a built-in support for Redis as a message bus. To enable it, just pass the `REDIS_URL` environment variable to the server. That will tell the server to use Redis when receiving payloads, and to publish them to all the instances of the server.

## Deploying Webhook Relay

In your DMZ cluster, apply the server manifests (click [here](https://github.com/codefresh-io/webhook-relay/blob/main/apps/webhook-relay-server/README.md) to see all the possible options that can be passed to the server using environment variables):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: webhook-relay-server-svc
spec:
  ports:
    - name: web
      port: 3000
      targetPort: 3000
  selector:
    app: webhook-relay-server
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webhook-relay-server
spec:
  selector:
    matchLabels:
      app: webhook-relay-server
  replicas: 3
  template:
    metadata:
      labels:
        app: webhook-relay-server
    spec:
      containers:
        - name: webhook-relay-server
          image: quay.io/codefresh/webhook-relay-server:stable
          ports:
            - containerPort: 3000
          env:
            - name: REDIS_URL
              # You can specify your connection as a redis:// URL or rediss:// URL when using TLS encryption.
              # Username and password can also be passed via URL redis://username:authpassword@127.0.0.1:6380/4.
              value: redis://redis.my-service.com
          readinessProbe:
            httpGet:
              path: /ready
              port: 9000
            failureThreshold: 1
            initialDelaySeconds: 5
            periodSeconds: 5
            successThreshold: 1
            timeoutSeconds: 5
          livenessProbe:
            httpGet:
              path: /live
              port: 9000
            failureThreshold: 3
            initialDelaySeconds: 10
            # Allow sufficient amount of time (90 seconds = periodSeconds * failureThreshold)
            # for the registered shutdown handlers to run to completion.
            periodSeconds: 30
            successThreshold: 1
            # Setting a very low timeout value (e.g. 1 second) can cause false-positive
            # checks and service interruption.
            timeoutSeconds: 5

```

In your runtime clusters, apply the client manifest (click [here](https://github.com/codefresh-io/webhook-relay/blob/main/apps/webhook-relay-client/README.md) to see all the possible options that can be passed to the client using environment variables):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webhook-relay-client
spec:
  selector:
    matchLabels:
      app: webhook-relay-client
  replicas: 1
  template:
    metadata:
      labels:
        app: webhook-relay-client
    spec:
      containers:
        - name: webhook-relay-client
          image: quay.io/codefresh/webhook-relay-client:stable
          env:
            - name: SOURCE_URL
              # Channel name should equal the runtime name
              value: https://url-of-the-webhook-relay-server/subscribe/:channel
            - name: TARGET_BASE_URL
              # All payloads will be sent to TARGET_BASE_URL/webhooks/:channel/*
              value: https://base-url-of-your-runtime-cluster

```

## Q&A

**How long do channels live for?**

* Channels are always active - once a client is connected, the server will send any payloads it gets at `/webhooks/:channel/*` to those clients.

**Are payloads ever stored?**

* Webhook payloads are never stored on the server, or in any database; the server is simply a pass-through.

**Best practices for production use?**

* Note that channels are _not authenticated_, therefore it is recommended to whitelist the ip range of your runtime clusters for accessing `/subscribe/:channel/` endpoint, and also whitelist the ip range of your git provider for accessing `/webhooks/:channel/*` endpoint.
* It is recommended to run multiple replicas of the server together with Redis using the `REDIS_URL` environment variable.
* Server Sent Events connections are HTTP long-running (keep-alive) connections, so it is recommended that you'll make sure you have an appropriate configuration for your reverse-proxy server (e.g. [Nginx](http://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive)) to avoid situations where a long-running connection is being cut off by the reverse-proxy.  
