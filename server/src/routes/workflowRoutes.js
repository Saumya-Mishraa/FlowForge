const express = require('express');
const workflowController = require('../controllers/workflowController');
const debugController = require('../controllers/debugController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const loadOwnedDoc = require('../middleware/loadOwnedDoc');
const { executorLimiter } = require('../middleware/rateLimiter');
const {
  createWorkflowValidators,
  updateWorkflowValidators,
} = require('../utils/validators/workflowValidators');
const { Workflow } = require('../models');

const router = express.Router();
router.use(requireAuth);

const loadWorkflow = loadOwnedDoc(Workflow, { notFoundMessage: 'Workflow not found' });

router.get('/templates', workflowController.getTemplates);

router.get('/', workflowController.listWorkflows);
router.post('/', createWorkflowValidators, validate, workflowController.createWorkflow);

router.get('/:id', loadWorkflow, workflowController.getWorkflow);
router.patch('/:id', loadWorkflow, updateWorkflowValidators, validate, workflowController.updateWorkflow);
router.post('/:id/duplicate', loadWorkflow, workflowController.duplicateWorkflow);
router.delete('/:id', loadWorkflow, workflowController.deleteWorkflow);

router.get('/:id/validate', loadWorkflow, workflowController.validateWorkflowRoute);

// Real execution — rate-limited like the API Tester's executor since it can
// fire many real outbound HTTP requests per call.
router.post('/:id/run', loadWorkflow, executorLimiter, workflowController.runWorkflowRoute);

// Debug Mode: start/step/stop a genuine paused, resumable execution.
router.post('/:id/debug/start', loadWorkflow, executorLimiter, debugController.startDebug);
router.post('/:id/debug/:sessionId/step', executorLimiter, debugController.stepDebug);
router.post('/:id/debug/:sessionId/stop', loadWorkflow, debugController.stopDebug);

module.exports = router;
