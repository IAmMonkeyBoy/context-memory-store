/**
 * Monitoring Configuration Section
 * Phase 7.4.2 - Form controls for monitoring configuration
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
  Monitor as MonitorIcon,
  Article as LogIcon,
  Analytics as MetricsIcon,
  Notifications as AlertIcon,
  Health as HealthIcon,
  Timeline as TracingIcon
} from '@mui/icons-material';

import type { MonitoringConfiguration, ValidationError } from '../../../types/configuration';

interface MonitoringConfigurationSectionProps {
  config: MonitoringConfiguration;
  onChange: (config: MonitoringConfiguration) => void;
  validationErrors: ValidationError[];
  readOnly?: boolean;
}

export const MonitoringConfigurationSection: React.FC<MonitoringConfigurationSectionProps> = ({
  config,
  onChange,
  validationErrors,
  readOnly = false
}) => {
  const getFieldError = (fieldPath: string) => {
    return validationErrors.find(error => error.path.endsWith(fieldPath));
  };

  const handleNestedChange = <T extends keyof MonitoringConfiguration>(
    section: T,
    field: keyof MonitoringConfiguration[T],
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

  const handleDeepNestedChange = <T extends keyof MonitoringConfiguration>(
    section: T,
    subsection: keyof MonitoringConfiguration[T],
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

  const handleArrayChange = <T extends keyof MonitoringConfiguration>(
    section: T,
    field: keyof MonitoringConfiguration[T],
    value: any,
    index?: number
  ) => {
    const currentArray = (config[section] as any)[field] as any[];
    let newArray: any[];
    
    if (index !== undefined) {
      newArray = [...currentArray];
      newArray[index] = value;
    } else {
      newArray = [...currentArray, value];
    }
    
    onChange({
      ...config,
      [section]: {
        ...config[section],
        [field]: newArray
      }
    });
  };

  const removeArrayItem = <T extends keyof MonitoringConfiguration>(
    section: T,
    field: keyof MonitoringConfiguration[T],
    index: number
  ) => {
    const currentArray = (config[section] as any)[field] as any[];
    const newArray = currentArray.filter((_, i) => i !== index);
    
    onChange({
      ...config,
      [section]: {
        ...config[section],
        [field]: newArray
      }
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <MonitorIcon />
        Monitoring Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Logging */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <LogIcon />
                Logging
                <Chip label={config.logging.level} color="primary" size="small" />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={readOnly}>
                    <InputLabel>Log Level</InputLabel>
                    <Select
                      value={config.logging.level}
                      onChange={(e) => handleNestedChange('logging', 'level', e.target.value)}
                    >
                      <MenuItem value="trace">Trace</MenuItem>
                      <MenuItem value="debug">Debug</MenuItem>
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="warn">Warn</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                      <MenuItem value="fatal">Fatal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={readOnly}>
                    <InputLabel>Log Format</InputLabel>
                    <Select
                      value={config.logging.format}
                      onChange={(e) => handleNestedChange('logging', 'format', e.target.value)}
                    >
                      <MenuItem value="json">JSON</MenuItem>
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="structured">Structured</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.logging.includeTimestamp}
                        onChange={(e) => handleNestedChange('logging', 'includeTimestamp', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Include Timestamp"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.logging.includeStackTrace}
                        onChange={(e) => handleNestedChange('logging', 'includeStackTrace', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Include Stack Trace"
                  />
                </Grid>

                {/* Log Outputs */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Log Outputs
                  </Typography>
                  {config.logging.outputs.map((output, index) => (
                    <Box key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth disabled={readOnly}>
                            <InputLabel>Output Type</InputLabel>
                            <Select
                              value={output.type}
                              onChange={(e) => {
                                const newOutput = { ...output, type: e.target.value as any };
                                handleArrayChange('logging', 'outputs', newOutput, index);
                              }}
                            >
                              <MenuItem value="console">Console</MenuItem>
                              <MenuItem value="file">File</MenuItem>
                              <MenuItem value="syslog">Syslog</MenuItem>
                              <MenuItem value="http">HTTP</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                              Configuration: {JSON.stringify(output.config)}
                            </Typography>
                            {!readOnly && (
                              <Chip
                                label="Remove"
                                size="small"
                                onDelete={() => removeArrayItem('logging', 'outputs', index)}
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Grid>

                {/* Log Rotation */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Log Rotation
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.logging.rotation.enabled}
                        onChange={(e) => handleDeepNestedChange('logging', 'rotation', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Rotation"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Max Size (MB)"
                    type="number"
                    value={config.logging.rotation.maxSizeMb}
                    onChange={(e) => handleDeepNestedChange('logging', 'rotation', 'maxSizeMb', parseInt(e.target.value))}
                    disabled={readOnly || !config.logging.rotation.enabled}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Max Files"
                    type="number"
                    value={config.logging.rotation.maxFiles}
                    onChange={(e) => handleDeepNestedChange('logging', 'rotation', 'maxFiles', parseInt(e.target.value))}
                    disabled={readOnly || !config.logging.rotation.enabled}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth disabled={readOnly || !config.logging.rotation.enabled}>
                    <InputLabel>Rotation Interval</InputLabel>
                    <Select
                      value={config.logging.rotation.interval}
                      onChange={(e) => handleDeepNestedChange('logging', 'rotation', 'interval', e.target.value)}
                    >
                      <MenuItem value="hourly">Hourly</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Metrics */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <MetricsIcon />
                Metrics
                <Chip 
                  label={config.metrics.enabled ? 'Enabled' : 'Disabled'} 
                  color={config.metrics.enabled ? 'success' : 'default'} 
                  size="small" 
                />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.metrics.enabled}
                        onChange={(e) => handleNestedChange('metrics', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Metrics Collection"
                  />
                </Grid>
                
                {config.metrics.enabled && (
                  <>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth disabled={readOnly}>
                        <InputLabel>Metrics Format</InputLabel>
                        <Select
                          value={config.metrics.format}
                          onChange={(e) => handleNestedChange('metrics', 'format', e.target.value)}
                        >
                          <MenuItem value="prometheus">Prometheus</MenuItem>
                          <MenuItem value="json">JSON</MenuItem>
                          <MenuItem value="statsd">StatsD</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Metrics Endpoint"
                        value={config.metrics.endpoint}
                        onChange={(e) => handleNestedChange('metrics', 'endpoint', e.target.value)}
                        disabled={readOnly}
                        placeholder="/metrics"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Collection Interval (seconds)"
                        type="number"
                        value={config.metrics.interval}
                        onChange={(e) => handleNestedChange('metrics', 'interval', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 5, max: 300 }}
                      />
                    </Grid>

                    {/* Custom Metrics */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Custom Metrics
                      </Typography>
                      {config.metrics.custom.map((metric, index) => (
                        <Box key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, mb: 1 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Name"
                                value={metric.name}
                                onChange={(e) => {
                                  const newMetric = { ...metric, name: e.target.value };
                                  handleArrayChange('metrics', 'custom', newMetric, index);
                                }}
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <FormControl fullWidth size="small" disabled={readOnly}>
                                <InputLabel>Type</InputLabel>
                                <Select
                                  value={metric.type}
                                  onChange={(e) => {
                                    const newMetric = { ...metric, type: e.target.value as any };
                                    handleArrayChange('metrics', 'custom', newMetric, index);
                                  }}
                                >
                                  <MenuItem value="counter">Counter</MenuItem>
                                  <MenuItem value="gauge">Gauge</MenuItem>
                                  <MenuItem value="histogram">Histogram</MenuItem>
                                  <MenuItem value="summary">Summary</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={3}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Description"
                                value={metric.description}
                                onChange={(e) => {
                                  const newMetric = { ...metric, description: e.target.value };
                                  handleArrayChange('metrics', 'custom', newMetric, index);
                                }}
                                disabled={readOnly}
                              />
                            </Grid>
                            <Grid item xs={1}>
                              {!readOnly && (
                                <Chip
                                  label="×"
                                  size="small"
                                  onDelete={() => removeArrayItem('metrics', 'custom', index)}
                                  variant="outlined"
                                />
                              )}
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Alerting */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <AlertIcon />
                Alerting
                <Chip 
                  label={config.alerting.enabled ? 'Enabled' : 'Disabled'} 
                  color={config.alerting.enabled ? 'warning' : 'default'} 
                  size="small" 
                />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.alerting.enabled}
                        onChange={(e) => handleNestedChange('alerting', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Alerting"
                  />
                </Grid>
                
                {config.alerting.enabled && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Alert Channels (webhook URLs, email addresses, etc.)
                      </Typography>
                      {config.alerting.channels.map((channel, index) => (
                        <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                          <TextField
                            fullWidth
                            size="small"
                            value={channel}
                            onChange={(e) => handleArrayChange('alerting', 'channels', e.target.value, index)}
                            disabled={readOnly}
                            placeholder="webhook:https://..., email:admin@..."
                          />
                          {!readOnly && (
                            <Chip
                              label="Remove"
                              size="small"
                              onDelete={() => removeArrayItem('alerting', 'channels', index)}
                              variant="outlined"
                            />
                          )}
                        </Box>
                      ))}
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Health Checks */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <HealthIcon />
                Health Checks
                <Chip 
                  label={config.healthChecks.enabled ? 'Enabled' : 'Disabled'} 
                  color={config.healthChecks.enabled ? 'success' : 'default'} 
                  size="small" 
                />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.healthChecks.enabled}
                        onChange={(e) => handleNestedChange('healthChecks', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Health Checks"
                  />
                </Grid>
                
                {config.healthChecks.enabled && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Check Interval (seconds)"
                        type="number"
                        value={config.healthChecks.interval}
                        onChange={(e) => handleNestedChange('healthChecks', 'interval', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 5, max: 300 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Check Timeout (ms)"
                        type="number"
                        value={config.healthChecks.timeout}
                        onChange={(e) => handleNestedChange('healthChecks', 'timeout', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 1000, max: 30000 }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Distributed Tracing */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <TracingIcon />
                Distributed Tracing
                <Chip 
                  label={config.tracing.enabled ? 'Enabled' : 'Disabled'} 
                  color={config.tracing.enabled ? 'info' : 'default'} 
                  size="small" 
                />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.tracing.enabled}
                        onChange={(e) => handleNestedChange('tracing', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Distributed Tracing"
                  />
                </Grid>
                
                {config.tracing.enabled && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth disabled={readOnly}>
                        <InputLabel>Tracing Provider</InputLabel>
                        <Select
                          value={config.tracing.provider}
                          onChange={(e) => handleNestedChange('tracing', 'provider', e.target.value)}
                        >
                          <MenuItem value="jaeger">Jaeger</MenuItem>
                          <MenuItem value="zipkin">Zipkin</MenuItem>
                          <MenuItem value="otlp">OpenTelemetry</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Tracing Endpoint"
                        value={config.tracing.endpoint}
                        onChange={(e) => handleNestedChange('tracing', 'endpoint', e.target.value)}
                        disabled={readOnly}
                        placeholder="http://localhost:14268/api/traces"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Sampling Rate"
                        type="number"
                        value={config.tracing.samplingRate}
                        onChange={(e) => handleNestedChange('tracing', 'samplingRate', parseFloat(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 0, max: 1, step: 0.01 }}
                        helperText="0.0 = no sampling, 1.0 = sample all traces"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Service Name"
                        value={config.tracing.serviceName}
                        onChange={(e) => handleNestedChange('tracing', 'serviceName', e.target.value)}
                        disabled={readOnly}
                        placeholder="context-memory-store"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Monitoring Configuration Errors:
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