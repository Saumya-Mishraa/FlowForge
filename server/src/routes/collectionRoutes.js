const express = require('express');
const { body } = require('express-validator');
const collectionController = require('../controllers/collectionController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const loadOwnedDoc = require('../middleware/loadOwnedDoc');
const { collectionValidators, folderValidators } = require('../utils/validators/collectionValidators');
const { Collection } = require('../models');

const router = express.Router();
router.use(requireAuth);

const loadCollection = loadOwnedDoc(Collection, { notFoundMessage: 'Collection not found' });

router.get('/', collectionController.listCollections);
router.post('/', collectionValidators, validate, collectionController.createCollection);

router.patch(
  '/:id',
  loadCollection,
  [body('name').optional().trim().isLength({ min: 1, max: 120 })],
  validate,
  collectionController.updateCollection
);
router.post('/:id/duplicate', loadCollection, collectionController.duplicateCollection);
router.delete('/:id', loadCollection, collectionController.deleteCollection);

router.post('/:id/folders', loadCollection, folderValidators, validate, collectionController.addFolder);
router.patch(
  '/:id/folders/:folderId',
  loadCollection,
  folderValidators,
  validate,
  collectionController.renameFolder
);
router.delete('/:id/folders/:folderId', loadCollection, collectionController.deleteFolder);

module.exports = router;
