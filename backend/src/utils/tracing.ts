import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { config } from '../config';

// Configure the trace exporter
const traceExporter = new OTLPTraceExporter({
  url: config.tempo.endpoint,
});

// Configure the SDK
export const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'demo-backend',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.nodeEnv,
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Customize auto-instrumentation
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable file system instrumentation
      },
    }),
  ],
});

// Start the SDK
export function startTracing() {
  sdk.start();
  console.log('OpenTelemetry tracing initialized');
}

// Graceful shutdown
export async function shutdownTracing() {
  try {
    await sdk.shutdown();
    console.log('OpenTelemetry tracing shut down successfully');
  } catch (error) {
    console.error('Error shutting down OpenTelemetry:', error);
  }
}
