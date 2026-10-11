import { Alert, Button } from '@mui/material';
import { getErrorMessage } from '../../services/apiClient.js';

export default function ErrorMessage({ error, message, onRetry }) {
  const text = message ?? getErrorMessage(error);
  return (
    <Alert severity="error" sx={{ my: 2 }} action={onRetry ? <Button color="inherit" size="small" onClick={onRetry}>Try again</Button> : null}>
      {text}
    </Alert>
  );
}
