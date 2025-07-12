/**
 * Profile Management Page
 * Phase 7.4.3 - Main page for configuration profile and environment management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
  Fade,
  Backdrop,
  CircularProgress
} from '@mui/material';
import {
  Home as HomeIcon,
  Settings as SettingsIcon,
  AccountTree as ProfileIcon
} from '@mui/icons-material';

import type { ConfigurationProfile } from '../types/configurationProfiles';
import { ProfileManager } from '../components/configuration/ProfileManager';
import { ProfileEditor } from '../components/configuration/ProfileEditor';
import { ProfileComparison } from '../components/configuration/ProfileComparison';
import { profileManager } from '../utils/configurationProfiles';

type ViewMode = 'list' | 'edit' | 'compare';

export const ProfileManagementPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProfile, setSelectedProfile] = useState<ConfigurationProfile | null>(null);
  const [comparisonProfiles, setComparisonProfiles] = useState<ConfigurationProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize with some sample profiles for demonstration
  useEffect(() => {
    initializeSampleProfiles();
  }, []);

  const initializeSampleProfiles = () => {
    try {
      // Create some sample profiles if none exist
      const existingProfiles = profileManager.getAllProfiles();
      
      if (existingProfiles.length === 0) {
        // Development profile
        const devProfile = profileManager.createFromTemplate(
          'development',
          'Development Environment',
          'development'
        );
        
        // Production profile
        const prodProfile = profileManager.createFromTemplate(
          'production',
          'Production Environment',
          'production'
        );
        
        // Testing profile
        const testProfile = profileManager.createFromTemplate(
          'testing',
          'Testing Environment',
          'testing'
        );

        // Custom profile
        const customProfile = profileManager.createProfile(
          'Custom Local Setup',
          'Custom configuration for local development',
          'local',
          'custom'
        );

        // Activate the development profile by default
        profileManager.activateProfile(devProfile.id);
      }
    } catch (error) {
      console.error('Failed to initialize sample profiles:', error);
    }
  };

  const handleProfileSelected = (profile: ConfigurationProfile) => {
    setSelectedProfile(profile);
    setViewMode('edit');
  };

  const handleProfileEdit = (profile: ConfigurationProfile) => {
    setSelectedProfile(profile);
    setViewMode('edit');
  };

  const handleProfileCompare = (profiles: ConfigurationProfile[]) => {
    setComparisonProfiles(profiles);
    setViewMode('compare');
  };

  const handleProfileSaved = (profile: ConfigurationProfile) => {
    // Optionally refresh the profile list or show a success message
    console.log('Profile saved:', profile.name);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedProfile(null);
    setComparisonProfiles([]);
  };

  const renderBreadcrumbs = () => (
    <Breadcrumbs sx={{ mb: 3 }}>
      <Link
        underline="hover"
        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        color="inherit"
        onClick={handleBackToList}
      >
        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
        Home
      </Link>
      <Link
        underline="hover"
        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        color="inherit"
        onClick={handleBackToList}
      >
        <SettingsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
        Configuration
      </Link>
      <Typography
        sx={{ display: 'flex', alignItems: 'center' }}
        color="text.primary"
      >
        <ProfileIcon sx={{ mr: 0.5 }} fontSize="inherit" />
        {viewMode === 'list' && 'Profile Management'}
        {viewMode === 'edit' && `Edit: ${selectedProfile?.name}`}
        {viewMode === 'compare' && 'Profile Comparison'}
      </Typography>
    </Breadcrumbs>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'edit':
        return (
          <Fade in timeout={300}>
            <Box>
              <ProfileEditor
                profile={selectedProfile || undefined}
                onSave={handleProfileSaved}
                onClose={handleBackToList}
                onCompare={(profile) => {
                  setComparisonProfiles([profile]);
                  setViewMode('compare');
                }}
              />
            </Box>
          </Fade>
        );

      case 'compare':
        return (
          <Fade in timeout={300}>
            <Box>
              <ProfileComparison
                profiles={comparisonProfiles}
                onClose={handleBackToList}
                onMerge={(merged) => {
                  console.log('Merged profile:', merged);
                  // Handle merged profile
                }}
              />
            </Box>
          </Fade>
        );

      default:
        return (
          <Fade in timeout={300}>
            <Box>
              <ProfileManager
                onProfileSelected={handleProfileSelected}
                onProfileEdit={handleProfileEdit}
                onProfileCompare={handleProfileCompare}
              />
            </Box>
          </Fade>
        );
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth={false} sx={{ py: 3 }}>
        {/* Breadcrumbs - only show on list and compare views */}
        {viewMode !== 'edit' && renderBreadcrumbs()}

        {/* Page Title - only show on list view */}
        {viewMode === 'list' && (
          <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Typography variant="h3" color="white" gutterBottom>
              Configuration Profile Management
            </Typography>
            <Typography variant="h6" color="rgba(255, 255, 255, 0.8)">
              Manage environment-specific configurations, profile inheritance, and deployment settings
            </Typography>
          </Paper>
        )}

        {/* Main Content */}
        {renderContent()}

        {/* Loading Backdrop */}
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Container>
    </Box>
  );
};