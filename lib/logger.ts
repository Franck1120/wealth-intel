/**
 * Structured Logger — Uses Sentry when configured, falls back to console.
 *
 * Enable Sentry by adding NEXT_PUBLIC_SENTRY_DSN to .env.local
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const ctx = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`;
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, context));
    }
  },

  info(message: string, context?: LogContext) {
    console.info(formatMessage('info', message, context));
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatMessage('warn', message, context));
  },

  error(message: string, error?: Error, context?: LogContext) {
    console.error(formatMessage('error', message, { ...context, error: error?.message, stack: error?.stack }));

    // Send to Sentry if configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && error) {
      captureToSentry(error, context);
    }
  },
};

async function captureToSentry(error: Error, context?: LogContext) {
  try {
    const sentryModule = '@sentry/nextjs';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Sentry = await import(/* webpackIgnore: true */ sentryModule) as any;
    if (context) {
      Sentry.setContext('custom', context);
    }
    Sentry.captureException(error);
  } catch {
    // Sentry not installed or configured — silent fail
  }
}
