const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Environment, Project } = require('../models');

async function assertProjectOwned(projectId, userId) {
  const project = await Project.findOne({ _id: projectId, owner: userId });
  if (!project) throw ApiError.notFound('Project not found');
}

const listEnvironments = asyncHandler(async (req, res) => {
  const { project } = req.query;
  if (!project) throw ApiError.badRequest('project query param is required');
  await assertProjectOwned(project, req.user._id);

  const environments = await Environment.find({ project, owner: req.user._id }).sort({ createdAt: 1 });
  res.json({ success: true, data: { environments } });
});

const createEnvironment = asyncHandler(async (req, res) => {
  const { project, name, variables } = req.body;
  await assertProjectOwned(project, req.user._id);

  // First environment for a project is made active automatically so the API
  // Tester has something to resolve variables against immediately.
  const existingCount = await Environment.countDocuments({ project });

  const environment = await Environment.create({
    project,
    owner: req.user._id,
    name,
    variables: variables || [],
    isActive: existingCount === 0,
  });
  res.status(201).json({ success: true, data: { environment } });
});

const updateEnvironment = asyncHandler(async (req, res) => {
  const { name, variables } = req.body;
  if (name !== undefined) req.doc.name = name;
  if (variables !== undefined) req.doc.variables = variables;
  await req.doc.save();
  res.json({ success: true, data: { environment: req.doc } });
});

// Only one environment per project may be active at a time — activating one
// deactivates the rest so variable resolution is never ambiguous.
const activateEnvironment = asyncHandler(async (req, res) => {
  await Environment.updateMany(
    { project: req.doc.project, _id: { $ne: req.doc._id } },
    { $set: { isActive: false } }
  );
  req.doc.isActive = true;
  await req.doc.save();
  res.json({ success: true, data: { environment: req.doc } });
});

const deleteEnvironment = asyncHandler(async (req, res) => {
  await req.doc.deleteOne();
  res.json({ success: true, message: 'Environment deleted' });
});

module.exports = {
  listEnvironments,
  createEnvironment,
  updateEnvironment,
  activateEnvironment,
  deleteEnvironment,
};
