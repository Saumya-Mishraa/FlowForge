const asyncHandler = require('../utils/asyncHandler');
const { Project, Workflow, RequestHistory, Execution } = require('../models');

// Every number here comes from a real query against the user's own data.
// New accounts legitimately get all zeros — the frontend renders that as an
// empty state rather than inventing sample numbers.
const getSummary = asyncHandler(async (req, res) => {
  const owner = req.user._id;

  const [
    totalRequests,
    totalWorkflows,
    successfulExecutions,
    failedExecutions,
    avgDurationAgg,
    recentProjects,
    recentHistory,
  ] = await Promise.all([
    RequestHistory.countDocuments({ owner }),
    Workflow.countDocuments({ owner }),
    Execution.countDocuments({ owner, status: 'succeeded' }),
    Execution.countDocuments({ owner, status: 'failed' }),
    RequestHistory.aggregate([
      { $match: { owner } },
      { $group: { _id: null, avgMs: { $avg: '$durationMs' } } },
    ]),
    Project.find({ owner }).sort({ updatedAt: -1 }).limit(5),
    RequestHistory.find({ owner }).sort({ createdAt: -1 }).limit(10),
  ]);

  const avgResponseTimeMs = avgDurationAgg[0]?.avgMs ? Math.round(avgDurationAgg[0].avgMs) : 0;

  res.json({
    success: true,
    data: {
      stats: {
        totalRequests,
        totalWorkflows,
        successfulExecutions,
        failedExecutions,
        avgResponseTimeMs,
      },
      recentProjects,
      recentActivity: recentHistory.map((h) => ({
        id: h._id,
        type: 'request_executed',
        method: h.method,
        url: h.url,
        status: h.status,
        ok: h.ok,
        createdAt: h.createdAt,
      })),
    },
  });
});

module.exports = { getSummary };
