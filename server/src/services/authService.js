const { User } = require('../models');
const ApiError = require('../utils/ApiError');

const {
  signAccessToken,
  signRefreshToken,
  generatePasswordResetToken,
  hashToken,
} = require('../utils/tokens');

async function register({ name, email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = new User({
    name,
    email: email.toLowerCase(),
    authProviders: ['local'],
  });

  await user.setPassword(password);
  await user.save();

  return issueSession(user);
}

async function login({ email, password }) {
  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select('+passwordHash');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.authProviders.includes('local')) {
    throw ApiError.unauthorized(
      'This account uses Google sign-in. Try "Continue with Google".'
    );
  }

  const valid = await user.comparePassword(password);

  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return issueSession(user);
}

function issueSession(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  return {
    user: user.toSafeJSON(),
    accessToken,
    refreshToken,
  };
}

async function createPasswordResetToken(email) {
  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user) return null;

  const { rawToken, tokenHash } = generatePasswordResetToken();

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpires = new Date(
    Date.now() + 60 * 60 * 1000
  );

  await user.save();

  return rawToken;
}

async function resetPassword({ rawToken, newPassword }) {
  const tokenHash = hashToken(rawToken);

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpires');

  if (!user) {
    throw ApiError.badRequest(
      'Reset link is invalid or has expired'
    );
  }

  await user.setPassword(newPassword);

  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;

  if (!user.authProviders.includes('local')) {
    user.authProviders.push('local');
  }

  await user.save();

  return issueSession(user);
}

async function findOrCreateGoogleUser(profile) {
  const email = profile.emails?.[0]?.value?.toLowerCase();

  if (!email) {
    throw ApiError.badRequest('Google account has no email');
  }

  let user = await User.findOne({
    $or: [
      { googleId: profile.id },
      { email },
    ],
  });

  if (!user) {
    const name =
      profile.displayName ||
      profile.name?.givenName ||
      email.split('@')[0];

    user = new User({
      name,
      email,
      googleId: profile.id,
      avatarUrl: profile.photos?.[0]?.value || '',
      authProviders: ['google'],
      isEmailVerified: true,
    });
  } else {
    if (!user.googleId) {
      user.googleId = profile.id;
    }

    if (!user.authProviders.includes('google')) {
      user.authProviders.push('google');
    }

    if (!user.name) {
      user.name =
        profile.displayName ||
        profile.name?.givenName ||
        email.split('@')[0];
    }
  }

  user.lastLoginAt = new Date();

  await user.save();

  return user;
}

module.exports = {
  register,
  login,
  issueSession,
  createPasswordResetToken,
  resetPassword,
  findOrCreateGoogleUser,
};

