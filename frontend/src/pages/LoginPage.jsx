import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage } from '../services/apiClient.js';
import { isValidEmail } from '../utils/validators.js';

export default function LoginPage() {
  const { user, login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from?.pathname ?? '/'} replace />;

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Enter your password.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true); setServerError('');
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not log in.'));
    } finally { setBusy(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: 'background.default' }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" color="primary" gutterBottom>NoteNest</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Log in to open your notes.</Typography>
          {sessionExpired && <Alert severity="info" sx={{ mb: 2 }}>Your session expired. Please log in again.</Alert>}
          {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
          <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
            <TextField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} error={Boolean(errors.email)} helperText={errors.email} />
            <TextField label="Password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={handleChange} error={Boolean(errors.password)} helperText={errors.password} />
            <Button type="submit" variant="contained" size="large" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Button>
          </Stack>
          <Typography sx={{ mt: 3 }} variant="body2">
            New here? <MuiLink component={Link} to="/register">Create an account</MuiLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
