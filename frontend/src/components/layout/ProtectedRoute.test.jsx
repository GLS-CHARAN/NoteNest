import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../../context/AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

const renderWith = (auth) =>
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route path="/login" element={<div>Login screen</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/secret" element={<div>Secret notes</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('ProtectedRoute', () => {
  it('redirects anonymous visitors to the login page', () => {
    renderWith({ user: null, loading: false });
    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByText('Secret notes')).not.toBeInTheDocument();
  });
  it('shows the page to a logged-in user', () => {
    renderWith({ user: { id: '1', displayName: 'Asha' }, loading: false });
    expect(screen.getByText('Secret notes')).toBeInTheDocument();
  });
  it('shows a spinner while checking the session', () => {
    renderWith({ user: null, loading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
