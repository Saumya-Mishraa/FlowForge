const mongoose = require('mongoose');

const nodeResultSchema = new mongoose.Schema(
  {
    nodeId: { type: String, required: true },
    nodeType: { type: String, required: true },
    label: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'running', 'success', 'failed', 'skipped'],
      default: 'pending',
    },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    durationMs: { type: Number, default: 0 },

    // Populated for apiRequest nodes
    request: { type: mongoose.Schema.Types.Mixed, default: null },
    response: { type: mongoose.Schema.Types.Mixed, default: null },

    // Generic output any node type can produce (extracted vars, condition result, etc.)
    output: { type: mongoose.Schema.Types.Mixed, default: null },
    error: { type: String, default: '' },
  },
  { _id: false }
);

const executionSchema = new mongoose.Schema(
  {
    workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: {
      type: String,
      enum: ['running', 'succeeded', 'failed', 'stopped'],
      default: 'running',
    },
    mode: { type: String, enum: ['run', 'debug'], default: 'run' },

    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    durationMs: { type: Number, default: 0 },

    variables: { type: mongoose.Schema.Types.Mixed, default: {} },
    nodeResults: { type: [nodeResultSchema], default: [] },

    error: { type: String, default: '' },
  },
  { timestamps: true }
);

executionSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Execution', executionSchema);
