const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatarUrl, preferences } = req.body;

  if (name !== undefined) req.user.name = name;
  if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;
  if (preferences?.theme !== undefined) req.user.preferences.theme = preferences.theme;
  if (preferences?.editorFontSize !== undefined) {
    req.user.preferences.editorFontSize = preferences.editorFontSize;
  }

  await req.user.save();
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await req.user.constructor.findById(req.user._id).select('+passwordHash');

  if (!user.authProviders.includes('local')) {
    throw ApiError.badRequest('This account signs in with Google and has no password to change.');
  }

  const valid = await user.comparePassword(currentPassword);
  if (!valid) throw ApiError.unauthorized('Current password is incorrect');

  await user.setPassword(newPassword);
  await user.save();

  res.json({ success: true, message: 'Password updated' });
});

module.exports = { getProfile, updateProfile, changePassword };
