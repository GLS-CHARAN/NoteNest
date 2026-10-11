import { Button, FormControl, InputLabel, MenuItem, Select, Stack, ToggleButton } from '@mui/material';
import ImageIcon from '@mui/icons-material/ImageOutlined';
import VideocamIcon from '@mui/icons-material/VideocamOutlined';
import PushPinIcon from '@mui/icons-material/PushPinOutlined';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import CategorySelector from './CategorySelector.jsx';

export default function FilterBar({ filters, tags, onChange, onClear, hasActiveFilters }) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} sx={{ my: 2 }} flexWrap="wrap" useFlexGap>
      <div style={{ minWidth: 180 }}>
        <CategorySelector size="small" noneLabel="All categories" value={filters.categoryId ? Number(filters.categoryId) : null}
          onChange={(id) => onChange({ categoryId: id ?? '' })} />
      </div>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="tag-label" shrink>Tag</InputLabel>
        <Select labelId="tag-label" label="Tag" notched displayEmpty value={filters.tag} onChange={(e) => onChange({ tag: e.target.value })}>
          <MenuItem value="">All tags</MenuItem>
          {tags.map((t) => <MenuItem key={t.id} value={t.name}>#{t.name}</MenuItem>)}
        </Select>
      </FormControl>

      <ToggleButton size="small" value="images" selected={filters.hasImages} onChange={() => onChange({ hasImages: !filters.hasImages })}><ImageIcon fontSize="small" sx={{ mr: 0.5 }} />Images</ToggleButton>
      <ToggleButton size="small" value="videos" selected={filters.hasVideos} onChange={() => onChange({ hasVideos: !filters.hasVideos })}><VideocamIcon fontSize="small" sx={{ mr: 0.5 }} />Videos</ToggleButton>
      <ToggleButton size="small" value="pinned" selected={filters.pinned} onChange={() => onChange({ pinned: !filters.pinned })}><PushPinIcon fontSize="small" sx={{ mr: 0.5 }} />Pinned</ToggleButton>

      <FormControl size="small" sx={{ minWidth: 190 }}>
        <InputLabel id="sort-label">Sort by</InputLabel>
        <Select labelId="sort-label" label="Sort by" value={`${filters.sort}:${filters.dir}`}
          onChange={(e) => { const [sort, dir] = e.target.value.split(':'); onChange({ sort, dir }); }}>
          <MenuItem value="updated:desc">Recently updated</MenuItem>
          <MenuItem value="updated:asc">Least recently updated</MenuItem>
          <MenuItem value="created:desc">Newest created</MenuItem>
          <MenuItem value="created:asc">Oldest created</MenuItem>
          <MenuItem value="title:asc">Title A–Z</MenuItem>
          <MenuItem value="title:desc">Title Z–A</MenuItem>
        </Select>
      </FormControl>

      {hasActiveFilters && <Button startIcon={<FilterAltOffIcon />} onClick={onClear}>Clear filters</Button>}
    </Stack>
  );
}
