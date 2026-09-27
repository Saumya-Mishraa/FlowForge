const asyncHandler = require('../utils/asyncHandler');
const { Execution } = require('../models');
const debugSessionService = require('../workflow-engine/debugSessionService');
const { getVariableMap } = require('../services/environmentService');

const startDebug = asyncHandler(async (req, res) => {
  const workflow = req.doc;
  const { variables } = await getVariableMap(workflow.project);

  const view = debugSessionService.startSession({
    workflow: workflow.toObject(),
    owner: req.user._id,
    initialVariables: variables,
  });
  res.json({ success: true, data: view });
});

const stepDebug = asyncHandler(async (req, res) => {
  const view = await debugSessionService.stepSession(req.params.sessionId, req.user._id);
  res.json({ success: true, data: view });
});

// Stopping a debug session genuinely prevents any further nodes from
// running — it doesn't just hide UI for an already-finished execution. We
// still record whatever ran so it shows up in Execution Logs, tagged as
// 'stopped' rather than 'succeeded'/'failed'.
const stopDebug = asyncHandler(async (req, res) => {
  const workflow = req.doc;
  const view = debugSessionService.stopSession(req.params.sessionId, req.user._id);

  const startedAt = view.nodeResults[0]?.startedAt || new Date();
  await Execution.create({
    workflow: workflow._id,
    project: workflow.project,
    owner: req.user._id,
    status: 'stopped',
    mode: 'debug',
    startedAt,
    finishedAt: new Date(),
    durationMs: 0,
    variables: view.variables,
    nodeResults: view.nodeResults,
    error: 'Stopped by user during debug session',
  });

  res.json({ success: true, data: view });
});

module.exports = { startDebug, stepDebug, stopDebug };
