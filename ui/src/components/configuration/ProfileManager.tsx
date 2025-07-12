/**
 * Configuration Profile Manager
 * Phase 7.4.3 - Main interface for configuration profile and environment management
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Tooltip,
  Badge,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  PlayArrow as ActivateIcon,
  ContentCopy as DuplicateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Compare as CompareIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Visibility as ViewIcon,
  Settings as ConfigIcon,
  AccountTree as InheritanceIcon,
  CheckCircle as ValidIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Circle as UnknownIcon
} from '@mui/icons-material';

import type {
  ConfigurationProfile,
  EnvironmentType,
  ProfileCategory,
  ProfileFilters,
  ProfileSortOption
} from '../../types/configurationProfiles';
import { profileManager, profileSearchEngine, profileStatsCalculator } from '../../utils/configurationProfiles';

interface ProfileManagerProps {
  onProfileSelected?: (profile: ConfigurationProfile) => void;
  onProfileEdit?: (profile: ConfigurationProfile) => void;
  onProfileCompare?: (profiles: ConfigurationProfile[]) => void;
}

const ENVIRONMENT_COLORS: Record<EnvironmentType, string> = {
  development: 'primary',
  staging: 'warning',
  testing: 'info',
  production: 'error',
  local: 'secondary',
  demo: 'success',
  custom: 'default'
};

const VALIDATION_ICONS = {
  valid: ValidIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  unknown: UnknownIcon
};

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  onProfileSelected,
  onProfileEdit,
  onProfileCompare
}) => {
  // State management
  const [profiles, setProfiles] = useState<ConfigurationProfile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProfileFilters>({
    environments: [],
    categories: [],
    tags: [],
    validationStatus: [],
    showInherited: true,
    showReadOnly: true
  });
  const [sortBy, setSortBy] = useState<ProfileSortOption>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProfileForMenu, setSelectedProfileForMenu] = useState<string | null>(null);

  // Create profile dialog state
  const [newProfile, setNewProfile] = useState({
    name: '',
    description: '',
    environment: 'development' as EnvironmentType,
    category: 'custom' as ProfileCategory,
    template: ''
  });

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      const allProfiles = profileManager.getAllProfiles();
      setProfiles(allProfiles);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted profiles
  const filteredProfiles = useMemo(() => {
    const searchResults = profileSearchEngine.searchProfiles(profiles, searchQuery, filters);
    
    return searchResults
      .map(result => result.profile)
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'environment':
            comparison = a.environment.localeCompare(b.environment);
            break;
          case 'category':
            comparison = a.category.localeCompare(b.category);
            break;
          case 'created':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'updated':
            comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            break;
          case 'validation':
            const statusOrder = { valid: 0, warning: 1, unknown: 2, error: 3 };
            comparison = statusOrder[a.metadata.validationStatus] - statusOrder[b.metadata.validationStatus];
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [profiles, searchQuery, filters, sortBy, sortOrder]);

  // Profile statistics
  const stats = useMemo(() => {
    return profileStatsCalculator.calculateStats(profiles);
  }, [profiles]);

  // Handlers
  const handleCreateProfile = async () => {
    try {
      const profile = newProfile.template
        ? profileManager.createFromTemplate(newProfile.template, newProfile.name, newProfile.environment)
        : profileManager.createProfile(newProfile.name, newProfile.description, newProfile.environment, newProfile.category);
      
      setProfiles(prev => [...prev, profile]);
      setCreateDialogOpen(false);
      setNewProfile({ name: '', description: '', environment: 'development', category: 'custom', template: '' });
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };

  const handleActivateProfile = (profileId: string) => {
    try {
      profileManager.activateProfile(profileId);
      setProfiles(prev => prev.map(p => ({
        ...p,
        isActive: p.id === profileId
      })));
    } catch (error) {
      console.error('Failed to activate profile:', error);
    }
  };

  const handleDuplicateProfile = (profileId: string) => {
    try {
      const original = profiles.find(p => p.id === profileId);
      if (original) {
        const duplicated = profileManager.duplicateProfile(profileId, `${original.name} (Copy)`);
        setProfiles(prev => [...prev, duplicated]);
      }
    } catch (error) {
      console.error('Failed to duplicate profile:', error);
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    try {
      profileManager.deleteProfile(profileId);
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      setSelectedProfiles(prev => prev.filter(id => id !== profileId));
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  const handleProfileSelect = (profileId: string, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      setSelectedProfiles(prev => 
        prev.includes(profileId) 
          ? prev.filter(id => id !== profileId)
          : [...prev, profileId]
      );
    } else {
      const profile = profiles.find(p => p.id === profileId);
      if (profile && onProfileSelected) {
        onProfileSelected(profile);
      }
    }
  };

  const handleCompareSelected = () => {
    const selectedProfileObjects = profiles.filter(p => selectedProfiles.includes(p.id));
    if (selectedProfileObjects.length >= 2 && onProfileCompare) {
      onProfileCompare(selectedProfileObjects);
    }
  };

  const renderValidationStatus = (status: string) => {
    const Icon = VALIDATION_ICONS[status as keyof typeof VALIDATION_ICONS] || UnknownIcon;
    const colors = { valid: 'success', warning: 'warning', error: 'error', unknown: 'default' };
    
    return (
      <Tooltip title={`Validation: ${status}`}>
        <Icon color={colors[status as keyof typeof colors] as any} fontSize="small" />
      </Tooltip>
    );
  };

  const renderProfileCard = (profile: ConfigurationProfile) => (
    <Card 
      key={profile.id}
      sx={{ 
        cursor: 'pointer',
        border: selectedProfiles.includes(profile.id) ? 2 : 1,
        borderColor: selectedProfiles.includes(profile.id) ? 'primary.main' : 'divider',
        '&:hover': { boxShadow: 2 }
      }}
      onClick={(e) => {
        e.stopPropagation();
        handleProfileSelect(profile.id, e.ctrlKey || e.metaKey);
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: `${ENVIRONMENT_COLORS[profile.environment]}.main` }}>
              {profile.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {profile.name}
                {profile.isActive && (
                  <Chip label="Active" color="success" size="small" sx={{ ml: 1 }} />
                )}
                {profile.isReadOnly && (
                  <Chip label="Read-only" size="small" sx={{ ml: 1 }} />
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {profile.description}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {renderValidationStatus(profile.metadata.validationStatus)}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProfileForMenu(profile.id);
                setProfileMenuAnchor(e.currentTarget);
              }}
            >
              <MoreIcon />
            </IconButton>
          </Box>
        </Box>

        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          <Chip 
            label={profile.environment} 
            color={ENVIRONMENT_COLORS[profile.environment] as any}
            size="small" 
          />
          <Chip label={profile.category} variant="outlined" size="small" />
          {profile.inheritanceChain && profile.inheritanceChain.length > 0 && (
            <Chip 
              icon={<InheritanceIcon />} 
              label={`Inherits (${profile.inheritanceChain.length})`} 
              variant="outlined" 
              size="small" 
            />
          )}
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap">
          {profile.tags.slice(0, 3).map(tag => (
            <Chip key={tag} label={tag} variant="outlined" size="small" />
          ))}
          {profile.tags.length > 3 && (
            <Chip label={`+${profile.tags.length - 3} more`} variant="outlined" size="small" />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Typography variant="caption" color="text.secondary">
          Updated {new Date(profile.updatedAt).toLocaleDateString()}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" color="text.secondary">
          v{profile.version}
        </Typography>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Configuration Profiles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage environment-specific configurations and profile inheritance
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Profile
          </Button>
          {selectedProfiles.length >= 2 && (
            <Button
              variant="outlined"
              startIcon={<CompareIcon />}
              onClick={handleCompareSelected}
            >
              Compare ({selectedProfiles.length})
            </Button>
          )}
        </Stack>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">{stats.totalProfiles}</Typography>
            <Typography variant="body2" color="text.secondary">Total Profiles</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {Object.keys(stats.byEnvironment).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">Environments</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {stats.inheritanceDepth.withInheritance}
            </Typography>
            <Typography variant="body2" color="text.secondary">With Inheritance</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {stats.byValidationStatus.valid || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">Valid Profiles</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ProfileSortOption)}
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="environment">Environment</MenuItem>
                  <MenuItem value="category">Category</MenuItem>
                  <MenuItem value="created">Created</MenuItem>
                  <MenuItem value="updated">Updated</MenuItem>
                  <MenuItem value="validation">Validation</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
              >
                Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Profiles Grid */}
      <Grid container spacing={2}>
        {filteredProfiles.map(profile => (
          <Grid item xs={12} sm={6} md={4} key={profile.id}>
            {renderProfileCard(profile)}
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {!loading && filteredProfiles.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ConfigIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No profiles found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {profiles.length === 0 
              ? "Create your first configuration profile to get started"
              : "Try adjusting your search or filter criteria"
            }
          </Typography>
          {profiles.length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Profile
            </Button>
          )}
        </Paper>
      )}

      {/* Create Profile Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Profile Name"
                value={newProfile.name}
                onChange={(e) => setNewProfile(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newProfile.description}
                onChange={(e) => setNewProfile(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={newProfile.environment}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, environment: e.target.value as EnvironmentType }))}
                >
                  <MenuItem value="development">Development</MenuItem>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="testing">Testing</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                  <MenuItem value="local">Local</MenuItem>
                  <MenuItem value="demo">Demo</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newProfile.category}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, category: e.target.value as ProfileCategory }))}
                >
                  <MenuItem value="base">Base</MenuItem>
                  <MenuItem value="feature">Feature</MenuItem>
                  <MenuItem value="environment">Environment</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                  <MenuItem value="template">Template</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Template (Optional)</InputLabel>
                <Select
                  value={newProfile.template}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, template: e.target.value }))}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="development">Development Template</MenuItem>
                  <MenuItem value="production">Production Template</MenuItem>
                  <MenuItem value="testing">Testing Template</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateProfile}
            variant="contained"
            disabled={!newProfile.name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Context Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={() => {
          setProfileMenuAnchor(null);
          setSelectedProfileForMenu(null);
        }}
      >
        {selectedProfileForMenu && (() => {
          const profile = profiles.find(p => p.id === selectedProfileForMenu);
          if (!profile) return null;

          return [
            <MenuItem key="view" onClick={() => handleProfileSelect(profile.id)}>
              <ListItemIcon><ViewIcon /></ListItemIcon>
              <ListItemText>View Details</ListItemText>
            </MenuItem>,
            <MenuItem key="edit" onClick={() => onProfileEdit?.(profile)} disabled={profile.isReadOnly}>
              <ListItemIcon><EditIcon /></ListItemIcon>
              <ListItemText>Edit Configuration</ListItemText>
            </MenuItem>,
            <MenuItem key="activate" onClick={() => handleActivateProfile(profile.id)} disabled={profile.isActive}>
              <ListItemIcon><ActivateIcon /></ListItemIcon>
              <ListItemText>Activate</ListItemText>
            </MenuItem>,
            <Divider key="divider1" />,
            <MenuItem key="duplicate" onClick={() => handleDuplicateProfile(profile.id)}>
              <ListItemIcon><DuplicateIcon /></ListItemIcon>
              <ListItemText>Duplicate</ListItemText>
            </MenuItem>,
            <MenuItem key="export">
              <ListItemIcon><ExportIcon /></ListItemIcon>
              <ListItemText>Export</ListItemText>
            </MenuItem>,
            <Divider key="divider2" />,
            <MenuItem 
              key="delete" 
              onClick={() => handleDeleteProfile(profile.id)}
              disabled={profile.isReadOnly || profile.isActive}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          ];
        })()}
      </Menu>
    </Box>
  );
};