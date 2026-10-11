import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import NoteAddIcon from '@mui/icons-material/NoteAddOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useCategories } from '../context/CategoriesContext.jsx';
import { getNotes, getSharedNotes } from '../services/noteService.js';
import NoteList from '../components/notes/NoteList.jsx';
import SearchBar from '../components/notes/SearchBar.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';

function Stat({ label, value }) {
  return (
    <Card sx={{ flex: 1, minWidth: 140 }}>
      <CardContent>
        <Typography variant="h4">{value}</Typography>
        <Typography color="text.secondary">{label}</Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, recent: null, pinned: null, shared: null });
  const [search, setSearch] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    // Promise.all runs the three requests at the same time.
    Promise.all([
      getNotes({ sort: 'updated', pageSize: 6 }),
      getNotes({ pinned: true, pageSize: 6 }),
      getSharedNotes({ pageSize: 1 }),
    ])
      .then(([recent, pinned, shared]) => !cancelled && setState({ loading: false, error: null, recent, pinned, shared }))
      .catch((error) => !cancelled && setState((s) => ({ ...s, loading: false, error })));
    return () => { cancelled = true; };
  }, [reloadToken]);

  const onSearch = (e) => { e.preventDefault(); navigate(search.trim() ? `/notes?search=${encodeURIComponent(search.trim())}` : '/notes'); };

  if (state.loading && !state.recent) return <LoadingSpinner />;
  if (state.error) return <ErrorMessage error={state.error} onRetry={() => setReloadToken((n) => n + 1)} />;

  const { recent, pinned, shared } = state;
  const hasNotes = recent.totalCount > 0;

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
        <Box>
          <Typography variant="h4">Welcome back, {user.displayName}</Typography>
          <Typography color="text.secondary">Here is what is happening in your notes.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/notes/new')}>Create new note</Button>
      </Stack>

      <Box component="form" onSubmit={onSearch}><SearchBar value={search} onChange={setSearch} /></Box>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Stat label="Total notes" value={recent.totalCount} />
        <Stat label="Pinned" value={pinned.totalCount} />
        <Stat label="Shared with me" value={shared.totalCount} />
        <Stat label="Categories" value={categories.length} />
      </Stack>

      {categories.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {categories.map((c) => <Chip key={c.id} label={c.name} clickable onClick={() => navigate(`/notes?categoryId=${c.id}`)} />)}
        </Stack>
      )}

      {!hasNotes ? (
        <EmptyState icon={<NoteAddIcon />} title="Your notebook is empty"
          description="Write your first note. You can add photos and videos to it too."
          actionLabel="Create your first note" onAction={() => navigate('/notes/new')} />
      ) : (
        <>
          {pinned.items.length > 0 && (
            <section>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Pinned</Typography>
              <NoteList notes={pinned.items} />
            </section>
          )}
          <section>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Recently updated</Typography>
            <NoteList notes={recent.items} />
          </section>
        </>
      )}
    </Stack>
  );
}
