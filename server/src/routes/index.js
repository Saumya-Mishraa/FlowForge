const express = require('express');

const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/projects', require('./projectRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/collections', require('./collectionRoutes'));
router.use('/requests', require('./requestRoutes'));
router.use('/environments', require('./environmentRoutes'));
router.use('/history', require('./historyRoutes'));
router.use('/workflows', require('./workflowRoutes'));
router.use('/executions', require('./executionRoutes'));
router.use('/analytics', require('./analyticsRoutes'));
router.use('/openapi', require('./openapiRoutes'));

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'FlowForge API is running', time: new Date().toISOString() });
});

module.exports = router;
