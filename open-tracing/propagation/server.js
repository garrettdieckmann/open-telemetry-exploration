'use strict'

const Koa = require('koa');
const koaBody = require('koa-body');

const initTracer = require('./lib/tracing').initTracer;
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing');

const tracer = initTracer('format-service');

const app = module.exports = new Koa();

app.use(koaBody());

// POST .name to /uppercase
// co-body accepts application/json
// and application/x-www-form-urlencoded

app.use(async function (ctx) {
    const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, ctx.request.headers)
    const span = tracer.startSpan('formatter_server', {
        childOf: parentSpanContext,
        tags: {[Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER}
    });
    const body = ctx.request.body;

    if (!body.name) {
        const msg = '.name required';
        span.log({
            'event': 'error',
            body: msg
        });
        ctx.throw(400, msg)
    };
    
    ctx.body = { name: body.name.toUpperCase() };
    span.log({
        'event': 'formatter_server response',
        body: ctx.body
    });
    span.finish();
});

if (!module.parent) app.listen(3000);