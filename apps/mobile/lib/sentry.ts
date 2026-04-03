import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://3161e064658b0672fe78aae791a219f4@o415959.ingest.us.sentry.io/4511152551755776',
  enabled: !__DEV__,
  tracesSampleRate: 0.1,
});

export { Sentry };
