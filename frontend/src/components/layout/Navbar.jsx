import { useState } from 'react';
import { AppBar, Avatar, Box, Button, IconButton, InputBase, Menu, MenuItem, Toolbar, Tooltip, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useThemeMode } from '../../context/ThemeContext.jsx';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const [query, setQuery] = useState('');

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/notes?search=${encodeURIComponent(query.trim())}` : '/notes');
  };

  const handleLogout = async () => {
    setAnchor(null);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <AppBar position="fixed" color="inherit" elevation={0}
      sx={{ zIndex: (t) => t.zIndex.drawer + 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Toolbar sx={{ gap: 1 }}>
        <IconButton edge="start" onClick={onToggleSidebar} aria-label="Toggle sidebar"><MenuIcon /></IconButton>
        <Typography variant="h6" component={Link} to="/" sx={{ fontWeight: 800, color: 'primary.main', mr: 2 }}>NoteNest</Typography>

        <Box component="form" onSubmit={submitSearch} role="search"
          sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', flex: 1, maxWidth: 460, px: 1.5, borderRadius: 3, bgcolor: 'action.hover' }}>
          <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase placeholder="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} sx={{ flex: 1, py: 0.5 }} inputProps={{ 'aria-label': 'Search notes' }} />
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/notes/new" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>New note</Button>
        <IconButton color="primary" component={Link} to="/notes/new" aria-label="New note" sx={{ display: { sm: 'none' } }}><AddIcon /></IconButton>
        <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
          <IconButton onClick={toggleMode} aria-label="Toggle theme">{mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}</IconButton>
        </Tooltip>
        <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account menu">
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 15 }}>{user?.displayName?.[0]?.toUpperCase() ?? '?'}</Avatar>
        </IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <MenuItem disabled sx={{ opacity: '1 !important', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography fontWeight={600}>{user?.displayName}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          </MenuItem>
          <MenuItem onClick={() => { setAnchor(null); navigate('/settings'); }}>Settings</MenuItem>
          <MenuItem onClick={handleLogout}>Log out</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
