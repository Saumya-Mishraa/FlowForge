import { api } from './client';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then((r) => r.data),
  googleStatus: () => api.get('/auth/google/status').then((r) => r.data),
};

export const userApi = {
  updateProfile: (payload) => api.patch('/users/me', payload).then((r) => r.data),
  changePassword: (payload) => api.post('/users/me/change-password', payload).then((r) => r.data),
};
