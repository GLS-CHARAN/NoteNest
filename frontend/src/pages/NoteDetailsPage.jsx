import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import ShareIcon from '@mui/icons-material/ShareOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteNote, getNote, setPinned } from '../services/noteService.js';
import { getErrorMessage } from '../services/apiClient.js';
import { formatDateTime } from '../utils/formatDate.js';
import AttachmentGallery from '../components/media/AttachmentGallery.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import ShareDialog from '../components/notes/ShareDialog.jsx';
import NotFoundPage from './NotFoundPage.jsx';

export default function NoteDetailsPage() {
  const { id } = useParams();          // the :id from /notes/:id
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [status, setStatus] = useState('loading');   // loading | ready | notfound | error
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try { setNote(await getNote(id)); setStatus('ready'); }
    catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) setStatus('notfound');
      else { setError(err); setStatus('error'); }
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (status === 'loading') return <LoadingSpinner />;
  if (status === 'notfound') return <NotFoundPage title="Note not found" description="This note doesn't exist, or you don't have access to it." />;
  if (status === 'error') return <ErrorMessage error={error} onRetry={load} />;

  const isOwner = note.role === 'Owner';
  const canEdit = note.role === 'Owner' || note.role === 'Editor';

  const togglePin = async () => {
    setActionError('');
    try { setNote(await setPinned(note.id, !note.isPinned)); } catch (err) { setActionError(getErrorMessage(err)); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try { await deleteNote(note.id); navigate('/notes', { replace: true }); }
    catch (err) { setActionError(getErrorMessage(err)); setConfirmOpen(false); setDeleting(false); }
  };

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 1 }}>Back</Button>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Typography variant="h4" sx={{ wordBreak: 'break-word' }}>{note.title}</Typography>
        <Stack direction="row" spacing={0.5} flexShrink={0}>
          {isOwner && (
            <Tooltip title={note.isPinned ? 'Unpin' : 'Pin'}>
              <IconButton onClick={togglePin} color={note.isPinned ? 'primary' : 'default'} aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}>
                {note.isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
              </IconButton>
            </Tooltip>
          )}
          {isOwner && <Tooltip title="Share"><IconButton onClick={() => setShareOpen(true)} aria-label="Share note"><ShareIcon /></IconButton></Tooltip>}
          {canEdit && <Tooltip title="Edit"><IconButton onClick={() => navigate(`/notes/${note.id}/edit`)} aria-label="Edit note"><EditIcon /></IconButton></Tooltip>}
          {isOwner && <Tooltip title="Delete"><IconButton color="error" onClick={() => setConfirmOpen(true)} aria-label="Delete note"><DeleteIcon /></IconButton></Tooltip>}
        </Stack>
      </Stack>

      {actionError && <Alert severity="error" sx={{ my: 2 }}>{actionError}</Alert>}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ my: 2 }} alignItems="center">
        {note.categoryName && <Chip color="primary" variant="outlined" label={note.categoryName} />}
        {note.tags.map((t) => <Chip key={t.id} label={`#${t.name}`} />)}
        {!isOwner && <Chip color="secondary" variant="outlined" label={`Shared by ${note.ownerName} · ${note.role}`} />}
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Created {formatDateTime(note.createdAtUtc)} · Updated {formatDateTime(note.updatedAtUtc)}{isOwner ? '' : ` · Owner: ${note.ownerName}`}
      </Typography>

      <Box sx={{ mt: 3 }}>
        {note.content
          ? <Typography className="note-content">{note.content}</Typography>
          : <Typography color="text.secondary" fontStyle="italic">This note has no text.</Typography>}
      </Box>

      <AttachmentGallery attachments={note.attachments} />

      <ConfirmDialog open={confirmOpen} busy={deleting} title="Delete this note?"
        message="The note and all its images and videos will be permanently deleted. This cannot be undone."
        confirmLabel="Delete note" onConfirm={confirmDelete} onCancel={() => setConfirmOpen(false)} />
      {isOwner && <ShareDialog noteId={note.id} open={shareOpen} onClose={() => setShareOpen(false)} />}
    </Box>
  );
}
