const mongoose = require('mongoose');

const requestHistorySchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sourceRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiRequest', default: null },

    method: { type: String, required: true },
    url: { type: String, required: true },
    resolvedUrl: { type: String, default: '' },
    environmentUsed: { type: String, default: '' },

    status: { type: Number, default: 0 },
    statusText: { type: String, default: '' },
    ok: { type: Boolean, default: false },
    durationMs: { type: Number, default: 0 },
    responseSizeBytes: { type: Number, default: 0 },

    errorMessage: { type: String, default: '' },

    // Trimmed snapshots for re-run/inspection — not the full raw body if huge.
    requestSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    responseSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

requestHistorySchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('RequestHistory', requestHistorySchema);
