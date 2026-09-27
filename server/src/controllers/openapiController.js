const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parseOpenApiSpec } = require('../openapi/parser');
const { ApiRequest, Project, Collection } = require('../models');

async function assertProjectOwned(projectId, userId) {
  const project = await Project.findOne({ _id: projectId, owner: userId });
  if (!project) throw ApiError.notFound('Project not found');
}

// Step 1: parse-only, no writes. Lets the frontend show a preview of what
// would be imported before the user commits to it.
const parseSpec = asyncHandler(async (req, res) => {
  const { specText } = req.body;
  if (!specText || !specText.trim()) throw ApiError.badRequest('specText is required');

  let parsed;
  try {
    parsed = parseOpenApiSpec(specText);
  } catch (err) {
    throw ApiError.badRequest(err.message);
  }

  res.json({ success: true, data: parsed });
});

// Step 2: actually creates ApiRequest documents for the endpoints the user
// selected (or all of them, if none specified). Real writes, not a preview.
const importSpec = asyncHandler(async (req, res) => {
  const { project, collection, specText, selectedPaths } = req.body;
  if (!specText || !specText.trim()) throw ApiError.badRequest('specText is required');

  await assertProjectOwned(project, req.user._id);
  if (collection) {
    const col = await Collection.findOne({ _id: collection, project, owner: req.user._id });
    if (!col) throw ApiError.notFound('Collection not found');
  }

  let parsed;
  try {
    parsed = parseOpenApiSpec(specText);
  } catch (err) {
    throw ApiError.badRequest(err.message);
  }

  const toImport = selectedPaths?.length
    ? parsed.endpoints.filter((e) => selectedPaths.includes(`${e.method} ${e.path}`))
    : parsed.endpoints;

  if (toImport.length === 0) {
    throw ApiError.badRequest('No endpoints selected to import');
  }

  const docs = toImport.map((e) => ({
    project,
    collection: collection || undefined,
    owner: req.user._id,
    name: e.name,
    description: e.description,
    method: e.method,
    url: parsed.baseUrl ? `${parsed.baseUrl}${e.path}` : e.path,
    params: e.params,
    headers: e.headers,
    auth: { type: 'none' },
    body: e.body,
  }));

  const created = await ApiRequest.insertMany(docs);
  res.status(201).json({ success: true, data: { imported: created.length, requests: created } });
});

module.exports = { parseSpec, importSpec };
