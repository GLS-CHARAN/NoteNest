import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, FormControlLabel, LinearProgress, Stack, Switch, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createNote, deleteNote, getNote, updateNote } from '../services/noteService.js';
import { deleteAttachment, uploadAttachments } from '../services/attachmentService.js';
import { getErrorMessage } from '../services/apiClient.js';
import { validateFile } from '../utils/fileValidation.js';
import { validateNoteForm } from '../utils/validators.js';
import CategorySelector from '../components/notes/CategorySelector.jsx';
import TagInput from '../components/notes/TagInput.jsx';
import ImageUploader from '../components/media/ImageUploader.jsx';
import VideoUploader from '../components/media/VideoUploader.jsx';
import AttachmentEditor from '../components/media/AttachmentEditor.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import NotFoundPage from './NotFoundPage.jsx';

let pendingCounter = 0;

export default function NoteEditorPage() {
  const { id } = useParams();               // undefined on /notes/new
  const isNew = !id;
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [role, setRole] = useState('Owner');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [tags, setTags] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [existing, setExisting] = useState([]);       // attachments already on the server
  const [removedIds, setRemovedIds] = useState([]);   // existing attachments to delete on save
  const [pending, setPending] = useState([]);         // new files waiting to be uploaded

  const [errors, setErrors] = useState({});
  const [fileErrors, setFileErrors] = useState([]);
  const [serverError, setServerError] = useState(location.state?.uploadError ?? '');
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Keep the latest pending list in a ref so the unmount cleanup can free the preview URLs.
  const pendingRef = useRef(pending);
  useEffect(() => { pendingRef.current = pending; }, [pending]);
  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    getNote(id)
      .then((n) => {
        if (cancelled) return;
        setTitle(n.title); setContent(n.content); setCategoryId(n.categoryId);
        setTags(n.tags.map((t) => t.name)); setIsPinned(n.isPinned);
        setExisting(n.attachments); setRole(n.role);
      })
      .catch((err) => { if (!cancelled) (err.response?.status === 404 || err.response?.status === 403) ? setNotFound(true) : setLoadError(err); })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, isNew]);

  const isOwner = role === 'Owner';
  const canEdit = role === 'Owner' || role === 'Editor';
  const totalFiles = existing.length - removedIds.length + pending.length;

  const addFiles = (files) => {
    const problems = [];
    const accepted = [];
    files.forEach((file) => {
      const problem = validateFile(file);
      if (problem) problems.push(problem);
      else accepted.push({ id: ++pendingCounter, file, url: URL.createObjectURL(file) });   // local preview
    });
    setFileErrors(problems);
    setPending((p) => [...p, ...accepted]);
  };

  const removePending = (pid) => setPending((list) => {
    const hit = list.find((p) => p.id === pid);
    if (hit) URL.revokeObjectURL(hit.url);
    return list.filter((p) => p.id !== pid);
  });

  const removeExisting = (aid) => {
    setRemovedIds((r) => [...r, aid]);
    setExisting((list) => list.filter((a) => a.id !== aid));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const found = validateNoteForm({ title });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true); setServerError(''); setProgress(null);
    let noteId = id;
    try {
      const payload = { title: title.trim(), content, categoryId, tags, isPinned };
      const saved = isNew ? await createNote(payload) : await updateNote(id, payload);
      noteId = saved.id;

      for (const aid of removedIds) await deleteAttachment(noteId, aid);

      if (pending.length > 0) {
        setProgress(0);
        try {
          await uploadAttachments(noteId, pending.map((p) => p.file), setProgress);
        } catch (uploadErr) {
          // The note itself was saved; only the files failed. Send the user to the edit page with the reason.
          navigate(`/notes/${noteId}/edit`, { replace: true, state: { uploadError: `Your note was saved, but the upload failed. ${getErrorMessage(uploadErr)}` } });
          return;
        }
      }
      navigate(`/notes/${noteId}`, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try { await deleteNote(id); navigate('/notes', { replace: true }); }
    catch (err) { setServerError(getErrorMessage(err)); setConfirmDelete(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (notFound) return <NotFoundPage title="Note not found" description="This note doesn't exist, or you don't have access to it." />;
  if (loadError) return <ErrorMessage error={loadError} />;
  if (!canEdit) return <NotFoundPage title="View only" description="You have view-only access to this note." />;

  return (
    <Box component="form" onSubmit={handleSave} noValidate sx={{ maxWidth: 820, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>{isNew ? 'New note' : 'Edit note'}</Typography>
      {!isOwner && <Alert severity="info" sx={{ mb: 2 }}>You are an editor on this note. You can change the text and attachments; the owner controls category, tags and pinning.</Alert>}
      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      <TextField className="title-input" fullWidth autoFocus placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
        error={Boolean(errors.title)} helperText={errors.title} inputProps={{ 'aria-label': 'Title', maxLength: 200 }} variant="standard" sx={{ mb: 2 }} />

      <TextField fullWidth multiline minRows={10} placeholder="Start writing…" value={content} onChange={(e) => setContent(e.target.value)}
        inputProps={{ 'aria-label': 'Note text', maxLength: 20000 }} />

      <Stack spacing={2} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <CategorySelector value={categoryId} onChange={setCategoryId} disabled={!isOwner} />
          <Box sx={{ flex: 2 }}><TagInput value={tags} onChange={setTags} disabled={!isOwner} /></Box>
        </Stack>
        <FormControlLabel disabled={!isOwner} control={<Switch checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />} label="Pin this note" />
      </Stack>

      <Typography variant="subtitle1" sx={{ mt: 4, mb: 1 }}>Images and videos</Typography>
      <Stack direction="row" spacing={1}>
        <ImageUploader onFiles={addFiles} disabled={saving} />
        <VideoUploader onFiles={addFiles} disabled={saving} />
      </Stack>
      <Typography variant="caption" color="text.secondary">JPEG, PNG, WebP up to 10 MB · MP4, WebM up to 100 MB · max 30 files per note</Typography>
      {fileErrors.length > 0 && <Alert severity="warning" sx={{ mt: 1 }}>{fileErrors.map((m) => <div key={m}>{m}</div>)}</Alert>}
      {totalFiles > 30 && <Alert severity="error" sx={{ mt: 1 }}>A note can have at most 30 attachments.</Alert>}

      <AttachmentEditor existing={existing} pending={pending} onRemoveExisting={removeExisting} onRemovePending={removePending} />

      {saving && progress !== null && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">Uploading files… {progress}%</Typography>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}

      <Stack direction="row" spacing={1} sx={{ mt: 4 }}>
        <Button type="submit" variant="contained" size="large" disabled={saving || totalFiles > 30}>{saving ? 'Saving…' : 'Save note'}</Button>
        <Button size="large" disabled={saving} onClick={() => navigate(isNew ? '/notes' : `/notes/${id}`)}>Cancel</Button>
        <Box sx={{ flexGrow: 1 }} />
        {!isNew && isOwner && <Button color="error" disabled={saving} onClick={() => setConfirmDelete(true)}>Delete</Button>}
      </Stack>

      <ConfirmDialog open={confirmDelete} title="Delete this note?" message="The note and all its attachments will be permanently deleted."
        confirmLabel="Delete note" onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} />
    </Box>
  );
}
