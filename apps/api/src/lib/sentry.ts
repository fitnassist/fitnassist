import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://b319865fc2dd6653547d20ae6554f24b@o415959.ingest.us.sentry.io/4511152545136640",
  environment: process.env.NODE_ENV || "development",
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
});

export { Sentry };
