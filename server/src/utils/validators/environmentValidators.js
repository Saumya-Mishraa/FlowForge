const { body } = require('express-validator');

const createEnvironmentValidators = [
  body('project').isMongoId().withMessage('A valid project id is required'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Environment name is required'),
  body('variables').optional().isArray(),
];

const updateEnvironmentValidators = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('variables').optional().isArray(),
  body('variables.*.key').optional().isString().trim().notEmpty(),
];

module.exports = { createEnvironmentValidators, updateEnvironmentValidators };
