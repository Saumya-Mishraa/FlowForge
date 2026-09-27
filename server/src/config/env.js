require('dotenv').config();

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  return value;
}

const env = {
  nodeEnv: required('NODE_ENV', 'development'),
  port: parseInt(required('PORT', '5000'), 10),
  mongoUri: required('MONGODB_URI'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: required('JWT_EXPIRES_IN', '7d'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtRefreshExpiresIn: required('JWT_REFRESH_EXPIRES_IN', '30d'),

  googleClientId: required('GOOGLE_CLIENT_ID', ''),
  googleClientSecret: required('GOOGLE_CLIENT_SECRET', ''),
  googleCallbackUrl: required('GOOGLE_CALLBACK_URL', ''),

  clientUrl: required('CLIENT_URL', 'http://localhost:5174'),

  executorBlockPrivateNetworks: required('EXECUTOR_BLOCK_PRIVATE_NETWORKS', 'true') === 'true',
  executorTimeoutMs: parseInt(required('EXECUTOR_TIMEOUT_MS', '15000'), 10),
  executorMaxResponseBytes: parseInt(required('EXECUTOR_MAX_RESPONSE_BYTES', '5000000'), 10),

  rateLimitWindowMs: parseInt(required('RATE_LIMIT_WINDOW_MS', '60000'), 10),
  rateLimitMax: parseInt(required('RATE_LIMIT_MAX', '120'), 10),
};

const isGoogleOAuthConfigured = Boolean(
  env.googleClientId && env.googleClientSecret && env.googleCallbackUrl
);

if (env.nodeEnv !== 'test') {
  if (!env.jwtSecret) {
    console.error('[env] JWT_SECRET is not set. Authentication will not work until it is.');
  }
  if (!isGoogleOAuthConfigured) {
    console.warn(
      '[env] Google OAuth is not configured (GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL missing). ' +
        'Google sign-in will be disabled; email/password auth still works. See README "Google OAuth setup".'
    );
  }
}

module.exports = { env, isGoogleOAuthConfigured };
