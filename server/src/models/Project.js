const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    color: { type: String, default: '#E91E63' },
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1, name: 1 });

module.exports = mongoose.model('Project', projectSchema);
