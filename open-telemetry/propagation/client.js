'use strict';

const opentelemetry = require('@opentelemetry/core');
const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { NodeTracerRegistry } = require('@opentelemetry/node');
const { JaegerHttpTraceFormat } = require('@opentelemetry/propagator-jaeger');

const rp = require('request-promise-native');

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

const parentSpan = tracer.startSpan('client');
/*
if (process.argv.length !== 3) {
    console.log('client expects param');
    process.exit(1);
}
*/

const name = process.argv[2] || 'bah';

parentSpan.addEvent('input_params', { name });

const reqOptions = {
    uri: 'http://localhost:3000',
    method: 'POST',
    json: {
        name
    },
    headers: {
        'Content-Type': 'application/json'
    },
    resolveWithFullResponse: true
};
registry._config.httpTextFormat.inject(parentSpan.spanContext, 'un', reqOptions.headers);
const parentSpanContext = registry._config.httpTextFormat.extract('blah', reqOptions.headers);

const span2 = tracer.startSpan('server', {
    parentSpanContext,
});

const span3 = tracer.startSpan('doWork', { 
    parentSpan, 
      }); 

rp(reqOptions)
    .then((resp) => {
        parentSpan.addEvent('response', resp.body);
        parentSpan.setAttribute('status.code', resp.statusCode);
    })
    .catch((err) => {
        parentSpan.addEvent(err.name, { message: err.message });
        parentSpan.setAttribute('status.code', err.statusCode);
    })
    .finally(() => {
        // Be sure to end the span. 
        parentSpan.end();
        // flush and close the connection. 
        exporter.shutdown();
    });