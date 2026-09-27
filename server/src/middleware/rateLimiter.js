const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

const generalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down.' },
});

// Stricter limiter for auth endpoints to slow down credential stuffing / brute force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

// The API executor makes outbound calls on the user's behalf — keep it tighter
// than general traffic so FlowForge can't be used as an open request proxy.
const executorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests executed, please slow down.' },
});

module.exports = { generalLimiter, authLimiter, executorLimiter };
