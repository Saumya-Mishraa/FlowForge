const { body } = require('express-validator');

const collectionValidators = [
  body('name').trim().isLength({ min: 1, max: 120 }).withMessage('Collection name is required'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('project').isMongoId().withMessage('A valid project id is required'),
];

const folderValidators = [
  body('name').trim().isLength({ min: 1, max: 120 }).withMessage('Folder name is required'),
];

module.exports = { collectionValidators, folderValidators };
