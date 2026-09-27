const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { RequestHistory, Project } = require('../models');
const { getVariableMap } = require('../services/environmentService');
const { executeRequest } = require('../services/requestExecutorService');

const listHistory = asyncHandler(async (req, res) => {
  const { project, limit = 50 } = req.query;
  const filter = { owner: req.user._id };
  if (project) filter.project = project;

  const history = await RequestHistory.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(parseInt(limit, 10) || 50, 200));

  res.json({ success: true, data: { history } });
});

const getHistoryEntry = asyncHandler(async (req, res) => {
  const entry = await RequestHistory.findOne({ _id: req.params.id, owner: req.user._id });
  if (!entry) throw ApiError.notFound('History entry not found');
  res.json({ success: true, data: { entry } });
});

// Re-runs a past request exactly as it was sent (from requestSnapshot),
// re-resolving variables in case the environment has changed since, and
// records a fresh history entry rather than mutating the old one.
const rerunHistoryEntry = asyncHandler(async (req, res) => {
  const entry = await RequestHistory.findOne({ _id: req.params.id, owner: req.user._id });
  if (!entry) throw ApiError.notFound('History entry not found');

  const project = await Project.findOne({ _id: entry.project, owner: req.user._id });
  if (!project) throw ApiError.notFound('Project not found');

  const { environment, variables } = await getVariableMap(entry.project);
  const result = await executeRequest(entry.requestSnapshot, variables);

  const newEntry = await RequestHistory.create({
    project: entry.project,
    owner: req.user._id,
    sourceRequest: entry.sourceRequest,
    method: entry.requestSnapshot.method,
    url: entry.requestSnapshot.url,
    resolvedUrl: result.resolvedUrl,
    environmentUsed: environment?.name || '',
    status: result.status,
    statusText: result.statusText,
    ok: result.ok,
    durationMs: result.durationMs,
    responseSizeBytes: result.responseSizeBytes,
    errorMessage: result.errorMessage,
    requestSnapshot: entry.requestSnapshot,
    responseSnapshot: { headers: result.headers, data: result.data },
  });

  res.json({
    success: true,
    data: {
      historyId: newEntry._id,
      status: result.status,
      statusText: result.statusText,
      ok: result.ok,
      headers: result.headers,
      body: result.data,
      durationMs: result.durationMs,
      responseSizeBytes: result.responseSizeBytes,
      errorMessage: result.errorMessage,
    },
  });
});

const deleteHistoryEntry = asyncHandler(async (req, res) => {
  const entry = await RequestHistory.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!entry) throw ApiError.notFound('History entry not found');
  res.json({ success: true, message: 'History entry deleted' });
});

const clearHistory = asyncHandler(async (req, res) => {
  const { project } = req.query;
  const filter = { owner: req.user._id };
  if (project) filter.project = project;
  await RequestHistory.deleteMany(filter);
  res.json({ success: true, message: 'History cleared' });
});

module.exports = { listHistory, getHistoryEntry, rerunHistoryEntry, deleteHistoryEntry, clearHistory };
