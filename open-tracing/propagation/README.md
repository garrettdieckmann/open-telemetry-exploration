# OpenTracing Propagation Example
Propagation in OpenTracing uses inject/extract functions to add/read the SpanContext. This example injects/extracts HTTP headers sent from client -> server.

## Components
*Note*: Examples use Jaeger to receive traces. Can use the [Jaeger All-in-one Docker image](https://www.jaegertracing.io/docs/1.8/getting-started/#all-in-one) to get started.
To run:
1) Run the server
```
$ node server.js
INFO  Initializing Jaeger Tracer with CompositeReporter(LoggingReporter,RemoteReporter) and ConstSampler(always)
```
1) Execute the client
```
$ node client.js garrett
INFO  Initializing Jaeger Tracer with CompositeReporter(LoggingReporter,RemoteReporter) and ConstSampler(always)
INFO  Reporting span 88845148fa859c1c:5f0dba0e629ddff6:88845148fa859c1c:1
INFO  Reporting span 88845148fa859c1c:88845148fa859c1c:0:1
```

#### Client
The client:
1) starts the root span
1) injects the root span into the HTTP request Headers
1) POSTs data to the server with the span in the Headers
1) receives data from server

#### Server
1) extracts span from HTTP headers
1) formats the request data, and returns that request data to the client


### Resources
1) OpenTracing Example from: https://github.com/yurishkuro/opentracing-tutorial/tree/master/nodejs/lesson03
1) Koa example from: https://github.com/koajs/examples/blob/master/body-parsing/app.js