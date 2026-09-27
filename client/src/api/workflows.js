import { api } from './client';

export const workflowsApi = {
  list: (projectId) => api.get('/workflows', { params: { project: projectId } }).then((r) => r.data),
  templates: () => api.get('/workflows/templates').then((r) => r.data),
  create: (payload) => api.post('/workflows', payload).then((r) => r.data),
  get: (id) => api.get(`/workflows/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/workflows/${id}`, payload).then((r) => r.data),
  duplicate: (id) => api.post(`/workflows/${id}/duplicate`).then((r) => r.data),
  remove: (id) => api.delete(`/workflows/${id}`).then((r) => r.data),
  validate: (id) => api.get(`/workflows/${id}/validate`).then((r) => r.data),
  run: (id) => api.post(`/workflows/${id}/run`).then((r) => r.data),
};

export const debugApi = {
  start: (workflowId) => api.post(`/workflows/${workflowId}/debug/start`).then((r) => r.data),
  step: (workflowId, sessionId) =>
    api.post(`/workflows/${workflowId}/debug/${sessionId}/step`).then((r) => r.data),
  stop: (workflowId, sessionId) =>
    api.post(`/workflows/${workflowId}/debug/${sessionId}/stop`).then((r) => r.data),
};

export const executionsApi = {
  list: (params) => api.get('/executions', { params }).then((r) => r.data),
  get: (id) => api.get(`/executions/${id}`).then((r) => r.data),
};

export const analyticsApi = {
  get: (params) => api.get('/analytics', { params }).then((r) => r.data),
};
