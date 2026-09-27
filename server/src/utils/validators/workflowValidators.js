const { body } = require('express-validator');

const createWorkflowValidators = [
  body('project').isMongoId().withMessage('A valid project id is required'),
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('Workflow name is required'),
];

const updateWorkflowValidators = [
  body('name').optional().trim().isLength({ min: 1, max: 150 }),
  body('nodes').optional().isArray(),
  body('edges').optional().isArray(),
];

module.exports = { createWorkflowValidators, updateWorkflowValidators };
