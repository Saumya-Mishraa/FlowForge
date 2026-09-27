const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ApiRequest, Project, RequestHistory } = require('../models');
const { getVariableMap, resolveString } = require('../services/environmentService');
const { executeRequest } = require('../services/requestExecutorService');

async function assertProjectOwned(projectId, userId) {
  const project = await Project.findOne({ _id: projectId, owner: userId });
  if (!project) throw ApiError.notFound('Project not found');
}

const listRequests = asyncHandler(async (req, res) => {
  const { project, collection } = req.query;
  if (!project) throw ApiError.badRequest('project query param is required');
  await assertProjectOwned(project, req.user._id);

  const filter = { project, owner: req.user._id };
  if (collection) filter.collection = collection;

  const requests = await ApiRequest.find(filter).sort({ updatedAt: -1 });
  res.json({ success: true, data: { requests } });
});

const saveRequest = asyncHandler(async (req, res) => {
  const { project } = req.body;
  await assertProjectOwned(project, req.user._id);

  const request = await ApiRequest.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ success: true, data: { request } });
});

const getRequest = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { request: req.doc } });
});

const updateRequest = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'description',
    'method',
    'url',
    'params',
    'headers',
    'auth',
    'body',
    'collection',
    'folderId',
  ];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) req.doc[field] = req.body[field];
  }
  await req.doc.save();
  res.json({ success: true, data: { request: req.doc } });
});

const duplicateRequest = asyncHandler(async (req, res) => {
  const source = req.doc.toObject();
  delete source._id;
  delete source.createdAt;
  delete source.updatedAt;
  const copy = await ApiRequest.create({ ...source, name: `${source.name} (copy)` });
  res.status(201).json({ success: true, data: { request: copy } });
});

const deleteRequest = asyncHandler(async (req, res) => {
  await req.doc.deleteOne();
  res.json({ success: true, message: 'Request deleted' });
});

// The core "Send Request" action. Accepts either a saved request id
// (sourceRequestId) or an ad-hoc definition straight from the API Tester UI
// — either way it resolves environment variables, actually executes the
// HTTP call through requestExecutorService (real network I/O, no mocking),
// and records a RequestHistory entry so History/Dashboard/Analytics all
// reflect real usage.
const executeAndRecord = asyncHandler(async (req, res) => {
  const { project, environmentId, sourceRequestId } = req.body;
  await assertProjectOwned(project, req.user._id);

  const { environment, variables } = await getVariableMap(project, environmentId);

  const requestDef = {
    method: req.body.method,
    url: req.body.url,
    params: req.body.params || [],
    headers: req.body.headers || [],
    auth: req.body.auth || { type: 'none' },
    body: req.body.body || { mode: 'none' },
  };

  const result = await executeRequest(requestDef, variables);

  const history = await RequestHistory.create({
    project,
    owner: req.user._id,
    sourceRequest: sourceRequestId || null,
    method: requestDef.method,
    url: requestDef.url,
    resolvedUrl: result.resolvedUrl,
    environmentUsed: environment?.name || '',
    status: result.status,
    statusText: result.statusText,
    ok: result.ok,
    durationMs: result.durationMs,
    responseSizeBytes: result.responseSizeBytes,
    errorMessage: result.errorMessage,
    requestSnapshot: requestDef,
    responseSnapshot: { headers: result.headers, data: truncateForStorage(result.data) },
  });

  res.json({
    success: true,
    data: {
      historyId: history._id,
      resolvedUrl: result.resolvedUrl,
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

// Keep History documents from growing unbounded on very large responses.
function truncateForStorage(data) {
  try {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    if (str.length > 50000) {
      return typeof data === 'string' ? str.slice(0, 50000) + '…[truncated]' : { truncated: true };
    }
    return data;
  } catch {
    return null;
  }
}

module.exports = {
  listRequests,
  saveRequest,
  getRequest,
  updateRequest,
  duplicateRequest,
  deleteRequest,
  executeAndRecord,
};
