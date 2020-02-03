'use strict'

const Koa = require('koa');
const koaBody = require('koa-body');

const opentelemetry = require('@opentelemetry/core');
const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { NodeTracerRegistry } = require('@opentelemetry/node');
const { JaegerHttpTraceFormat } = require('@opentelemetry/propagator-jaeger');

// EXAMPLE FROM: https://github.com/koajs/examples/blob/master/body-parsing/app.js

const app = module.exports = new Koa();

const options = {
    serviceName: 'name-service',
};

// Initialize an exporter depending on how we were started 
const exporter = new JaegerExporter(options);

const registry = new NodeTracerRegistry({
    httpTextFormat: new JaegerHttpTraceFormat()
});

// Configure span processor to send spans to the provided exporter 
registry.addSpanProcessor(new SimpleSpanProcessor(exporter));

// Initialize the OpenTelemetry APIs to use the BasicTracerRegistry bindings 
opentelemetry.initGlobalTracerRegistry(registry);
const tracer = opentelemetry.getTracer('example-basic-tracer-node');

app.use(koaBody());

// POST .name to /uppercase
// co-body accepts application/json
// and application/x-www-form-urlencoded

app.use(async function (ctx) {
    // tracing stuff
    const parentSpanContext = registry._config.httpTextFormat.extract('blah', ctx.request.header);
    const span = tracer.startSpan('server', {
        parentSpanContext,
    });
    const body = ctx.request.body;
    span.addEvent('request', { body: JSON.stringify(body) });

    if (!body.name) {
        span.end();
        ctx.throw(400, '.name required')
    };
    ctx.body = { name: body.name.toUpperCase() };
    span.end();
});

if (!module.parent) app.listen(3000);

/*
span.setAttribute('key', 'value'); // In Jaegger, attribute=tag 

  

  // Annotate our span to capture metadata about our operation 

  span.addEvent('invoking doWork'); // In Jaegger, event=log 

  span.addEvent('another log'); 

  span.addEvent('id_name', { something: 'with value', else: 'another item' } ); 

  span.end(); 
  */