const express = require('express');
const requestController = require('../controllers/requestController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const loadOwnedDoc = require('../middleware/loadOwnedDoc');
const { executorLimiter } = require('../middleware/rateLimiter');
const {
  saveRequestValidators,
  executeRequestValidators,
} = require('../utils/validators/requestValidators');
const { ApiRequest } = require('../models');

const router = express.Router();
router.use(requireAuth);

const loadRequest = loadOwnedDoc(ApiRequest, { notFoundMessage: 'Request not found' });

// Execution is rate-limited more tightly than plain CRUD since it makes a
// real outbound network call on the user's behalf.
router.post('/execute', executorLimiter, executeRequestValidators, validate, requestController.executeAndRecord);

router.get('/', requestController.listRequests);
router.post('/', saveRequestValidators, validate, requestController.saveRequest);

router.get('/:id', loadRequest, requestController.getRequest);
router.patch('/:id', loadRequest, requestController.updateRequest);
router.post('/:id/duplicate', loadRequest, requestController.duplicateRequest);
router.delete('/:id', loadRequest, requestController.deleteRequest);

module.exports = router;
