import { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemText, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { getShares, revokeShare, shareNote } from '../../services/sharingService.js';
import { getErrorMessage } from '../../services/apiClient.js';
import { isValidEmail } from '../../utils/validators.js';

export default function ShareDialog({ noteId, open, onClose, onChanged }) {
  const [shares, setShares] = useState([]);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('Viewer');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    getShares(noteId).then(setShares).catch((e) => setError(getErrorMessage(e)));
  }, [open, noteId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    setBusy(true); setError('');
    try {
      await shareNote(noteId, email.trim(), permission);
      setShares(await getShares(noteId));
      setEmail('');
      onChanged?.();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const revoke = async (shareId) => {
    try { await revokeShare(noteId, shareId); setShares((s) => s.filter((x) => x.id !== shareId)); onChanged?.(); }
    catch (err) { setError(getErrorMessage(err)); }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Share note</DialogTitle>
      <DialogContent>
        <Stack component="form" onSubmit={submit} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
          <TextField label="Email address" type="email" size="small" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
          <Select size="small" value={permission} onChange={(e) => setPermission(e.target.value)} sx={{ minWidth: 120 }} inputProps={{ 'aria-label': 'Permission' }}>
            <MenuItem value="Viewer">Viewer</MenuItem>
            <MenuItem value="Editor">Editor</MenuItem>
          </Select>
          <Button type="submit" variant="contained" disabled={busy}>Share</Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Typography variant="subtitle2" sx={{ mt: 3 }}>People with access</Typography>
        {shares.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 1 }}>This note is private. Only you can see it.</Typography>
        ) : (
          <List dense>
            {shares.map((s) => (
              <ListItem key={s.id} disableGutters
                secondaryAction={<IconButton edge="end" aria-label={`Remove ${s.email}`} onClick={() => revoke(s.id)}><DeleteIcon /></IconButton>}>
                <ListItemText primary={`${s.displayName} (${s.email})`} secondary={s.permission} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Done</Button></DialogActions>
    </Dialog>
  );
}
