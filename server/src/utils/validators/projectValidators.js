const { body } = require('express-validator');

const projectValidators = [
  body('name').trim().isLength({ min: 1, max: 120 }).withMessage('Project name is required'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('color').optional().trim().isHexColor().withMessage('color must be a hex value'),
];

module.exports = { projectValidators };
