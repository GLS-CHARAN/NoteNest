import apiClient from './apiClient.js';

// Multipart upload. onProgress receives a number from 0 to 100.
export function uploadAttachments(noteId, files, onProgress) {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  return apiClient
    .post(`/notes/${noteId}/attachments`, form, {
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    })
    .then((r) => r.data);
}

export const deleteAttachment = (noteId, attachmentId) =>
  apiClient.delete(`/notes/${noteId}/attachments/${attachmentId}`);

// <img src> and <video src> can use this URL directly; the cookie is sent automatically.
export const attachmentUrl = (noteId, attachmentId) => `/api/notes/${noteId}/attachments/${attachmentId}`;
