import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage } from '../services/apiClient.js';
import { isValidEmail, passwordProblem } from '../utils/validators.js';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.displayName.trim().length < 2) next.displayName = 'Enter your name (at least 2 characters).';
    if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';
    const pw = passwordProblem(form.password);
    if (pw) next.password = pw;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true); setServerError('');
    try {
      await register({ displayName: form.displayName.trim(), email: form.email.trim(), password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not create the account.'));
    } finally { setBusy(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: 'background.default' }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" color="primary" gutterBottom>Create your account</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Notes, photos and videos in one place.</Typography>
          {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
          <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
            <TextField label="Your name" name="displayName" value={form.displayName} onChange={handleChange} error={Boolean(errors.displayName)} helperText={errors.displayName} />
            <TextField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} error={Boolean(errors.email)} helperText={errors.email} />
            <TextField label="Password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange}
              error={Boolean(errors.password)} helperText={errors.password ?? 'At least 8 characters with upper case, lower case and a number.'} />
            <Button type="submit" variant="contained" size="large" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</Button>
          </Stack>
          <Typography sx={{ mt: 3 }} variant="body2">
            Already have an account? <MuiLink component={Link} to="/login">Log in</MuiLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
