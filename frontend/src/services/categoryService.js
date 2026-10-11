import apiClient from './apiClient.js';

export const getCategories = () => apiClient.get('/categories').then((r) => r.data);
export const createCategory = (name) => apiClient.post('/categories', { name }).then((r) => r.data);
export const renameCategory = (id, name) => apiClient.put(`/categories/${id}`, { name }).then((r) => r.data);
export const deleteCategory = (id) => apiClient.delete(`/categories/${id}`);
