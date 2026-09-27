const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Workflow, Execution, Project } = require('../models');
const { validateWorkflow } = require('../workflow-engine/validate');
const { runWorkflow } = require('../workflow-engine/engine');
const { listTemplates, buildTemplate } = require('../workflow-engine/templates');
const { getVariableMap } = require('../services/environmentService');

const DEFAULT_GRAPH = {
  nodes: [
    { id: 'start', type: 'start', position: { x: 80, y: 160 }, data: {} },
    { id: 'end', type: 'end', position: { x: 480, y: 160 }, data: {} },
  ],
  edges: [{ id: 'e-start-end', source: 'start', target: 'end' }],
};

async function assertProjectOwned(projectId, userId) {
  const project = await Project.findOne({ _id: projectId, owner: userId });
  if (!project) throw ApiError.notFound('Project not found');
}

const listWorkflows = asyncHandler(async (req, res) => {
  const { project } = req.query;
  if (!project) throw ApiError.badRequest('project query param is required');
  await assertProjectOwned(project, req.user._id);

  const workflows = await Workflow.find({ project, owner: req.user._id }).sort({ updatedAt: -1 });
  res.json({ success: true, data: { workflows } });
});

const createWorkflow = asyncHandler(async (req, res) => {
  const { project, name, description, templateKey } = req.body;
  await assertProjectOwned(project, req.user._id);

  const graph = templateKey ? buildTemplate(templateKey) : null;
  if (templateKey && !graph) throw ApiError.badRequest(`Unknown template "${templateKey}"`);

  const workflow = await Workflow.create({
    project,
    owner: req.user._id,
    name,
    description,
    nodes: graph?.nodes || DEFAULT_GRAPH.nodes,
    edges: graph?.edges || DEFAULT_GRAPH.edges,
    isTemplate: false,
    templateKey: templateKey || null,
  });
  res.status(201).json({ success: true, data: { workflow } });
});

const getWorkflow = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { workflow: req.doc } });
});

const updateWorkflow = asyncHandler(async (req, res) => {
  const { name, description, nodes, edges } = req.body;
  if (name !== undefined) req.doc.name = name;
  if (description !== undefined) req.doc.description = description;
  if (nodes !== undefined) req.doc.nodes = nodes;
  if (edges !== undefined) req.doc.edges = edges;
  await req.doc.save();
  res.json({ success: true, data: { workflow: req.doc } });
});

const duplicateWorkflow = asyncHandler(async (req, res) => {
  const source = req.doc;
  const copy = await Workflow.create({
    project: source.project,
    owner: req.user._id,
    name: `${source.name} (copy)`,
    description: source.description,
    nodes: source.nodes,
    edges: source.edges,
  });
  res.status(201).json({ success: true, data: { workflow: copy } });
});

const deleteWorkflow = asyncHandler(async (req, res) => {
  await Execution.deleteMany({ workflow: req.doc._id });
  await req.doc.deleteOne();
  res.json({ success: true, message: 'Workflow deleted' });
});

const validateWorkflowRoute = asyncHandler(async (req, res) => {
  const errors = validateWorkflow(req.doc);
  res.json({ success: true, data: { valid: errors.length === 0, errors } });
});

// Runs the workflow end-to-end (real HTTP calls, real branching) and records
// a full Execution document — this is the "Run Workflow" button's endpoint.
const runWorkflowRoute = asyncHandler(async (req, res) => {
  const workflow = req.doc;
  const { environment, variables } = await getVariableMap(workflow.project);

  const startedAt = new Date();
  let engineResult;
  try {
    engineResult = await runWorkflow(workflow.toObject(), { initialVariables: variables });
  } catch (err) {
    if (err.isApiError) {
      // Validation failure — no Execution record, since nothing ran.
      throw err;
    }
    throw err;
  }
  const finishedAt = new Date();

  const execution = await Execution.create({
    workflow: workflow._id,
    project: workflow.project,
    owner: req.user._id,
    status: engineResult.status,
    mode: 'run',
    startedAt,
    finishedAt,
    durationMs: finishedAt - startedAt,
    variables: engineResult.variables,
    nodeResults: engineResult.nodeResults,
    error: engineResult.error,
  });

  workflow.lastRunStatus = engineResult.status;
  workflow.lastRunAt = finishedAt;
  await workflow.save();

  res.json({
    success: true,
    data: {
      execution,
      environmentUsed: environment?.name || null,
    },
  });
});

const getTemplates = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { templates: listTemplates() } });
});

module.exports = {
  listWorkflows,
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  duplicateWorkflow,
  deleteWorkflow,
  validateWorkflowRoute,
  runWorkflowRoute,
  getTemplates,
};
