const { body } = require('express-validator');

const updateProfileValidators = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('avatarUrl').optional().trim().isURL().withMessage('avatarUrl must be a valid URL'),
  body('preferences.theme').optional().isIn(['light', 'dark', 'system']),
  body('preferences.editorFontSize').optional().isInt({ min: 10, max: 24 }),
];

const changePasswordValidators = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('New password must contain a letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain a number'),
];

module.exports = { updateProfileValidators, changePasswordValidators };
