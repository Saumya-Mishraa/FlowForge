const mongoose = require('mongoose');

const variableSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, default: '' },
    secret: { type: Boolean, default: false },
  },
  { _id: false }
);

const environmentSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    isActive: { type: Boolean, default: false },
    variables: { type: [variableSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Environment', environmentSchema);
