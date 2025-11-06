const dotenv = require('dotenv');

const result = dotenv.config();
if (result.error) {
  // Allow running without a local .env but still surface the error for visibility.
  console.warn('Warning: .env file not found or could not be parsed. Falling back to process environment.');
}

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'UPSTREAM_LOGIN_URL',
];

const missingVars = requiredEnvVars.filter((variable) => !process.env[variable]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 3000),
  logLevel: process.env.LOG_LEVEL || 'info',
  db: {
    host: process.env.DB_HOST,
    port: toNumber(process.env.DB_PORT, 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    tokenExpiry: process.env.TOKEN_EXPIRY || '1h',
  },
  upstream: {
    loginUrl: process.env.UPSTREAM_LOGIN_URL,
  },
};
