const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const normalizeBoolean = (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
};

const splitCsv = (value) =>
  typeof value === 'string'
    ? value
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean)
    : [];

const nodeEnv = process.env.NODE_ENV || 'development';
const defaultMongoDbName = process.env.MONGO_URI ? undefined : 'gestionthibe';
const jwtSecret = process.env.JWT_SECRET || 'development-secret';
const isProduction = nodeEnv === 'production';

if (isProduction && jwtSecret === 'development-secret') {
  throw new Error('JWT_SECRET debe configurarse con un valor seguro en producción.');
}

if (isProduction && (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'ChangeMe123!')) {
  throw new Error('ADMIN_PASSWORD debe configurarse con una contraseña segura en producción.');
}

const config = {
  nodeEnv,
  isProduction,
  port: parseInt(process.env.PORT || '3000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/gestionthibe',
  mongo: {
    uri: process.env.MONGO_URI,
    dbName: process.env.MONGO_DB_NAME || defaultMongoDbName,
    user: process.env.MONGO_USER || undefined,
    password: process.env.MONGO_PASSWORD || undefined,
    authSource: process.env.MONGO_AUTH_SOURCE || undefined,
    authMechanism: process.env.MONGO_AUTH_MECHANISM || undefined,
    tls: normalizeBoolean(process.env.MONGO_TLS),
    tlsCAFile: process.env.MONGO_TLS_CA_FILE || undefined
  },
  corsOrigins: splitCsv(process.env.CORS_ORIGINS),
  trustProxy: normalizeBoolean(process.env.TRUST_PROXY) || false,
  jwtSecret,
  accessTokenTtl: parseInt(process.env.ACCESS_TOKEN_TTL || '3600', 10),
  refreshTokenTtl: parseInt(process.env.REFRESH_TOKEN_TTL || '604800', 10),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  publicAppUrl: process.env.PUBLIC_APP_URL || '',
  mercadoPago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
    currency: process.env.MERCADOPAGO_CURRENCY || 'UYU',
    country: process.env.MERCADOPAGO_COUNTRY || 'UY',
    successUrl: process.env.MERCADOPAGO_SUCCESS_URL || '',
    pendingUrl: process.env.MERCADOPAGO_PENDING_URL || '',
    failureUrl: process.env.MERCADOPAGO_FAILURE_URL || '',
    notificationUrl: process.env.MERCADOPAGO_NOTIFICATION_URL || '',
    payerEmailOverride: process.env.MERCADOPAGO_PAYER_EMAIL_OVERRIDE || ''
  }
};

module.exports = config;
