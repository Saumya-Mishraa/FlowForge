const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { env, isGoogleOAuthConfigured } = require('./env');
const authService = require('../services/authService');

// Google OAuth is only wired up when all three credentials are present.
// Without them, /api/auth/google routes respond with a clear "not configured"
// message instead of crashing the server — see authController.googleStatus
// and routes/authRoutes.js.
function configurePassport() {
  if (!isGoogleOAuthConfigured) return;

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleCallbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await authService.findOrCreateGoogleUser(profile);
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

module.exports = { configurePassport };
