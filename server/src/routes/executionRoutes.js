const express = require('express');
const executionController = require('../controllers/executionController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', executionController.listExecutions);
router.get('/:id', executionController.getExecution);

module.exports = router;
