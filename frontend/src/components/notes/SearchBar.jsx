import { IconButton, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export default function SearchBar({ value, onChange, placeholder = 'Search titles and text' }) {
  return (
    <TextField fullWidth size="small" value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} inputProps={{ 'aria-label': 'Search notes' }}
      InputProps={{
        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
        endAdornment: value ? (
          <InputAdornment position="end"><IconButton size="small" aria-label="Clear search" onClick={() => onChange('')}><ClearIcon fontSize="small" /></IconButton></InputAdornment>
        ) : null,
        sx: { bgcolor: 'background.paper', borderRadius: 3 },
      }} />
  );
}
