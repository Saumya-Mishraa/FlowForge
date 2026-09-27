const mongoose = require('mongoose');

// Nodes and edges are stored close to React Flow's own shape so the client
// can load/save without a translation layer. `data` holds node-type-specific
// configuration validated by the workflow-engine at execution time.
const nodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'start',
        'apiRequest',
        'variable',
        'extractVariable',
        'condition',
        'transform',
        'delay',
        'log',
        'end',
      ],
    },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const edgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    // For condition nodes: 'true' | 'false'; undefined for normal edges.
    sourceHandle: { type: String, default: null },
  },
  { _id: false }
);

const workflowSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: '', maxlength: 1000 },

    nodes: { type: [nodeSchema], default: [] },
    edges: { type: [edgeSchema], default: [] },

    isTemplate: { type: Boolean, default: false },
    templateKey: { type: String, default: null },

    lastRunStatus: {
      type: String,
      enum: ['never_run', 'running', 'succeeded', 'failed'],
      default: 'never_run',
    },
    lastRunAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workflow', workflowSchema);
