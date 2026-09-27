const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { isGoogleOAuthConfigured } = require('../config/env');
const { signAccessToken, signRefreshToken } = require('../utils/tokens');
const {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
} = require('../utils/validators/authValidators');

const router = express.Router();

router.post('/register', authLimiter, registerValidators, validate, authController.register);
router.post('/login', authLimiter, loginValidators, validate, authController.login);
router.post('/refresh', authController.refresh);
router.get('/me', requireAuth, authController.me);
router.post(
  '/forgot-password',
  authLimiter,
  forgotPasswordValidators,
  validate,
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  resetPasswordValidators,
  validate,
  authController.resetPassword
);

router.get('/google/status', authController.googleStatus);

if (isGoogleOAuthConfigured) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=google' }),
    (req, res) => {
      const accessToken = signAccessToken(req.user);
      const refreshToken = signRefreshToken(req.user);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5174';
      res.redirect(
        `${clientUrl}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    }
  );
} else {
  // Clear signal instead of a 404 or a crash when OAuth isn't configured yet.
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message:
        'Google OAuth is not configured on this server. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL — see README "Google OAuth setup".',
    });
  });
}

module.exports = router;
