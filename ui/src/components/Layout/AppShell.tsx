import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  useTheme,
  Chip,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ExpandLess,
  ExpandMore,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import Icon from '@mui/material/Icon';
import { useNavigate, useLocation } from 'react-router-dom';
import { useResponsive, useDetailedHealth } from '@hooks';
import { config } from '@utils';
import { navigationItems } from '../Navigation/NavigationItems';

const DRAWER_WIDTH = 280;

interface AppShellProps {
  children?: React.ReactNode;
  className?: string;
  onThemeToggle: () => void;
  themeMode: 'light' | 'dark';
}

export const AppShell: React.FC<AppShellProps> = ({ 
  children, 
  className,
  onThemeToggle,
  themeMode 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['dashboard']);
  
  // Get system health for status indicator
  const { data: healthData } = useDetailedHealth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleItemClick = (item: any) => {
    if (item.children) {
      // Toggle expansion for parent items
      setExpandedItems(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else {
      // Navigate to page
      navigate(item.path);
      if (isMobile) {
        setMobileOpen(false);
      }
    }
  };

  const isItemActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getSystemStatus = () => {
    if (!healthData) return { status: 'unknown', color: 'default' as const };
    
    const status = healthData.status?.toLowerCase();
    if (status === 'healthy') return { status: 'healthy', color: 'success' as const };
    if (status === 'degraded') return { status: 'degraded', color: 'warning' as const };
    return { status: 'unhealthy', color: 'error' as const };
  };

  const systemStatus = getSystemStatus();

  const renderNavigationItem = (item: any, depth = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const isActive = isItemActive(item.path);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <React.Fragment key={item.id}>
        <ListItem 
          disablePadding 
          sx={{ 
            pl: depth * 2,
            borderLeft: isActive && depth === 0 ? `3px solid ${theme.palette.primary.main}` : 'none'
          }}
        >
          <ListItemButton
            onClick={() => handleItemClick(item)}
            selected={isActive && !hasChildren}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main + '20',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '30',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icon 
                color={isActive ? 'primary' : 'inherit'}
                fontSize="small"
              >
                {item.icon}
              </Icon>
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? theme.palette.primary.main : 'inherit'
              }}
            />
            {hasChildren && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
        
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child: any) => renderNavigationItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          {config.app.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          v{config.app.version}
        </Typography>
      </Box>
      
      {/* Navigation Items */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ pt: 1 }}>
          {navigationItems.map(item => renderNavigationItem(item))}
        </List>
      </Box>
      
      {/* Footer */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            System Status:
          </Typography>
          <Chip
            label={systemStatus.status}
            color={systemStatus.color}
            size="small"
            variant="outlined"
          />
        </Box>
        <Typography variant="caption" color="text.secondary" display="block">
          Environment: {config.environment}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {/* Dynamic page title based on current route */}
            {navigationItems
              .flatMap(item => [item, ...(item.children || [])])
              .find(item => isItemActive(item.path))?.label || 'Dashboard'}
          </Typography>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={0} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* Theme toggle */}
            <Tooltip title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton color="inherit" onClick={onThemeToggle}>
                {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
            
            {/* User menu (placeholder for future auth) */}
            <Tooltip title="User menu">
              <IconButton color="inherit">
                <AccountCircleIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH 
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              position: 'relative',
              height: '100vh'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Toolbar /> {/* Spacer for fixed app bar */}
        <Box 
          sx={{ 
            p: 3,
            className 
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppShell;