import { Box, Chip, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import { formatBytes } from '../../utils/fileValidation.js';

function Tile({ children, label, size, onRemove, badge }) {
  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      <IconButton size="small" aria-label={`Remove ${label}`} onClick={onRemove}
        sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(0,0,0,.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,.8)' } }}>
        <CloseIcon fontSize="small" />
      </IconButton>
      {badge}
      <Typography variant="caption" color="text.secondary" noWrap display="block">{label} · {formatBytes(size)}</Typography>
    </Box>
  );
}

// existing: attachments already saved on the server. pending: files chosen but not yet uploaded.
export default function AttachmentEditor({ existing, pending, onRemoveExisting, onRemovePending }) {
  if (existing.length === 0 && pending.length === 0) return null;
  const videoBadge = <Chip size="small" icon={<VideocamIcon />} label="Video" sx={{ position: 'absolute', left: 6, top: 6, bgcolor: 'rgba(0,0,0,.6)', color: '#fff', '& .MuiChip-icon': { color: '#fff' } }} />;

  return (
    <div className="media-grid" style={{ marginTop: 16 }}>
      {existing.map((a) => (
        <Tile key={`e${a.id}`} label={a.fileName} size={a.fileSize} onRemove={() => onRemoveExisting(a.id)} badge={a.mediaType === 'Video' ? videoBadge : null}>
          {a.mediaType === 'Image' ? <img src={a.url} alt={a.fileName} /> : <video src={a.url} preload="metadata" muted />}
        </Tile>
      ))}
      {pending.map((p) => (
        <Tile key={p.id} label={p.file.name} size={p.file.size} onRemove={() => onRemovePending(p.id)} badge={p.file.type.startsWith('video/') ? videoBadge : null}>
          {p.file.type.startsWith('image/') ? <img src={p.url} alt={p.file.name} /> : <video src={p.url} preload="metadata" muted />}
        </Tile>
      ))}
    </div>
  );
}
