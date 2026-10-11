import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../context/AuthContext.jsx';
import LoginPage from './LoginPage.jsx';

describe('LoginPage', () => {
  it('shows validation errors and does not call login for empty input', async () => {
    const login = vi.fn();
    render(
      <AuthContext.Provider value={{ user: null, loading: false, login, sessionExpired: false }}>
        <MemoryRouter><LoginPage /></MemoryRouter>
      </AuthContext.Provider>
    );
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('calls login with the typed credentials', async () => {
    const login = vi.fn().mockResolvedValue({});
    render(
      <AuthContext.Provider value={{ user: null, loading: false, login, sessionExpired: false }}>
        <MemoryRouter><LoginPage /></MemoryRouter>
      </AuthContext.Provider>
    );
    await userEvent.type(screen.getByLabelText(/email/i), 'me@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(login).toHaveBeenCalledWith({ email: 'me@example.com', password: 'Secret123' });
  });
});
