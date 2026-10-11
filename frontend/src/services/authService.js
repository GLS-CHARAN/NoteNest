import apiClient from './apiClient.js';

export const register = (payload) => apiClient.post('/auth/register', payload).then((r) => r.data);
export const login = (payload) => apiClient.post('/auth/login', payload).then((r) => r.data);
export const logout = () => apiClient.post('/auth/logout');
export const getCurrentUser = () => apiClient.get('/auth/me').then((r) => r.data);
