import { webcrypto } from "node:crypto";
if (!globalThis.crypto) {
  // @ts-expect-error Node 18 compat — polyfill crypto global
  globalThis.crypto = webcrypto;
}

import { Sentry } from "./lib/sentry";
import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const PORT = parseInt(env.PORT, 10);

const server = app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`   tRPC endpoint: http://localhost:${PORT}/trpc`);
  console.log(`   Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown
let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) {
    console.log("Shutdown already in progress, forcing exit...");
    process.exit(1);
  }

  isShuttingDown = true;
  console.log(`\n${signal} received, shutting down...`);

  // Force exit after 3 seconds if graceful shutdown fails
  const forceExitTimeout = setTimeout(() => {
    console.log("Forcing exit after timeout");
    process.exit(1);
  }, 3000);

  try {
    server.close();
    await prisma.$disconnect();
    clearTimeout(forceExitTimeout);
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Prevent crashes from unhandled rejections
process.on("unhandledRejection", (reason, _promise) => {
  console.error("[UnhandledRejection]", reason);
  Sentry.captureException(reason);
});

process.on("uncaughtException", (error) => {
  console.error("[UncaughtException]", error);
  Sentry.captureException(error);
});
