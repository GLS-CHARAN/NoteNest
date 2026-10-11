import { useState } from 'react';
import { Box, Pagination, Typography } from '@mui/material';
import PushPinIcon from '@mui/icons-material/PushPinOutlined';
import { getNotes } from '../services/noteService.js';
import { useNotes } from '../hooks/useNotes.js';
import NoteList from '../components/notes/NoteList.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

export default function FavoritesPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useNotes(getNotes, { pinned: true, page, pageSize: 12 });
  const pages = data ? Math.ceil(data.totalCount / 12) : 0;
  return (
    <>
      <Typography variant="h4" sx={{ mb: 2 }}>Pinned notes</Typography>
      <NoteList notes={data?.items} loading={loading} error={error} onRetry={reload}
        emptyState={<EmptyState icon={<PushPinIcon />} title="No pinned notes" description="Pin a note from its page to keep it here." />} />
      {pages > 1 && <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}><Pagination count={pages} page={page} onChange={(_, p) => setPage(p)} color="primary" /></Box>}
    </>
  );
}
