/**
 * Shared logging utility to gate console output in production.
 * This prevents users from seeing debug noise while keeping it available for local development.
 */

const isDev = process.env.NODE_ENV === "development";
const isServer = typeof window === "undefined";

export const logDebug = (...args: unknown[]) => {
  if (!isDev) return;
  console.debug(...args);
};

export const logWarn = (...args: unknown[]) => {
  if (!isDev && !isServer) return;
  console.warn(...args);
};

export const logError = (...args: unknown[]) => {
  if (!isDev && !isServer) return;
  console.error(...args);
};

export const logInfo = (...args: unknown[]) => {
  if (!isDev && !isServer) return;
  console.info(...args);
};

const logger = {
  debug: logDebug,
  warn: logWarn,
  error: logError,
  info: logInfo,
};

export default logger;
