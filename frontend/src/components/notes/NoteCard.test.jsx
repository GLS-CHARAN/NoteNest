import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import NoteCard from './NoteCard.jsx';

const note = {
  id: 7, title: 'React Learning Notes', preview: 'Hooks are useful', categoryId: 1, categoryName: 'Study',
  tags: ['react', 'hooks'], isPinned: true, createdAtUtc: '2026-01-01T10:00:00Z', updatedAtUtc: '2026-01-02T10:00:00Z',
  thumbnailAttachmentId: 3, hasImages: true, hasVideos: true, isShared: true, ownerName: 'Asha', role: 'Owner',
};

describe('NoteCard', () => {
  it('shows title, preview, category and tags', () => {
    render(<MemoryRouter><NoteCard note={note} /></MemoryRouter>);
    expect(screen.getByText('React Learning Notes')).toBeInTheDocument();
    expect(screen.getByText('Hooks are useful')).toBeInTheDocument();
    expect(screen.getByText('Study')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();
  });
  it('shows pinned, video and shared indicators', () => {
    render(<MemoryRouter><NoteCard note={note} /></MemoryRouter>);
    expect(screen.getByTitle('Pinned')).toBeInTheDocument();
    expect(screen.getByTitle('Has video')).toBeInTheDocument();
    expect(screen.getByTitle('Shared with others')).toBeInTheDocument();
  });
  it('uses the authorised attachment URL for the thumbnail', () => {
    const { container } = render(<MemoryRouter><NoteCard note={note} /></MemoryRouter>);
    expect(container.querySelector('img')).toHaveAttribute('src', '/api/notes/7/attachments/3');
  });
});
