const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  updateProfileValidators,
  changePasswordValidators,
} = require('../utils/validators/userValidators');

const router = express.Router();

router.use(requireAuth);

router.get('/me', userController.getProfile);
router.patch('/me', updateProfileValidators, validate, userController.updateProfile);
router.post(
  '/me/change-password',
  changePasswordValidators,
  validate,
  userController.changePassword
);

module.exports = router;
