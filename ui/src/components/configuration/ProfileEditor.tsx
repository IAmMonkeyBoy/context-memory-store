/**
 * Configuration Profile Editor
 * Phase 7.4.3 - Enhanced configuration editor with profile management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Visibility as PreviewIcon,
  Compare as CompareIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Refresh as ResetIcon,
  AccountTree as InheritanceIcon,
  CheckCircle as ValidateIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import type {
  ConfigurationProfile,
  EnvironmentType,
  ProfileCategory
} from '../../types/configurationProfiles';
import type { SystemConfiguration } from '../../types/configuration';
import { ConfigurationEditor } from './ConfigurationEditor';
import { profileManager } from '../../utils/configurationProfiles';

interface ProfileEditorProps {
  profile?: ConfigurationProfile;
  onSave?: (profile: ConfigurationProfile) => void;
  onClose?: () => void;
  onCompare?: (profile: ConfigurationProfile) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profile: initialProfile,
  onSave,
  onClose,
  onCompare
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState<ConfigurationProfile | null>(initialProfile || null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Create new profile if none provided
  useEffect(() => {
    if (!initialProfile) {
      const newProfile = profileManager.createProfile(
        'New Profile',
        'A new configuration profile',
        'development'
      );
      setProfile(newProfile);
    }
  }, [initialProfile]);

  const handleConfigurationChange = (config: SystemConfiguration) => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      configuration: config,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...profile.metadata,
        validationStatus: 'unknown' as const,
        checksum: '' // Will be calculated when saved
      }
    };

    setProfile(updatedProfile);
    setUnsavedChanges(true);
  };

  const handleMetadataChange = (field: keyof ConfigurationProfile, value: any) => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      [field]: value,
      updatedAt: new Date().toISOString()
    };

    setProfile(updatedProfile);
    setUnsavedChanges(true);
  };

  const handleSaveClick = () => {
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!profile) return;

    try {
      // Update the profile in the manager
      const savedProfile = profileManager.updateProfile(profile.id, profile);
      setProfile(savedProfile);
      setUnsavedChanges(false);
      
      if (onSave) {
        onSave(savedProfile);
      }
      
      setSaveDialogOpen(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleCancelSave = () => {
    setSaveDialogOpen(false);
  };

  const handleValidate = async () => {
    if (!profile) return;

    // TODO: Implement validation
    console.log('Validating profile:', profile.id);
    setValidationErrors([]);
  };

  const handleReset = () => {
    if (initialProfile) {
      setProfile(initialProfile);
      setUnsavedChanges(false);
    }
  };

  const renderMetadataTab = () => {
    if (!profile) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Profile Name"
                  value={profile.name}
                  onChange={(e) => handleMetadataChange('name', e.target.value)}
                  disabled={profile.isReadOnly}
                />
                
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={profile.description}
                  onChange={(e) => handleMetadataChange('description', e.target.value)}
                  disabled={profile.isReadOnly}
                />
                
                <FormControl fullWidth disabled={profile.isReadOnly}>
                  <InputLabel>Environment</InputLabel>
                  <Select
                    value={profile.environment}
                    onChange={(e) => handleMetadataChange('environment', e.target.value)}
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
                
                <FormControl fullWidth disabled={profile.isReadOnly}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={profile.category}
                    onChange={(e) => handleMetadataChange('category', e.target.value)}
                  >
                    <MenuItem value="base">Base</MenuItem>
                    <MenuItem value="feature">Feature</MenuItem>
                    <MenuItem value="environment">Environment</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                    <MenuItem value="template">Template</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Version"
                  value={profile.version}
                  onChange={(e) => handleMetadataChange('version', e.target.value)}
                  disabled={profile.isReadOnly}
                />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {profile.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={profile.isReadOnly ? undefined : () => {
                          const newTags = profile.tags.filter((_, i) => i !== index);
                          handleMetadataChange('tags', newTags);
                        }}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Status
              </Typography>
              
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.isDefault}
                      onChange={(e) => handleMetadataChange('isDefault', e.target.checked)}
                      disabled={profile.isReadOnly}
                    />
                  }
                  label="Default Profile"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.isActive}
                      onChange={(e) => {
                        if (e.target.checked) {
                          profileManager.activateProfile(profile.id);
                        }
                        handleMetadataChange('isActive', e.target.checked);
                      }}
                      disabled={profile.isReadOnly}
                    />
                  }
                  label="Active Profile"
                />
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Validation Status
                  </Typography>
                  <Chip
                    label={profile.metadata.validationStatus}
                    color={
                      profile.metadata.validationStatus === 'valid' ? 'success' :
                      profile.metadata.validationStatus === 'warning' ? 'warning' :
                      profile.metadata.validationStatus === 'error' ? 'error' : 'default'
                    }
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {new Date(profile.createdAt).toLocaleString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {new Date(profile.updatedAt).toLocaleString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Checksum
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                    {profile.metadata.checksum}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {profile.metadata.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Profile Warnings:
              </Typography>
              {profile.metadata.warnings.map((warning, index) => (
                <Typography key={index} variant="body2">
                  • {warning}
                </Typography>
              ))}
            </Alert>
          )}
        </Grid>
      </Grid>
    );
  };

  const renderInheritanceTab = () => {
    if (!profile) return null;

    return (
      <Box>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Inheritance Chain
            </Typography>
            
            {profile.inheritanceChain && profile.inheritanceChain.length > 0 ? (
              <Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  This profile inherits configuration from the following parent profiles:
                </Typography>
                {profile.inheritanceChain.map((parentId, index) => (
                  <Box key={parentId} display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="body2">{index + 1}.</Typography>
                    <Chip label={parentId} size="small" />
                    {index < profile.inheritanceChain!.length - 1 && (
                      <Typography variant="body2" color="text.secondary">→</Typography>
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                This profile does not inherit from any parent profiles.
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Dependencies
            </Typography>
            
            {profile.metadata.dependencies.length > 0 ? (
              <Stack spacing={1}>
                {profile.metadata.dependencies.map((dep, index) => (
                  <Chip key={index} label={dep} size="small" variant="outlined" />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No dependencies found.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderValidationTab = () => (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">
              Validation Results
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ValidateIcon />}
              onClick={handleValidate}
            >
              Run Validation
            </Button>
          </Box>

          {validationErrors.length > 0 ? (
            <Alert severity="error">
              <Typography variant="subtitle2" gutterBottom>
                Validation Errors Found:
              </Typography>
              {validationErrors.map((error, index) => (
                <Typography key={index} variant="body2">
                  • {error.message} ({error.path})
                </Typography>
              ))}
            </Alert>
          ) : (
            <Alert severity="success">
              No validation errors found.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  if (!profile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box display="flex" alignItems="center" justifyContent="between">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h5">
              {profile.name}
            </Typography>
            <Chip 
              label={profile.environment} 
              color="primary" 
              size="small" 
            />
            {profile.isActive && (
              <Chip label="Active" color="success" size="small" />
            )}
            {profile.isReadOnly && (
              <Chip label="Read-only" size="small" />
            )}
            {unsavedChanges && (
              <Chip label="Unsaved changes" color="warning" size="small" />
            )}
          </Box>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Preview Mode">
              <IconButton
                onClick={() => setPreviewMode(!previewMode)}
                color={previewMode ? 'primary' : 'default'}
              >
                <PreviewIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Compare with other profiles">
              <IconButton onClick={() => onCompare?.(profile)}>
                <CompareIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Export profile">
              <IconButton>
                <ExportIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Reset changes">
              <IconButton onClick={handleReset} disabled={!unsavedChanges}>
                <ResetIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveClick}
              disabled={!unsavedChanges || profile.isReadOnly}
            >
              Save
            </Button>

            {onClose && (
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            )}
          </Stack>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Configuration" />
          <Tab label="Metadata" />
          <Tab label="Inheritance" icon={<InheritanceIcon />} />
          <Tab label="Validation" />
          <Tab label="Export" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={activeTab} index={0}>
          <ConfigurationEditor
            configuration={profile.configuration}
            onChange={handleConfigurationChange}
            readOnly={profile.isReadOnly || previewMode}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {renderMetadataTab()}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {renderInheritanceTab()}
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {renderValidationTab()}
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Profile
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Export this profile configuration for backup or sharing.
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" startIcon={<ExportIcon />}>
                  Export as JSON
                </Button>
                <Button variant="outlined" startIcon={<ExportIcon />}>
                  Export as YAML
                </Button>
                <Button variant="outlined" startIcon={<ExportIcon />}>
                  Export as Package
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>
      </Box>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Profile Changes</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to save the changes to this profile?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSave}>Cancel</Button>
          <Button onClick={handleConfirmSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};