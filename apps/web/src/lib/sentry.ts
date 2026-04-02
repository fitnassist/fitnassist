import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://83b2399474612056dffc93144c9e2208@o415959.ingest.us.sentry.io/4511152535502848',
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
});
