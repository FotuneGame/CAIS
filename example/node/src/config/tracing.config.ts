import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';

export function startTracing() {
  const url = process.env.OTLP_URL;
  if (!url) return;
  const sdk = new NodeSDK({
    serviceName: process.env.APP_NAME || 'node-example',
    traceExporter: new OTLPTraceExporter({ url: `${url}/v1/traces` }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });
  sdk.start();
  process.once('SIGTERM', () => void sdk.shutdown());
}

startTracing();
