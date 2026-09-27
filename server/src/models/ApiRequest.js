const mongoose = require('mongoose');

const kvSchema = new mongoose.Schema(
  {
    key: { type: String, default: '' },
    value: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const authSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['none', 'bearer', 'basic', 'apiKey', 'oauth2'],
      default: 'none',
    },
    bearerToken: { type: String, default: '' },
    basicUsername: { type: String, default: '' },
    basicPassword: { type: String, default: '' },
    apiKeyName: { type: String, default: '' },
    apiKeyValue: { type: String, default: '' },
    apiKeyIn: { type: String, enum: ['header', 'query'], default: 'header' },
    // OAuth2 architecture placeholder — see README for what's implemented vs scaffolded.
    oauth2: {
      grantType: { type: String, default: 'client_credentials' },
      tokenUrl: { type: String, default: '' },
      clientId: { type: String, default: '' },
      clientSecret: { type: String, default: '' },
      accessToken: { type: String, default: '' },
    },
  },
  { _id: false }
);

const bodySchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ['none', 'json', 'raw', 'formData', 'urlencoded'],
      default: 'none',
    },
    json: { type: String, default: '' },
    raw: { type: String, default: '' },
    formData: { type: [kvSchema], default: [] },
    urlencoded: { type: [kvSchema], default: [] },
  },
  { _id: false }
);

const apiRequestSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    collection: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', index: true },
    folderId: { type: mongoose.Schema.Types.ObjectId, default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: '', maxlength: 1000 },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      default: 'GET',
    },
    url: { type: String, required: true },

    params: { type: [kvSchema], default: [] },
    headers: { type: [kvSchema], default: [] },
    auth: { type: authSchema, default: () => ({}) },
    body: { type: bodySchema, default: () => ({}) },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

module.exports = mongoose.model('ApiRequest', apiRequestSchema);
