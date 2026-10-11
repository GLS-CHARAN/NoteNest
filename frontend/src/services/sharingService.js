import apiClient from './apiClient.js';

export const getShares = (noteId) => apiClient.get(`/notes/${noteId}/shares`).then((r) => r.data);
export const shareNote = (noteId, email, permission) =>
  apiClient.post(`/notes/${noteId}/shares`, { email, permission }).then((r) => r.data);
export const revokeShare = (noteId, shareId) => apiClient.delete(`/notes/${noteId}/shares/${shareId}`);
