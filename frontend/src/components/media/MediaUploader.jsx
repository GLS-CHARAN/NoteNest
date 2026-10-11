import { useRef } from 'react';
import { Button } from '@mui/material';

// Hidden <input type="file"> opened by a visible button. useRef gives us access to the input element.
export default function MediaUploader({ accept, label, icon, onFiles, disabled }) {
  const inputRef = useRef(null);
  const handleChange = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = '';   // allow choosing the same file again
  };
  return (
    <>
      <input ref={inputRef} type="file" multiple hidden accept={accept} onChange={handleChange} data-testid="file-input" />
      <Button variant="outlined" startIcon={icon} disabled={disabled} onClick={() => inputRef.current?.click()}>{label}</Button>
    </>
  );
}
