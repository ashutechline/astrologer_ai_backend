require('dotenv').config();

/**
 * Central, validated access point for all environment variables.
 * Every other module should read config from here, not from process.env directly —
 * this keeps env access in one place and fails fast on boot if something required is missing.
 */
const required = (key, fallback = undefined) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '4000', 10),
  apiBasePath: process.env.API_BASE_PATH || '/v1',
  clientUrl: process.env.CLIENT_URL || '*',

  mongo: {
    uri: required('MONGODB_URI', 'mongodb://localhost:27017/cosmic_ai'),
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  social: {
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    appleClientId: process.env.APPLE_CLIENT_ID || '',
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    freeDailyQuota: parseInt(process.env.AI_FREE_DAILY_QUOTA || '5', 10),
  },

  ephemeris: {
    path: process.env.EPHE_PATH || './ephe',
  },

  googlePlaces: {
    apiKey: process.env.GOOGLE_PLACES_API_KEY || '',
  },

  revenuecat: {
    apiKey: process.env.REVENUECAT_API_KEY || '',
    webhookAuthHeader: process.env.REVENUECAT_WEBHOOK_AUTH_HEADER || '',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  },
};

module.exports = config;
