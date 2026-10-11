import { useState } from 'react';
import { Box, Toolbar, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import { CategoriesProvider } from '../../context/CategoriesContext.jsx';

export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Desktop: collapsible side panel (starts open). Phone: temporary drawer (starts closed).
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = () => (isDesktop ? setSidebarOpen((v) => !v) : setMobileOpen((v) => !v));

  return (
    <CategoriesProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Navbar onToggleSidebar={toggle} />
        <Sidebar open={isDesktop ? sidebarOpen : mobileOpen} onClose={() => setMobileOpen(false)} />
        <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 4 } }}>
          <Toolbar />
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}><Outlet /></Box>
        </Box>
      </Box>
    </CategoriesProvider>
  );
}
