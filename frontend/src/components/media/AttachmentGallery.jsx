import { useState } from 'react';
import { Box, Dialog, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Read-only gallery for the details page: images open in a larger preview, videos have controls.
export default function AttachmentGallery({ attachments }) {
  const [preview, setPreview] = useState(null);
  const images = attachments.filter((a) => a.mediaType === 'Image');
  const videos = attachments.filter((a) => a.mediaType === 'Video');
  if (attachments.length === 0) return null;

  return (
    <Box sx={{ mt: 3 }}>
      {images.length > 0 && (
        <>
          <Typography variant="subtitle2" gutterBottom>Images ({images.length})</Typography>
          <div className="media-grid">
            {images.map((a) => (
              <img key={a.id} src={a.url} alt={a.fileName} loading="lazy" style={{ cursor: 'zoom-in' }}
                onClick={() => setPreview(a)} />
            ))}
          </div>
        </>
      )}
      {videos.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 3 }} gutterBottom>Videos ({videos.length})</Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            {videos.map((a) => (
              <Box key={a.id}>
                <video src={a.url} controls preload="metadata" style={{ width: '100%', borderRadius: 12, background: '#000' }} />
                <Typography variant="caption" color="text.secondary">{a.fileName}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth="lg">
        <IconButton aria-label="Close preview" onClick={() => setPreview(null)} sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'background.paper' }}><CloseIcon /></IconButton>
        {preview && <img src={preview.url} alt={preview.fileName} style={{ maxWidth: '100%', maxHeight: '90vh', display: 'block' }} />}
      </Dialog>
    </Box>
  );
}
