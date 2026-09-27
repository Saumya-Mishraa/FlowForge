import { api } from './client';

export const projectsApi = {
  list: () => api.get('/projects').then((r) => r.data),
  create: (payload) => api.post('/projects', payload).then((r) => r.data),
  get: (id) => api.get(`/projects/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/projects/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/projects/${id}`).then((r) => r.data),
};

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data),
};
