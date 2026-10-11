import apiClient from './apiClient.js';

// Removes empty filter values so the URL stays clean.
const clean = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false));

export const getNotes = (params = {}) => apiClient.get('/notes', { params: clean(params) }).then((r) => r.data);
export const getSharedNotes = (params = {}) =>
  apiClient.get('/notes/shared-with-me', { params: clean(params) }).then((r) => r.data);
export const getNote = (id) => apiClient.get(`/notes/${id}`).then((r) => r.data);
export const createNote = (payload) => apiClient.post('/notes', payload).then((r) => r.data);
export const updateNote = (id, payload) => apiClient.put(`/notes/${id}`, payload).then((r) => r.data);
export const deleteNote = (id) => apiClient.delete(`/notes/${id}`);
export const setPinned = (id, isPinned) => apiClient.patch(`/notes/${id}/pin`, { isPinned }).then((r) => r.data);
export const getTags = () => apiClient.get('/tags').then((r) => r.data);
