const asyncHandler = require('../utils/asyncHandler');
const {
  Project,
  Collection,
  ApiRequest,
  Environment,
  Workflow,
  Execution,
  RequestHistory,
} = require('../models');

const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ owner: req.user._id }).sort({ updatedAt: -1 });

  // Attach lightweight counts so the dashboard/sidebar can show real numbers
  // without N+1-ing separate requests per project.
  const withCounts = await Promise.all(
    projects.map(async (project) => {
      const [collectionCount, requestCount, workflowCount] = await Promise.all([
        Collection.countDocuments({ project: project._id }),
        ApiRequest.countDocuments({ project: project._id }),
        Workflow.countDocuments({ project: project._id }),
      ]);
      return { ...project.toObject(), collectionCount, requestCount, workflowCount };
    })
  );

  res.json({ success: true, data: { projects: withCounts } });
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;
  const project = await Project.create({
    owner: req.user._id,
    name,
    description,
    color,
  });
  res.status(201).json({ success: true, data: { project } });
});

const getProject = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { project: req.doc } });
});

const updateProject = asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;
  if (name !== undefined) req.doc.name = name;
  if (description !== undefined) req.doc.description = description;
  if (color !== undefined) req.doc.color = color;
  await req.doc.save();
  res.json({ success: true, data: { project: req.doc } });
});

// Deleting a project cascades to everything scoped under it so we never leave
// orphaned collections/requests/workflows behind.
const deleteProject = asyncHandler(async (req, res) => {
  const projectId = req.doc._id;

  await Promise.all([
    Collection.deleteMany({ project: projectId }),
    ApiRequest.deleteMany({ project: projectId }),
    Environment.deleteMany({ project: projectId }),
    Workflow.deleteMany({ project: projectId }),
    Execution.deleteMany({ project: projectId }),
    RequestHistory.deleteMany({ project: projectId }),
  ]);

  await req.doc.deleteOne();
  res.json({ success: true, message: 'Project and all its contents were deleted' });
});

module.exports = { listProjects, createProject, getProject, updateProject, deleteProject };
