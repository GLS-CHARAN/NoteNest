import { Box, Card, CardActionArea, CardContent, CardMedia, Chip, Stack, Typography } from '@mui/material';
import PushPinIcon from '@mui/icons-material/PushPin';
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined';
import VideocamIcon from '@mui/icons-material/Videocam';
import ImageIcon from '@mui/icons-material/ImageOutlined';
import { useNavigate } from 'react-router-dom';
import { attachmentUrl } from '../../services/attachmentService.js';
import { formatDate } from '../../utils/formatDate.js';

export default function NoteCard({ note }) {
  const navigate = useNavigate();
  const open = () => navigate(`/notes/${note.id}`);

  return (
    <Card sx={{ height: '100%', display: 'flex' }}>
      <CardActionArea onClick={open} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', height: '100%' }}>
        {note.thumbnailAttachmentId ? (
          <CardMedia component="img" height="150" image={attachmentUrl(note.id, note.thumbnailAttachmentId)} alt="" loading="lazy" />
        ) : null}
        <CardContent sx={{ flexGrow: 1, width: '100%' }}>
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <Typography variant="h6" sx={{ flexGrow: 1, lineHeight: 1.3, wordBreak: 'break-word' }}>{note.title}</Typography>
            {note.isPinned && <PushPinIcon fontSize="small" color="primary" titleAccess="Pinned" />}
          </Stack>

          {note.preview ? (
            <Typography variant="body2" color="text.secondary" className="note-preview" sx={{ mt: 1 }}>{note.preview}</Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>No text</Typography>
          )}

          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
            {note.categoryName && <Chip size="small" color="primary" variant="outlined" label={note.categoryName} />}
            {note.tags.map((t) => <Chip key={t} size="small" label={`#${t}`} />)}
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5, color: 'text.secondary' }}>
            {note.hasImages && <ImageIcon fontSize="small" titleAccess="Has images" />}
            {note.hasVideos && <VideocamIcon fontSize="small" titleAccess="Has video" />}
            {note.isShared && <PeopleIcon fontSize="small" titleAccess={note.role === 'Owner' ? 'Shared with others' : `Shared with you (${note.role})`} />}
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="caption">{formatDate(note.updatedAtUtc)}</Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
