// Same rules as the server. This is only for fast feedback; the server re-checks everything.
export const IMAGE_TYPES = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] };
export const VIDEO_TYPES = { 'video/mp4': ['.mp4'], 'video/webm': ['.webm'] };
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export const isImage = (file) => file.type in IMAGE_TYPES;
export const isVideo = (file) => file.type in VIDEO_TYPES;

// Returns an error string, or null when the file is fine.
export function validateFile(file) {
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  const table = isImage(file) ? IMAGE_TYPES : isVideo(file) ? VIDEO_TYPES : null;
  if (!table) return `"${file.name}": only JPEG, PNG, WebP, MP4 and WebM files are allowed.`;
  if (!table[file.type].includes(ext)) return `"${file.name}": the file extension does not match its type.`;
  if (file.size === 0) return `"${file.name}" is empty.`;
  const max = isImage(file) ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size > max) return `"${file.name}" is larger than ${max / (1024 * 1024)} MB.`;
  return null;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
