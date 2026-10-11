import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';

const ThemeModeContext = createContext(null);
const ACCENT = '#3b5bdb';

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('notenest-theme') || 'light'; } catch { return 'light'; }
  });

  useEffect(() => {
    try { localStorage.setItem('notenest-theme', mode); } catch { /* ignore */ }
  }, [mode]);

  const toggleMode = useCallback(() => setMode((m) => (m === 'light' ? 'dark' : 'light')), []);

  // useMemo: only rebuild the MUI theme when the mode changes.
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: ACCENT },
          background: mode === 'light' ? { default: '#f5f6f8', paper: '#ffffff' } : { default: '#12151c', paper: '#1b2030' },
          text: mode === 'light' ? { primary: '#1f2a44', secondary: '#5b6785' } : { primary: '#e8ecf6', secondary: '#9aa6c4' },
        },
        shape: { borderRadius: 14 },
        typography: {
          fontFamily: "'Inter', system-ui, sans-serif",
          h4: { fontWeight: 700, letterSpacing: '-0.02em' },
          h5: { fontWeight: 700 },
          h6: { fontWeight: 600 },
          button: { textTransform: 'none', fontWeight: 600 },
        },
        components: {
          MuiCard: { styleOverrides: { root: { boxShadow: '0 1px 3px rgba(31,42,68,0.08), 0 4px 12px rgba(31,42,68,0.05)' } } },
          MuiButton: { defaultProps: { disableElevation: true } },
        },
      }),
    [mode]
  );

  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export const useThemeMode = () => useContext(ThemeModeContext);
