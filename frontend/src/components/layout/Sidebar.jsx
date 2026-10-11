import { Box, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Toolbar, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import NotesIcon from '@mui/icons-material/StickyNote2Outlined';
import PushPinIcon from '@mui/icons-material/PushPinOutlined';
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import FolderIcon from '@mui/icons-material/FolderOpenOutlined';
import { useCategories } from '../../context/CategoriesContext.jsx';

export const DRAWER_WIDTH = 252;

const links = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon />, end: true },
  { to: '/notes', label: 'All notes', icon: <NotesIcon /> },
  { to: '/favorites', label: 'Pinned', icon: <PushPinIcon /> },
  { to: '/shared', label: 'Shared with me', icon: <PeopleIcon /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon /> },
];

function SidebarContent({ onNavigate }) {
  const { categories } = useCategories();
  const location = useLocation();
  const [params] = useSearchParams();
  const activeCategory = location.pathname === '/notes' ? params.get('categoryId') : null;

  return (
    <Box sx={{ overflowY: 'auto' }}>
      <Toolbar />
      <List sx={{ px: 1 }}>
        {links.map((l) => (
          <ListItemButton key={l.to} component={NavLink} to={l.to} end={l.end} onClick={onNavigate}
            sx={{ borderRadius: 2, mb: 0.5, '&.active': { bgcolor: 'primary.main', color: '#fff', '& .MuiListItemIcon-root': { color: '#fff' } } }}>
            <ListItemIcon sx={{ minWidth: 38 }}>{l.icon}</ListItemIcon>
            <ListItemText primary={l.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ my: 1 }} />
      <List sx={{ px: 1 }} subheader={<ListSubheader sx={{ bgcolor: 'transparent' }}>Categories</ListSubheader>}>
        {categories.length === 0 && <ListItemText sx={{ px: 2, color: 'text.secondary' }} secondary="No categories yet. Add them in Settings." />}
        {categories.map((c) => (
          <ListItemButton key={c.id} component={NavLink} to={`/notes?categoryId=${c.id}`} onClick={onNavigate}
            selected={String(c.id) === activeCategory} sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: 38 }}><FolderIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary={c.name} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

export default function Sidebar({ open, onClose }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  if (!isDesktop) {
    return (
      <Drawer variant="temporary" open={open} onClose={onClose} ModalProps={{ keepMounted: true }} PaperProps={{ sx: { width: DRAWER_WIDTH } }}>
        <SidebarContent onNavigate={onClose} />
      </Drawer>
    );
  }
  return (
    <Drawer variant="persistent" open={open}
      sx={{ width: open ? DRAWER_WIDTH : 0, flexShrink: 0, transition: 'width .2s', '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: '1px solid', borderColor: 'divider' } }}>
      <SidebarContent />
    </Drawer>
  );
}
