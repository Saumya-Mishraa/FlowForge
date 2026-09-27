const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Execution } = require('../models');

const listExecutions = asyncHandler(async (req, res) => {
  const { workflow, project, limit = 50 } = req.query;
  const filter = { owner: req.user._id };
  if (workflow) filter.workflow = workflow;
  if (project) filter.project = project;

  const executions = await Execution.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(parseInt(limit, 10) || 50, 200))
    .select('-nodeResults.response.body -nodeResults.request'); // keep list responses light

  res.json({ success: true, data: { executions } });
});

const getExecution = asyncHandler(async (req, res) => {
  const execution = await Execution.findOne({ _id: req.params.id, owner: req.user._id }).populate(
    'workflow',
    'name'
  );
  if (!execution) throw ApiError.notFound('Execution not found');
  res.json({ success: true, data: { execution } });
});

module.exports = { listExecutions, getExecution };
