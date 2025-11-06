const config = require('../config/environment');

const levels = ['error', 'warn', 'info', 'debug'];
const currentLevel = config.logLevel;

const shouldLog = (level) => levels.indexOf(level) <= levels.indexOf(currentLevel);

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
};

const logger = {
  error: (message, meta) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, meta));
    }
  },
  warn: (message, meta) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta));
    }
  },
  info: (message, meta) => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, meta));
    }
  },
  debug: (message, meta) => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, meta));
    }
  },
};

module.exports = logger;
