import { useEffect, useState } from 'react';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { getTags } from '../../services/noteService.js';

// Type a tag and press Enter. Existing tags are suggested.
export default function TagInput({ value, onChange, disabled = false }) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getTags().then((tags) => !cancelled && setOptions(tags.map((t) => t.name))).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <Autocomplete multiple freeSolo disabled={disabled} options={options} value={value}
      onChange={(_, newValue) => onChange([...new Set(newValue.map((v) => v.trim().toLowerCase()).filter(Boolean))].slice(0, 10))}
      renderTags={(tags, getTagProps) => tags.map((tag, i) => <Chip size="small" label={`#${tag}`} {...getTagProps({ index: i })} key={tag} />)}
      renderInput={(params) => <TextField {...params} label="Tags" placeholder="Add a tag and press Enter" InputLabelProps={{ shrink: true }} />} />
  );
}
