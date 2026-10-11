import { Box, CircularProgress } from '@mui/material';

export default function LoadingSpinner({ fullPage = false }) {
  return (
    <Box role="status" aria-label="Loading" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6, minHeight: fullPage ? '100vh' : 'auto' }}>
      <CircularProgress />
    </Box>
  );
}
