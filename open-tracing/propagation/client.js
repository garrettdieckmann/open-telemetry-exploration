'use strict';

const assert = require('assert');
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing');
const initTracer = require('./lib/tracing').initTracer;
const rp = require('request-promise-native');

function sayHello(helloTo) {
    const span = tracer.startSpan('sayHello');
    span.setTag('hello-to', helloTo);

    return call_name_formatter(helloTo, span)
        .then(data => {
            span.setTag(Tags.HTTP_STATUS_CODE, 200)
            span.finish();
        })
        .catch(err => {
            span.setTag(Tags.ERROR, true)
            span.setTag(Tags.HTTP_STATUS_CODE, err.statusCode || 500);
            span.finish();
        });
}

// Call server.js
function call_name_formatter(input, root_span) {
    const span = tracer.startSpan('format', { childOf: root_span.context() });
    span.log({
        'event': 'call_name_formatter() called',
        input
    });

    const reqOptions = {
        uri: 'http://localhost:3000',
        method: 'POST',
        json: {
            name: input
        },
        headers: {
            'Content-Type': 'application/json'
        },
        resolveWithFullResponse: true
    };
    span.setTag(Tags.HTTP_URL, reqOptions.uri);
    span.setTag(Tags.HTTP_METHOD, reqOptions.method);
    span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_CLIENT);
    // inject span into HTTP headers
    tracer.inject(span, FORMAT_HTTP_HEADERS, reqOptions.headers);

    return rp(reqOptions)
        .then((resp) => {
            span.log({
                'event': 'formatter service response',
                body: resp.body
            });
            return resp.body;
        })
        .catch((err) => {
            span.log({
                'event': 'formatter service error',
                error: err || err.message
            });
        })
        .finally(() => {
            span.finish();
        });
}

assert.ok(process.argv.length == 3, 'expecting one argument');
const helloTo = process.argv[2];
const tracer = initTracer('gd-hello-world');

sayHello(helloTo)
    .then(() => {
        tracer.close();
    });
