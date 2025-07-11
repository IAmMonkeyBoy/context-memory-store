/**
 * Features Configuration Section
 * Phase 7.4.2 - Form controls for features configuration
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
  Extension as FeaturesIcon,
  Layers as BatchIcon,
  Memory as CacheIcon,
  Search as SearchIcon,
  Stream as StreamIcon
} from '@mui/icons-material';

import type { FeatureConfiguration, ValidationError } from '../../../types/configuration';

interface FeaturesConfigurationSectionProps {
  config: FeatureConfiguration;
  onChange: (config: FeatureConfiguration) => void;
  validationErrors: ValidationError[];
  readOnly?: boolean;
}

export const FeaturesConfigurationSection: React.FC<FeaturesConfigurationSectionProps> = ({
  config,
  onChange,
  validationErrors,
  readOnly = false
}) => {
  const getFieldError = (fieldPath: string) => {
    return validationErrors.find(error => error.path.endsWith(fieldPath));
  };

  const handleChange = <K extends keyof FeatureConfiguration>(
    field: K,
    value: FeatureConfiguration[K]
  ) => {
    onChange({ ...config, [field]: value });
  };

  const handleNestedChange = <T extends keyof FeatureConfiguration>(
    section: T,
    field: keyof FeatureConfiguration[T],
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

  const handleDeepNestedChange = <T extends keyof FeatureConfiguration>(
    section: T,
    subsection: keyof FeatureConfiguration[T],
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <FeaturesIcon />
        Features Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Main Feature Flags */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                ✨ Main Features
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.realTimeUpdates}
                        onChange={(e) => handleChange('realTimeUpdates', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Real-time Updates"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.advancedAnalytics}
                        onChange={(e) => handleChange('advancedAnalytics', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Advanced Analytics"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.experimentalFeatures}
                        onChange={(e) => handleChange('experimentalFeatures', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Experimental Features"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.debugMode}
                        onChange={(e) => handleChange('debugMode', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Debug Mode"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Batch Processing */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <BatchIcon />
                Batch Processing
                <Chip 
                  label={config.batchProcessing.enabled ? 'Enabled' : 'Disabled'} 
                  color={config.batchProcessing.enabled ? 'success' : 'default'} 
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
                        checked={config.batchProcessing.enabled}
                        onChange={(e) => handleNestedChange('batchProcessing', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Batch Processing"
                  />
                </Grid>
                
                {config.batchProcessing.enabled && (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Batch Size"
                        type="number"
                        value={config.batchProcessing.batchSize}
                        onChange={(e) => handleNestedChange('batchProcessing', 'batchSize', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 1, max: 1000 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Max Concurrency"
                        type="number"
                        value={config.batchProcessing.maxConcurrency}
                        onChange={(e) => handleNestedChange('batchProcessing', 'maxConcurrency', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 1, max: 20 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Queue Timeout (ms)"
                        type="number"
                        value={config.batchProcessing.queueTimeout}
                        onChange={(e) => handleNestedChange('batchProcessing', 'queueTimeout', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 10000 }}
                      />
                    </Grid>

                    {/* Retry Configuration */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Retry Configuration
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Max Attempts"
                        type="number"
                        value={config.batchProcessing.retries.maxAttempts}
                        onChange={(e) => handleDeepNestedChange('batchProcessing', 'retries', 'maxAttempts', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 1, max: 10 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Base Delay (ms)"
                        type="number"
                        value={config.batchProcessing.retries.delay}
                        onChange={(e) => handleDeepNestedChange('batchProcessing', 'retries', 'delay', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 100 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Backoff Multiplier"
                        type="number"
                        value={config.batchProcessing.retries.backoffMultiplier}
                        onChange={(e) => handleDeepNestedChange('batchProcessing', 'retries', 'backoffMultiplier', parseFloat(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 1, max: 10, step: 0.1 }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Caching */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <CacheIcon />
                Caching
                <Chip 
                  label={config.caching.enabled ? 'Enabled' : 'Disabled'} 
                  color={config.caching.enabled ? 'success' : 'default'} 
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
                        checked={config.caching.enabled}
                        onChange={(e) => handleNestedChange('caching', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Caching"
                  />
                </Grid>
                
                {config.caching.enabled && (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Default TTL (seconds)"
                        type="number"
                        value={config.caching.ttl}
                        onChange={(e) => handleNestedChange('caching', 'ttl', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 60 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Max Size (bytes)"
                        type="number"
                        value={config.caching.maxSize}
                        onChange={(e) => handleNestedChange('caching', 'maxSize', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 1048576 }}
                        helperText="Minimum 1MB"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth disabled={readOnly}>
                        <InputLabel>Cache Strategy</InputLabel>
                        <Select
                          value={config.caching.strategy}
                          onChange={(e) => handleNestedChange('caching', 'strategy', e.target.value)}
                        >
                          <MenuItem value="lru">LRU (Least Recently Used)</MenuItem>
                          <MenuItem value="lfu">LFU (Least Frequently Used)</MenuItem>
                          <MenuItem value="fifo">FIFO (First In, First Out)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Memory Cache Layer */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Memory Cache Layer
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.caching.layers.memory.enabled}
                            onChange={(e) => handleDeepNestedChange('caching', 'layers', 'memory', { ...config.caching.layers.memory, enabled: e.target.checked })}
                            disabled={readOnly}
                          />
                        }
                        label="Enable Memory Cache"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Max Entries"
                        type="number"
                        value={config.caching.layers.memory.maxEntries}
                        onChange={(e) => handleDeepNestedChange('caching', 'layers', 'memory', { ...config.caching.layers.memory, maxEntries: parseInt(e.target.value) })}
                        disabled={readOnly || !config.caching.layers.memory.enabled}
                        inputProps={{ min: 100 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Memory TTL (seconds)"
                        type="number"
                        value={config.caching.layers.memory.ttl}
                        onChange={(e) => handleDeepNestedChange('caching', 'layers', 'memory', { ...config.caching.layers.memory, ttl: parseInt(e.target.value) })}
                        disabled={readOnly || !config.caching.layers.memory.enabled}
                        inputProps={{ min: 60 }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Search */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <SearchIcon />
                Search Configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.search.fuzzySearch}
                        onChange={(e) => handleNestedChange('search', 'fuzzySearch', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Fuzzy Search"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Results"
                    type="number"
                    value={config.search.maxResults}
                    onChange={(e) => handleNestedChange('search', 'maxResults', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 10, max: 1000 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Relevance Threshold"
                    type="number"
                    value={config.search.relevanceThreshold}
                    onChange={(e) => handleNestedChange('search', 'relevanceThreshold', parseFloat(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 0, max: 1, step: 0.01 }}
                  />
                </Grid>

                {/* Indexing Configuration */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Indexing Configuration
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.search.indexing.autoIndex}
                        onChange={(e) => handleDeepNestedChange('search', 'indexing', 'autoIndex', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Auto Index"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Update Interval (seconds)"
                    type="number"
                    value={config.search.indexing.updateInterval}
                    onChange={(e) => handleDeepNestedChange('search', 'indexing', 'updateInterval', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 60 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Max Index Size (MB)"
                    type="number"
                    value={config.search.indexing.maxSizeMb}
                    onChange={(e) => handleDeepNestedChange('search', 'indexing', 'maxSizeMb', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 100 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Streaming */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <StreamIcon />
                Streaming
                <Chip 
                  label={config.streaming.enabled ? 'Enabled' : 'Disabled'} 
                  color={config.streaming.enabled ? 'success' : 'default'} 
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
                        checked={config.streaming.enabled}
                        onChange={(e) => handleNestedChange('streaming', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Streaming"
                  />
                </Grid>
                
                {config.streaming.enabled && (
                  <>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Max Concurrent Streams"
                        type="number"
                        value={config.streaming.maxConcurrentStreams}
                        onChange={(e) => handleNestedChange('streaming', 'maxConcurrentStreams', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 1, max: 100 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Timeout (ms)"
                        type="number"
                        value={config.streaming.timeout}
                        onChange={(e) => handleNestedChange('streaming', 'timeout', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 10000 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Buffer Size (bytes)"
                        type="number"
                        value={config.streaming.bufferSize}
                        onChange={(e) => handleNestedChange('streaming', 'bufferSize', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 1024 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Heartbeat Interval (s)"
                        type="number"
                        value={config.streaming.heartbeatInterval}
                        onChange={(e) => handleNestedChange('streaming', 'heartbeatInterval', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 10 }}
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
            Features Configuration Errors:
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