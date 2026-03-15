import pino from 'pino';

const LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export const logger = pino({
  level: LOG_LEVEL,
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino/file', options: { destination: 1 } }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
