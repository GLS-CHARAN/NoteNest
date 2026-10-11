import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Divider, FormControlLabel, IconButton, List, ListItem, ListItemText, Stack, Switch, TextField, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../hooks/useAuth.js';
import { useThemeMode } from '../context/ThemeContext.jsx';
import { useCategories } from '../context/CategoriesContext.jsx';
import { getErrorMessage } from '../services/apiClient.js';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';

export default function SettingsPage() {
  const { user } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const { categories, add, rename, remove } = useCategories();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [error, setError] = useState('');

  const run = async (fn) => { setError(''); try { await fn(); } catch (e) { setError(getErrorMessage(e)); } };

  const handleAdd = (e) => { e.preventDefault(); if (!newName.trim()) return; run(async () => { await add(newName.trim()); setNewName(''); }); };
  const saveRename = () => run(async () => { await rename(editingId, editName.trim()); setEditingId(null); });
  const confirmDelete = () => run(async () => { await remove(toDelete.id); setToDelete(null); });

  return (
    <Stack spacing={3} sx={{ maxWidth: 640 }}>
      <Typography variant="h4">Settings</Typography>

      <Card><CardContent>
        <Typography variant="h6">Profile</Typography>
        <Typography>{user.displayName}</Typography>
        <Typography color="text.secondary">{user.email}</Typography>
      </CardContent></Card>

      <Card><CardContent>
        <Typography variant="h6">Appearance</Typography>
        <FormControlLabel control={<Switch checked={mode === 'dark'} onChange={toggleMode} />} label="Dark mode" />
      </CardContent></Card>

      <Card><CardContent>
        <Typography variant="h6" gutterBottom>Categories</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleAdd} sx={{ display: 'flex', gap: 1 }}>
          <TextField size="small" fullWidth label="New category" value={newName} onChange={(e) => setNewName(e.target.value)} inputProps={{ maxLength: 60 }} />
          <Button type="submit" variant="contained">Add</Button>
        </Box>
        <Divider sx={{ my: 2 }} />
        {categories.length === 0 && <Typography color="text.secondary">No categories yet.</Typography>}
        <List dense>
          {categories.map((c) => (
            <ListItem key={c.id} disableGutters
              secondaryAction={editingId === c.id ? (
                <>
                  <IconButton aria-label="Save name" onClick={saveRename}><CheckIcon /></IconButton>
                  <IconButton aria-label="Cancel rename" onClick={() => setEditingId(null)}><CloseIcon /></IconButton>
                </>
              ) : (
                <>
                  <IconButton aria-label={`Rename ${c.name}`} onClick={() => { setEditingId(c.id); setEditName(c.name); }}><EditIcon /></IconButton>
                  <IconButton aria-label={`Delete ${c.name}`} onClick={() => setToDelete(c)}><DeleteIcon /></IconButton>
                </>
              )}>
              {editingId === c.id
                ? <TextField size="small" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus sx={{ mr: 12 }} />
                : <ListItemText primary={c.name} />}
            </ListItem>
          ))}
        </List>
      </CardContent></Card>

      <ConfirmDialog open={Boolean(toDelete)} title={`Delete "${toDelete?.name}"?`}
        message="Notes in this category are kept; they just become uncategorised."
        confirmLabel="Delete category" onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </Stack>
  );
}
