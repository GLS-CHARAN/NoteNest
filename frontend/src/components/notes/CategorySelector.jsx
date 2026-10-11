import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useCategories } from '../../context/CategoriesContext.jsx';

export default function CategorySelector({ value, onChange, disabled = false, noneLabel = 'No category', size = 'medium', label = 'Category' }) {
  const { categories } = useCategories();
  return (
    <FormControl fullWidth size={size} disabled={disabled}>
      <InputLabel id="category-label" shrink>{label}</InputLabel>
      <Select labelId="category-label" label={label} value={value ?? ''} displayEmpty notched
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}>
        <MenuItem value="">{noneLabel}</MenuItem>
        {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
      </Select>
    </FormControl>
  );
}
