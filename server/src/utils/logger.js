/**
 * Structured Logger for ODD WAR Server
 */
const getTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta = '') => {
    console.log(`\x1b[32m[INFO]\x1b[0m [${getTimestamp()}] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message, meta = '') => {
    console.warn(`\x1b[33m[WARN]\x1b[0m [${getTimestamp()}] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message, error = '') => {
    console.error(`\x1b[31m[ERROR]\x1b[0m [${getTimestamp()}] ${message}`, error?.stack || error || '');
  },
  debug: (message, meta = '') => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`\x1b[36m[DEBUG]\x1b[0m [${getTimestamp()}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  }
};
