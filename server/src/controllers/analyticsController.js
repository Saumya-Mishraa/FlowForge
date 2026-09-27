const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { RequestHistory, Execution } = require('../models');

const getAnalytics = asyncHandler(async (req, res) => {
  const { project, days = 14 } = req.query;

  const owner = req.user._id;

  const since = new Date(
    Date.now() -
      Math.min(parseInt(days, 10) || 14, 90) *
        24 *
        60 *
        60 *
        1000
  );

  const historyFilter = {
    owner,
    createdAt: { $gte: since },
  };

  const executionFilter = {
    owner,
    createdAt: { $gte: since },
  };

 if (project) {
  const projectId = new mongoose.Types.ObjectId(project);

  historyFilter.project = projectId;
  executionFilter.project = projectId;
}

  const [
    totals,
    requestsOverTime,
    statusBreakdown,
    topEndpoints,
    executionTotals,
  ] = await Promise.all([
    RequestHistory.aggregate([
      { $match: historyFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: {
            $sum: {
              $cond: [{ $eq: ['$ok', true] }, 1, 0],
            },
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ['$ok', false] }, 1, 0],
            },
          },
          avgDurationMs: {
            $avg: '$durationMs',
          },
        },
      },
    ]),

    RequestHistory.aggregate([
      { $match: historyFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
          successful: {
            $sum: {
              $cond: [{ $eq: ['$ok', true] }, 1, 0],
            },
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ['$ok', false] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    RequestHistory.aggregate([
      { $match: historyFilter },
      {
        $group: {
          _id: '$ok',
          count: { $sum: 1 },
        },
      },
    ]),

    RequestHistory.aggregate([
      { $match: historyFilter },
      {
        $group: {
          _id: {
            method: '$method',
            url: '$url',
          },
          count: { $sum: 1 },
          avgDurationMs: {
            $avg: '$durationMs',
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),

    Execution.aggregate([
      { $match: executionFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const summary = totals[0] || {
    total: 0,
    successful: 0,
    failed: 0,
    avgDurationMs: 0,
  };

  const successRate =
    summary.total > 0
      ? Math.round((summary.successful / summary.total) * 1000) / 10
      : 0;

  res.json({
    success: true,
    data: {
      summary: {
        totalRequests: summary.total,
        successfulRequests: summary.successful,
        failedRequests: summary.failed,
        successRate,
        avgResponseTimeMs: summary.avgDurationMs
          ? Math.round(summary.avgDurationMs)
          : 0,
      },

      requestsOverTime: requestsOverTime.map((item) => ({
        date: item._id,
        count: item.count,
        successful: item.successful,
        failed: item.failed,
      })),

      statusBreakdown: {
        successful:
          statusBreakdown.find((item) => item._id === true)?.count || 0,
        failed:
          statusBreakdown.find((item) => item._id === false)?.count || 0,
      },

      topEndpoints: topEndpoints.map((item) => ({
        method: item._id.method,
        url: item._id.url,
        count: item.count,
        avgDurationMs: Math.round(item.avgDurationMs || 0),
      })),

      workflowExecutions: {
        succeeded:
          executionTotals.find((item) => item._id === 'succeeded')?.count || 0,
        failed:
          executionTotals.find((item) => item._id === 'failed')?.count || 0,
        stopped:
          executionTotals.find((item) => item._id === 'stopped')?.count || 0,
      },
    },
  });
});

module.exports = { getAnalytics };