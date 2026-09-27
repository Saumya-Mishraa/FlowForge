const { body } = require('express-validator');

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const saveRequestValidators = [
  body('project').isMongoId().withMessage('A valid project id is required'),
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('Request name is required'),
  body('method').isIn(METHODS).withMessage(`Method must be one of ${METHODS.join(', ')}`),
  body('url').trim().notEmpty().withMessage('URL is required'),
  body('collection').optional({ nullable: true }).isMongoId(),
];

const executeRequestValidators = [
  body('project').isMongoId().withMessage('A valid project id is required'),
  body('method').isIn(METHODS).withMessage(`Method must be one of ${METHODS.join(', ')}`),
  body('url').trim().notEmpty().withMessage('URL is required'),
  body('environmentId').optional({ nullable: true }).isMongoId(),
];

module.exports = { saveRequestValidators, executeRequestValidators, METHODS };
