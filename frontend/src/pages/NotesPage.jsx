import { useEffect, useMemo, useState, useCallback } from 'react';
import { Box, Button, Pagination, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import NoteAddIcon from '@mui/icons-material/NoteAddOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getNotes, getTags } from '../services/noteService.js';
import { useNotes } from '../hooks/useNotes.js';
import { useDebounce } from '../hooks/useDebounce.js';
import NoteList from '../components/notes/NoteList.jsx';
import SearchBar from '../components/notes/SearchBar.jsx';
import FilterBar from '../components/notes/FilterBar.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

const PAGE_SIZE = 12;

export default function NotesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tags, setTags] = useState([]);

  // The URL is the single source of truth for filters, so links and the back button just work.
  const filters = useMemo(() => ({
    search: params.get('search') ?? '',
    categoryId: params.get('categoryId') ?? '',
    tag: params.get('tag') ?? '',
    hasImages: params.get('hasImages') === 'true',
    hasVideos: params.get('hasVideos') === 'true',
    pinned: params.get('pinned') === 'true',
    sort: params.get('sort') ?? 'updated',
    dir: params.get('dir') ?? 'desc',
    page: Number(params.get('page') ?? 1),
  }), [params]);

  const updateFilters = useCallback((patch) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === '' || v === false || v === null || v === undefined) next.delete(k); else next.set(k, String(v));
      });
      if (!('page' in patch)) next.delete('page');   // any filter change returns to page 1
      return next;
    }, { replace: true });
  }, [setParams]);

  // Typing updates local state at once; the URL (and server request) follows 350 ms later.
  const [searchText, setSearchText] = useState(filters.search);
  const debouncedSearch = useDebounce(searchText);
  useEffect(() => { if (debouncedSearch === searchText && debouncedSearch !== filters.search) updateFilters({ search: debouncedSearch }); }, [debouncedSearch, searchText]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setSearchText(filters.search); }, [filters.search]);

  useEffect(() => { getTags().then(setTags).catch(() => {}); }, []);

  const query = useMemo(() => ({ ...filters, pageSize: PAGE_SIZE }), [filters]);
  const { data, loading, error, reload } = useNotes(getNotes, query);

  const hasActiveFilters = Boolean(filters.search || filters.categoryId || filters.tag || filters.hasImages || filters.hasVideos || filters.pinned);
  const clearFilters = () => { setSearchText(''); setParams({}, { replace: true }); };
  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

  const emptyState = hasActiveFilters
    ? <EmptyState icon={<SearchOffIcon />} title="No notes match these filters" description="Try a different search or clear the filters." actionLabel="Clear filters" onAction={clearFilters} />
    : <EmptyState icon={<NoteAddIcon />} title="No notes yet" description="Create a note to get started." actionLabel="Create your first note" onAction={() => navigate('/notes/new')} />;

  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">All notes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/notes/new')}>New note</Button>
      </Stack>
      <SearchBar value={searchText} onChange={setSearchText} />
      <FilterBar filters={filters} tags={tags} onChange={updateFilters} onClear={clearFilters} hasActiveFilters={hasActiveFilters} />
      <Typography variant="body2" color="text.secondary">{data ? `${data.totalCount} note${data.totalCount === 1 ? '' : 's'}` : ' '}</Typography>
      <NoteList notes={data?.items} loading={loading} error={error} onRetry={reload} emptyState={emptyState} />
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <Pagination count={totalPages} page={filters.page} color="primary" onChange={(_, p) => updateFilters({ page: p })} />
        </Box>
      )}
    </Stack>
  );
}
