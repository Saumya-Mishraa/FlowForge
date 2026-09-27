const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const { verifyRefreshToken, signAccessToken } = require('../utils/tokens');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { isGoogleOAuthConfigured } = require('../config/env');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const session = await authService.register({ name, email, password });
  res.status(201).json({ success: true, data: session });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const session = await authService.login({ email, password });
  res.json({ success: true, data: session });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.badRequest('refreshToken is required');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');

  const accessToken = signAccessToken(user);
  res.json({ success: true, data: { accessToken } });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const rawToken = await authService.createPasswordResetToken(email);

  // Always respond the same way whether or not the email exists, to avoid
  // leaking which addresses have accounts.
  const payload = { success: true, message: 'If that email exists, a reset link has been sent.' };

  // No email service is configured in this build, so surface the token/link
  // directly in development so the reset flow is testable end-to-end.
  if (rawToken && process.env.NODE_ENV !== 'production') {
    payload.devResetToken = rawToken;
    payload.devResetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;
  }

  res.json(payload);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const session = await authService.resetPassword({ rawToken: token, newPassword: password });
  res.json({ success: true, data: session });
});

const googleStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { enabled: isGoogleOAuthConfigured } });
});

module.exports = { register, login, refresh, me, forgotPassword, resetPassword, googleStatus };
