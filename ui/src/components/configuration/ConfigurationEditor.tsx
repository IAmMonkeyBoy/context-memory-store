/**
 * Configuration Editor Component
 * Phase 7.4.2 - Comprehensive configuration management interface
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Restore as ResetIcon,
  CheckCircle as ValidIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import type { SystemConfiguration, ValidationResult } from '../../types/configuration';
import { 
  createDefaultConfiguration,
  configurationValidator 
} from '../../utils/configurationValidation';
import {
  configurationSerializer,
  configurationTemplateManager
} from '../../utils/configurationUtils';

// Section Components
import { ApiConfigurationSection } from './sections/ApiConfigurationSection';
import { ServicesConfigurationSection } from './sections/ServicesConfigurationSection';
import { FeaturesConfigurationSection } from './sections/FeaturesConfigurationSection';
import { SecurityConfigurationSection } from './sections/SecurityConfigurationSection';
import { MonitoringConfigurationSection } from './sections/MonitoringConfigurationSection';
import { PerformanceConfigurationSection } from './sections/PerformanceConfigurationSection';

interface ConfigurationEditorProps {
  initialConfig?: Partial<SystemConfiguration>;
  onConfigurationChange?: (config: SystemConfiguration) => void;
  onSave?: (config: SystemConfiguration) => Promise<void>;
  readOnly?: boolean;
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
      id={`configuration-tabpanel-${index}`}
      aria-labelledby={`configuration-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const ConfigurationEditor: React.FC<ConfigurationEditorProps> = ({
  initialConfig,
  onConfigurationChange,
  onSave,
  readOnly = false
}) => {
  // State Management
  const [configuration, setConfiguration] = useState<SystemConfiguration>(
    () => {
      if (initialConfig) {
        // Merge with default configuration to ensure all fields are present
        const defaultConfig = createDefaultConfiguration();
        return { ...defaultConfig, ...initialConfig } as SystemConfiguration;
      }
      return createDefaultConfiguration();
    }
  );
  
  const [activeTab, setActiveTab] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning'>('success');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Configuration sections
  const sections = [
    { label: 'API', icon: '🌐' },
    { label: 'Services', icon: '⚙️' },
    { label: 'Features', icon: '✨' },
    { label: 'Security', icon: '🔒' },
    { label: 'Monitoring', icon: '📊' },
    { label: 'Performance', icon: '⚡' }
  ];

  // Validation Effect
  useEffect(() => {
    const validateConfiguration = async () => {
      setIsValidating(true);
      try {
        const result = await configurationValidator.validate(configuration);
        setValidationResult(result);
      } catch (error) {
        console.error('Validation error:', error);
        setValidationResult({
          isValid: false,
          errors: [{ 
            path: 'root', 
            code: 'VALIDATION_EXCEPTION', 
            message: 'Validation failed: ' + String(error),
            severity: 'error'
          }],
          warnings: [],
          suggestions: [],
          metadata: {
            timestamp: new Date().toISOString(),
            durationMs: 0,
            schemaVersion: '1.0.0',
            validatorVersion: '1.0.0'
          }
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateConfiguration();
  }, [configuration]);

  // Configuration Change Handler
  const handleConfigurationChange = useCallback((newConfig: SystemConfiguration) => {
    setConfiguration(newConfig);
    setHasUnsavedChanges(true);
    onConfigurationChange?.(newConfig);
  }, [onConfigurationChange]);

  // Section Update Handlers
  const handleApiChange = useCallback((apiConfig: SystemConfiguration['api']) => {
    handleConfigurationChange({ ...configuration, api: apiConfig });
  }, [configuration, handleConfigurationChange]);

  const handleServicesChange = useCallback((servicesConfig: SystemConfiguration['services']) => {
    handleConfigurationChange({ ...configuration, services: servicesConfig });
  }, [configuration, handleConfigurationChange]);

  const handleFeaturesChange = useCallback((featuresConfig: SystemConfiguration['features']) => {
    handleConfigurationChange({ ...configuration, features: featuresConfig });
  }, [configuration, handleConfigurationChange]);

  const handleSecurityChange = useCallback((securityConfig: SystemConfiguration['security']) => {
    handleConfigurationChange({ ...configuration, security: securityConfig });
  }, [configuration, handleConfigurationChange]);

  const handleMonitoringChange = useCallback((monitoringConfig: SystemConfiguration['monitoring']) => {
    handleConfigurationChange({ ...configuration, monitoring: monitoringConfig });
  }, [configuration, handleConfigurationChange]);

  const handlePerformanceChange = useCallback((performanceConfig: SystemConfiguration['performance']) => {
    handleConfigurationChange({ ...configuration, performance: performanceConfig });
  }, [configuration, handleConfigurationChange]);

  // Action Handlers
  const handleSave = async () => {
    if (!onSave || !validationResult?.isValid) return;
    
    setIsSaving(true);
    try {
      await onSave(configuration);
      setHasUnsavedChanges(false);
      setSnackbarMessage('Configuration saved successfully');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    } catch (error) {
      setSnackbarMessage('Failed to save configuration: ' + String(error));
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultConfig = createDefaultConfiguration();
    setConfiguration(defaultConfig);
    setHasUnsavedChanges(false);
    setShowResetDialog(false);
    setSnackbarMessage('Configuration reset to defaults');
    setSnackbarSeverity('success');
    setShowSnackbar(true);
  };

  const handleExport = () => {
    try {
      const exported = configurationSerializer.export(configuration, {
        format: 'json',
        includeComments: true,
        maskSecrets: true
      });
      
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configuration-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSnackbarMessage('Configuration exported successfully');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    } catch (error) {
      setSnackbarMessage('Failed to export configuration: ' + String(error));
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = configurationSerializer.import(content, 'json');
        setConfiguration(imported);
        setHasUnsavedChanges(true);
        setSnackbarMessage('Configuration imported successfully');
        setSnackbarSeverity('success');
        setShowSnackbar(true);
      } catch (error) {
        setSnackbarMessage('Failed to import configuration: ' + String(error));
        setSnackbarSeverity('error');
        setShowSnackbar(true);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleLoadTemplate = (templateName: string) => {
    try {
      const template = configurationTemplateManager.generateFromTemplate(templateName);
      const defaultConfig = createDefaultConfiguration();
      const mergedConfig = { ...defaultConfig, ...template } as SystemConfiguration;
      setConfiguration(mergedConfig);
      setHasUnsavedChanges(true);
      setSnackbarMessage(`Template "${templateName}" loaded successfully`);
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    } catch (error) {
      setSnackbarMessage('Failed to load template: ' + String(error));
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  // Validation Status Component
  const ValidationStatus: React.FC = () => {
    if (isValidating) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={16} />
          <Typography variant="caption">Validating...</Typography>
        </Box>
      );
    }

    if (!validationResult) return null;

    const { isValid, errors, warnings } = validationResult;
    
    if (isValid && warnings.length === 0) {
      return (
        <Chip 
          icon={<ValidIcon />} 
          label="Valid" 
          color="success" 
          size="small" 
        />
      );
    }

    if (!isValid) {
      return (
        <Chip 
          icon={<ErrorIcon />} 
          label={`${errors.length} error${errors.length !== 1 ? 's' : ''}`} 
          color="error" 
          size="small" 
        />
      );
    }

    return (
      <Chip 
        icon={<WarningIcon />} 
        label={`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`} 
        color="warning" 
        size="small" 
      />
    );
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h1">
            Configuration Editor
          </Typography>
          <ValidationStatus />
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem />}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!validationResult?.isValid || isSaving || readOnly || !hasUnsavedChanges}
            loading={isSaving}
          >
            Save
          </Button>

          <Button
            startIcon={<RefreshIcon />}
            onClick={() => setShowResetDialog(true)}
            disabled={readOnly}
          >
            Reset
          </Button>

          <Button
            startIcon={<ExportIcon />}
            onClick={handleExport}
          >
            Export
          </Button>

          <Button
            startIcon={<ImportIcon />}
            component="label"
            disabled={readOnly}
          >
            Import
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </Button>

          {/* Template Buttons */}
          {configurationTemplateManager.getTemplates().map((template) => (
            <Button
              key={template.name}
              variant="outlined"
              size="small"
              onClick={() => handleLoadTemplate(template.name)}
              disabled={readOnly}
            >
              {template.name}
            </Button>
          ))}
        </Stack>

        {/* Validation Alerts */}
        {validationResult && !validationResult.isValid && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Configuration has errors:
            </Typography>
            {validationResult.errors.slice(0, 3).map((error, index) => (
              <Typography key={index} variant="body2">
                • {error.path}: {error.message}
              </Typography>
            ))}
            {validationResult.errors.length > 3 && (
              <Typography variant="body2">
                ... and {validationResult.errors.length - 3} more errors
              </Typography>
            )}
          </Alert>
        )}

        {validationResult && validationResult.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Configuration warnings:
            </Typography>
            {validationResult.warnings.slice(0, 3).map((warning, index) => (
              <Typography key={index} variant="body2">
                • {warning.path}: {warning.message}
              </Typography>
            ))}
            {validationResult.warnings.length > 3 && (
              <Typography variant="body2">
                ... and {validationResult.warnings.length - 3} more warnings
              </Typography>
            )}
          </Alert>
        )}
      </Paper>

      {/* Configuration Tabs */}
      <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {sections.map((section, index) => (
            <Tab
              key={section.label}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <span>{section.icon}</span>
                  <span>{section.label}</span>
                </Box>
              }
              id={`configuration-tab-${index}`}
              aria-controls={`configuration-tabpanel-${index}`}
            />
          ))}
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <TabPanel value={activeTab} index={0}>
            <ApiConfigurationSection
              config={configuration.api}
              onChange={handleApiChange}
              validationErrors={validationResult?.errors.filter(e => e.path.startsWith('api')) || []}
              readOnly={readOnly}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <ServicesConfigurationSection
              config={configuration.services}
              onChange={handleServicesChange}
              validationErrors={validationResult?.errors.filter(e => e.path.startsWith('services')) || []}
              readOnly={readOnly}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <FeaturesConfigurationSection
              config={configuration.features}
              onChange={handleFeaturesChange}
              validationErrors={validationResult?.errors.filter(e => e.path.startsWith('features')) || []}
              readOnly={readOnly}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <SecurityConfigurationSection
              config={configuration.security}
              onChange={handleSecurityChange}
              validationErrors={validationResult?.errors.filter(e => e.path.startsWith('security')) || []}
              readOnly={readOnly}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <MonitoringConfigurationSection
              config={configuration.monitoring}
              onChange={handleMonitoringChange}
              validationErrors={validationResult?.errors.filter(e => e.path.startsWith('monitoring')) || []}
              readOnly={readOnly}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={5}>
            <PerformanceConfigurationSection
              config={configuration.performance}
              onChange={handlePerformanceChange}
              validationErrors={validationResult?.errors.filter(e => e.path.startsWith('performance')) || []}
              readOnly={readOnly}
            />
          </TabPanel>
        </Box>
      </Paper>

      {/* Dialogs */}
      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)}>
        <DialogTitle>Reset Configuration</DialogTitle>
        <DialogContent>
          <Typography>
            This will reset all configuration to default values. Any unsaved changes will be lost.
            Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)}>Cancel</Button>
          <Button onClick={handleReset} color="warning" variant="contained">
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
      >
        <Alert
          onClose={() => setShowSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ConfigurationEditor;