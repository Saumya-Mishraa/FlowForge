import { api } from './client';

export const collectionsApi = {
  list: (projectId) => api.get('/collections', { params: { project: projectId } }).then((r) => r.data),
  create: (payload) => api.post('/collections', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/collections/${id}`, payload).then((r) => r.data),
  duplicate: (id) => api.post(`/collections/${id}/duplicate`).then((r) => r.data),
  remove: (id) => api.delete(`/collections/${id}`).then((r) => r.data),
  addFolder: (id, name) => api.post(`/collections/${id}/folders`, { name }).then((r) => r.data),
  renameFolder: (id, folderId, name) =>
    api.patch(`/collections/${id}/folders/${folderId}`, { name }).then((r) => r.data),
  deleteFolder: (id, folderId) => api.delete(`/collections/${id}/folders/${folderId}`).then((r) => r.data),
};

export const requestsApi = {
  list: (projectId, collectionId) =>
    api.get('/requests', { params: { project: projectId, collection: collectionId } }).then((r) => r.data),
  save: (payload) => api.post('/requests', payload).then((r) => r.data),
  get: (id) => api.get(`/requests/${id}`).then((r) => r.data),
  update: (id, payload) => api.patch(`/requests/${id}`, payload).then((r) => r.data),
  duplicate: (id) => api.post(`/requests/${id}/duplicate`).then((r) => r.data),
  remove: (id) => api.delete(`/requests/${id}`).then((r) => r.data),
  execute: (payload) => api.post('/requests/execute', payload).then((r) => r.data),
};

export const environmentsApi = {
  list: (projectId) => api.get('/environments', { params: { project: projectId } }).then((r) => r.data),
  create: (payload) => api.post('/environments', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/environments/${id}`, payload).then((r) => r.data),
  activate: (id) => api.post(`/environments/${id}/activate`).then((r) => r.data),
  remove: (id) => api.delete(`/environments/${id}`).then((r) => r.data),
};

export const historyApi = {
  list: (projectId, limit) => api.get('/history', { params: { project: projectId, limit } }).then((r) => r.data),
  get: (id) => api.get(`/history/${id}`).then((r) => r.data),
  rerun: (id) => api.post(`/history/${id}/rerun`).then((r) => r.data),
  remove: (id) => api.delete(`/history/${id}`).then((r) => r.data),
  clear: (projectId) => api.delete('/history', { params: { project: projectId } }).then((r) => r.data),
};

export const openapiApi = {
  parse: (specText) => api.post('/openapi/parse', { specText }).then((r) => r.data),
  import: (payload) => api.post('/openapi/import', payload).then((r) => r.data),
};
