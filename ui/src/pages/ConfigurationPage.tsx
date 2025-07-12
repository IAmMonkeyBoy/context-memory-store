/**
 * Configuration Page
 * Phase 7.4.2 - Main page for system configuration management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

import { ConfigurationEditor } from '../components/configuration/ConfigurationEditor';
import type { SystemConfiguration } from '../types/configuration';
import { createDefaultConfiguration } from '../utils/configurationValidation';

export const ConfigurationPage: React.FC = () => {
  const [configuration, setConfiguration] = useState<SystemConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load configuration on mount
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        setLoading(true);
        
        // Try to load from localStorage first
        const savedConfig = localStorage.getItem('systemConfiguration');
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          setConfiguration(parsed);
        } else {
          // Use default configuration
          const defaultConfig = createDefaultConfiguration();
          setConfiguration(defaultConfig);
        }
      } catch (err) {
        console.error('Failed to load configuration:', err);
        setError('Failed to load configuration: ' + String(err));
        
        // Fallback to default configuration
        const defaultConfig = createDefaultConfiguration();
        setConfiguration(defaultConfig);
      } finally {
        setLoading(false);
      }
    };

    loadConfiguration();
  }, []);

  // Handle configuration changes
  const handleConfigurationChange = (newConfig: SystemConfiguration) => {
    setConfiguration(newConfig);
    // Auto-save to localStorage
    try {
      localStorage.setItem('systemConfiguration', JSON.stringify(newConfig));
    } catch (err) {
      console.error('Failed to save configuration to localStorage:', err);
    }
  };

  // Handle manual save (for API integration later)
  const handleSave = async (config: SystemConfiguration) => {
    try {
      // For now, just save to localStorage
      localStorage.setItem('systemConfiguration', JSON.stringify(config));
      
      // TODO: Replace with actual API call
      // await api.saveConfiguration(config);
      
      console.log('Configuration saved successfully');
    } catch (err) {
      console.error('Failed to save configuration:', err);
      throw new Error('Failed to save configuration: ' + String(err));
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress />
          <Typography>Loading configuration...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        {configuration && (
          <ConfigurationEditor
            initialConfig={configuration}
            onConfigurationChange={handleConfigurationChange}
            onSave={handleSave}
          />
        )}
      </Container>
    );
  }

  if (!configuration) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          No configuration available. Please refresh the page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Page Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <SettingsIcon fontSize="large" color="primary" />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              System Configuration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure all aspects of the Context Memory Store system including API settings, 
              external services, features, security, monitoring, and performance parameters.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Configuration Editor */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <ConfigurationEditor
          initialConfig={configuration}
          onConfigurationChange={handleConfigurationChange}
          onSave={handleSave}
        />
      </Box>
    </Container>
  );
};

export default ConfigurationPage;