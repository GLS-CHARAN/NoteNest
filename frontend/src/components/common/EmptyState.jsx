import { Box, Button, Typography } from '@mui/material';

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2, color: 'text.secondary' }}>
      {icon && <Box sx={{ fontSize: 56, mb: 1, color: 'primary.main', '& svg': { fontSize: 56 } }}>{icon}</Box>}
      <Typography variant="h6" color="text.primary" gutterBottom>{title}</Typography>
      {description && <Typography sx={{ maxWidth: 420, mx: 'auto', mb: 2 }}>{description}</Typography>}
      {actionLabel && <Button variant="contained" onClick={onAction}>{actionLabel}</Button>}
    </Box>
  );
}
