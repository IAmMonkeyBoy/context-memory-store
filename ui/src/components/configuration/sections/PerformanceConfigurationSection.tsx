/**
 * Performance Configuration Section
 * Phase 7.4.2 - Form controls for performance configuration
 */

import React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  FormControlLabel,
  Select,
  MenuItem,
  Switch,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  InputLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Speed as PerformanceIcon,
  Timer as TimeoutIcon,
  Hub as PoolIcon,
  Memory as ResourceIcon,
  Tune as OptimizationIcon
} from '@mui/icons-material';

import type { PerformanceConfiguration, ValidationError } from '../../../types/configuration';

interface PerformanceConfigurationSectionProps {
  config: PerformanceConfiguration;
  onChange: (config: PerformanceConfiguration) => void;
  validationErrors: ValidationError[];
  readOnly?: boolean;
}

export const PerformanceConfigurationSection: React.FC<PerformanceConfigurationSectionProps> = ({
  config,
  onChange,
  validationErrors,
  readOnly = false
}) => {
  const getFieldError = (fieldPath: string) => {
    return validationErrors.find(error => error.path.endsWith(fieldPath));
  };

  const handleNestedChange = <T extends keyof PerformanceConfiguration>(
    section: T,
    field: keyof PerformanceConfiguration[T],
    value: any
  ) => {
    onChange({
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    });
  };

  const handleDeepNestedChange = <T extends keyof PerformanceConfiguration>(
    section: T,
    subsection: keyof PerformanceConfiguration[T],
    field: string,
    value: any
  ) => {
    const currentSection = config[section] as any;
    const currentSubsection = currentSection[subsection];
    
    onChange({
      ...config,
      [section]: {
        ...currentSection,
        [subsection]: {
          ...currentSubsection,
          [field]: value
        }
      }
    });
  };

  // Helper to format milliseconds to human readable
  const formatTimeout = (ms: number): string => {
    if (ms >= 60000) return `${ms / 60000}m`;
    if (ms >= 1000) return `${ms / 1000}s`;
    return `${ms}ms`;
  };

  // Helper to format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)}GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${bytes}B`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <PerformanceIcon />
        Performance Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Timeouts */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <TimeoutIcon />
                Timeouts
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Request Timeout (ms)"
                    type="number"
                    value={config.timeouts.request}
                    onChange={(e) => handleNestedChange('timeouts', 'request', parseInt(e.target.value))}
                    error={!!getFieldError('timeouts.request')}
                    helperText={getFieldError('timeouts.request')?.message || `Current: ${formatTimeout(config.timeouts.request)}`}
                    disabled={readOnly}
                    inputProps={{ min: 1000, max: 300000 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Connection Timeout (ms)"
                    type="number"
                    value={config.timeouts.connection}
                    onChange={(e) => handleNestedChange('timeouts', 'connection', parseInt(e.target.value))}
                    error={!!getFieldError('timeouts.connection')}
                    helperText={getFieldError('timeouts.connection')?.message || `Current: ${formatTimeout(config.timeouts.connection)}`}
                    disabled={readOnly}
                    inputProps={{ min: 1000, max: 60000 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Keep-Alive Timeout (ms)"
                    type="number"
                    value={config.timeouts.keepAlive}
                    onChange={(e) => handleNestedChange('timeouts', 'keepAlive', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 5000, max: 300000 }}
                    helperText={`Current: ${formatTimeout(config.timeouts.keepAlive)}`}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Header Timeout (ms)"
                    type="number"
                    value={config.timeouts.header}
                    onChange={(e) => handleNestedChange('timeouts', 'header', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 1000, max: 30000 }}
                    helperText={`Current: ${formatTimeout(config.timeouts.header)}`}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Body Timeout (ms)"
                    type="number"
                    value={config.timeouts.body}
                    onChange={(e) => handleNestedChange('timeouts', 'body', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 5000, max: 300000 }}
                    helperText={`Current: ${formatTimeout(config.timeouts.body)}`}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Connection Pools */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <PoolIcon />
                Connection Pools
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Connections"
                    type="number"
                    value={config.connectionPools.maxConnections}
                    onChange={(e) => handleNestedChange('connectionPools', 'maxConnections', parseInt(e.target.value))}
                    error={!!getFieldError('connectionPools.maxConnections')}
                    helperText={getFieldError('connectionPools.maxConnections')?.message}
                    disabled={readOnly}
                    inputProps={{ min: 1, max: 1000 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Min Connections"
                    type="number"
                    value={config.connectionPools.minConnections}
                    onChange={(e) => handleNestedChange('connectionPools', 'minConnections', parseInt(e.target.value))}
                    error={!!getFieldError('connectionPools.minConnections')}
                    helperText={getFieldError('connectionPools.minConnections')?.message}
                    disabled={readOnly}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Idle Timeout (ms)"
                    type="number"
                    value={config.connectionPools.idleTimeout}
                    onChange={(e) => handleNestedChange('connectionPools', 'idleTimeout', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 10000, max: 3600000 }}
                    helperText={`Current: ${formatTimeout(config.connectionPools.idleTimeout)}`}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Acquisition Timeout (ms)"
                    type="number"
                    value={config.connectionPools.acquisitionTimeout}
                    onChange={(e) => handleNestedChange('connectionPools', 'acquisitionTimeout', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 5000, max: 120000 }}
                    helperText={`Current: ${formatTimeout(config.connectionPools.acquisitionTimeout)}`}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.connectionPools.validateConnections}
                        onChange={(e) => handleNestedChange('connectionPools', 'validateConnections', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Validate Connections Before Use"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Resource Limits */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <ResourceIcon />
                Resource Limits
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Memory (MB)"
                    type="number"
                    value={config.resourceLimits.maxMemoryMb}
                    onChange={(e) => handleNestedChange('resourceLimits', 'maxMemoryMb', parseInt(e.target.value))}
                    error={!!getFieldError('resourceLimits.maxMemoryMb')}
                    helperText={getFieldError('resourceLimits.maxMemoryMb')?.message || `Current: ${formatBytes(config.resourceLimits.maxMemoryMb * 1048576)}`}
                    disabled={readOnly}
                    inputProps={{ min: 128, max: 32768 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max CPU Percent"
                    type="number"
                    value={config.resourceLimits.maxCpuPercent}
                    onChange={(e) => handleNestedChange('resourceLimits', 'maxCpuPercent', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 10, max: 100 }}
                    helperText="Maximum CPU usage percentage"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Max Concurrent Requests"
                    type="number"
                    value={config.resourceLimits.maxConcurrentRequests}
                    onChange={(e) => handleNestedChange('resourceLimits', 'maxConcurrentRequests', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 10, max: 10000 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Max Request Queue Size"
                    type="number"
                    value={config.resourceLimits.maxRequestQueueSize}
                    onChange={(e) => handleNestedChange('resourceLimits', 'maxRequestQueueSize', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 100, max: 100000 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Max File Descriptors"
                    type="number"
                    value={config.resourceLimits.maxFileDescriptors}
                    onChange={(e) => handleNestedChange('resourceLimits', 'maxFileDescriptors', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 1024, max: 1048576 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Optimization */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <OptimizationIcon />
                Optimization
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.optimization.http2Enabled}
                        onChange={(e) => handleNestedChange('optimization', 'http2Enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable HTTP/2"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.optimization.keepAliveEnabled}
                        onChange={(e) => handleNestedChange('optimization', 'keepAliveEnabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Keep-Alive"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.optimization.pipeliningEnabled}
                        onChange={(e) => handleNestedChange('optimization', 'pipeliningEnabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable HTTP Pipelining"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.optimization.compressionEnabled}
                        onChange={(e) => handleNestedChange('optimization', 'compressionEnabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Response Compression"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.optimization.staticFileCachingEnabled}
                        onChange={(e) => handleNestedChange('optimization', 'staticFileCachingEnabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Static File Caching"
                  />
                </Grid>

                {/* Garbage Collection Settings */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Garbage Collection
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={readOnly}>
                    <InputLabel>GC Strategy</InputLabel>
                    <Select
                      value={config.optimization.gc.strategy}
                      onChange={(e) => handleDeepNestedChange('optimization', 'gc', 'strategy', e.target.value)}
                    >
                      <MenuItem value="adaptive">Adaptive</MenuItem>
                      <MenuItem value="aggressive">Aggressive</MenuItem>
                      <MenuItem value="conservative">Conservative</MenuItem>
                      <MenuItem value="manual">Manual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Heap Size (MB)"
                    type="number"
                    value={config.optimization.gc.heapSizeMb}
                    onChange={(e) => handleDeepNestedChange('optimization', 'gc', 'heapSizeMb', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 128, max: 16384 }}
                    helperText={`Current: ${formatBytes(config.optimization.gc.heapSizeMb * 1048576)}`}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Performance Summary */}
        <Grid item xs={12}>
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
              Performance Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Memory Limit
                </Typography>
                <Typography variant="h6">
                  {formatBytes(config.resourceLimits.maxMemoryMb * 1048576)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Request Timeout
                </Typography>
                <Typography variant="h6">
                  {formatTimeout(config.timeouts.request)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Max Connections
                </Typography>
                <Typography variant="h6">
                  {config.connectionPools.maxConnections}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Concurrent Requests
                </Typography>
                <Typography variant="h6">
                  {config.resourceLimits.maxConcurrentRequests}
                </Typography>
              </Grid>
            </Grid>

            {/* Performance Recommendations */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Recommendations
              </Typography>
              {config.resourceLimits.maxMemoryMb < 512 && (
                <Chip 
                  label="Consider increasing memory limit for better performance" 
                  color="warning" 
                  size="small" 
                  sx={{ mr: 1, mb: 1 }}
                />
              )}
              {config.timeouts.connection > config.timeouts.request && (
                <Chip 
                  label="Connection timeout should be less than request timeout" 
                  color="error" 
                  size="small" 
                  sx={{ mr: 1, mb: 1 }}
                />
              )}
              {!config.optimization.compressionEnabled && (
                <Chip 
                  label="Enable compression to reduce bandwidth usage" 
                  color="info" 
                  size="small" 
                  sx={{ mr: 1, mb: 1 }}
                />
              )}
              {config.connectionPools.minConnections > config.connectionPools.maxConnections && (
                <Chip 
                  label="Min connections cannot exceed max connections" 
                  color="error" 
                  size="small" 
                  sx={{ mr: 1, mb: 1 }}
                />
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Performance Configuration Errors:
          </Typography>
          {validationErrors.map((error, index) => (
            <Typography key={index} variant="body2">
              • {error.path}: {error.message}
            </Typography>
          ))}
        </Alert>
      )}
    </Box>
  );
};