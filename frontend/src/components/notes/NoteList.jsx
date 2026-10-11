import NoteCard from './NoteCard.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import ErrorMessage from '../common/ErrorMessage.jsx';
import EmptyState from '../common/EmptyState.jsx';

// Handles the four states every list needs: loading, error, empty, and data.
export default function NoteList({ notes, loading, error, onRetry, emptyState }) {
  if (loading && !notes) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={onRetry} />;
  if (!notes || notes.length === 0) return emptyState ?? <EmptyState title="Nothing here yet" />;

  return (
    <div className="note-grid" style={{ opacity: loading ? 0.6 : 1 }}>
      {notes.map((n) => <NoteCard key={n.id} note={n} />)}
    </div>
  );
}
