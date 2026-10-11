import { useState } from 'react';
import { Box, Pagination, Typography } from '@mui/material';
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined';
import { getSharedNotes } from '../services/noteService.js';
import { useNotes } from '../hooks/useNotes.js';
import NoteList from '../components/notes/NoteList.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

export default function SharedNotesPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useNotes(getSharedNotes, { page, pageSize: 12 });
  const pages = data ? Math.ceil(data.totalCount / 12) : 0;
  return (
    <>
      <Typography variant="h4" sx={{ mb: 2 }}>Shared with me</Typography>
      <NoteList notes={data?.items} loading={loading} error={error} onRetry={reload}
        emptyState={<EmptyState icon={<PeopleIcon />} title="Nothing shared with you yet" description="When someone shares a note using your email address, it appears here." />} />
      {pages > 1 && <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}><Pagination count={pages} page={page} onChange={(_, p) => setPage(p)} color="primary" /></Box>}
    </>
  );
}
