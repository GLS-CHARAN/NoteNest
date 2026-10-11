import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);       // true while we ask "who am I?" on page load
  const [sessionExpired, setSessionExpired] = useState(false);

  // On first load, ask the server whether the cookie is still valid.
  useEffect(() => {
    let cancelled = false;
    authService
      .getCurrentUser()
      .then((u) => !cancelled && setUser(u))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  // apiClient fires this event when any request comes back 401.
  useEffect(() => {
    const onExpired = () => { setUser(null); setSessionExpired(true); };
    window.addEventListener('notenest:session-expired', onExpired);
    return () => window.removeEventListener('notenest:session-expired', onExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    const u = await authService.login(credentials);
    setSessionExpired(false);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const u = await authService.register(payload);
    setSessionExpired(false);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } finally { setUser(null); }
  }, []);

  const value = useMemo(
    () => ({ user, loading, sessionExpired, login, register, logout }),
    [user, loading, sessionExpired, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
