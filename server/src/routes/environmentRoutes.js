const express = require('express');
const environmentController = require('../controllers/environmentController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const loadOwnedDoc = require('../middleware/loadOwnedDoc');
const {
  createEnvironmentValidators,
  updateEnvironmentValidators,
} = require('../utils/validators/environmentValidators');
const { Environment } = require('../models');

const router = express.Router();
router.use(requireAuth);

const loadEnvironment = loadOwnedDoc(Environment, { notFoundMessage: 'Environment not found' });

router.get('/', environmentController.listEnvironments);
router.post('/', createEnvironmentValidators, validate, environmentController.createEnvironment);
router.patch('/:id', loadEnvironment, updateEnvironmentValidators, validate, environmentController.updateEnvironment);
router.post('/:id/activate', loadEnvironment, environmentController.activateEnvironment);
router.delete('/:id', loadEnvironment, environmentController.deleteEnvironment);

module.exports = router;
