const express = require('express');
const historyController = require('../controllers/historyController');
const { requireAuth } = require('../middleware/auth');
const { executorLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
router.use(requireAuth);

router.get('/', historyController.listHistory);
router.delete('/', historyController.clearHistory);
router.get('/:id', historyController.getHistoryEntry);
router.post('/:id/rerun', executorLimiter, historyController.rerunHistoryEntry);
router.delete('/:id', historyController.deleteHistoryEntry);

module.exports = router;
