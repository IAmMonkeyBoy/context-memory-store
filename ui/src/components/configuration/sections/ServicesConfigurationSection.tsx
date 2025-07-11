/**
 * Services Configuration Section
 * Phase 7.4.2 - Form controls for external services configuration
 */

import React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  FormControlLabel,
  FormLabel,
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
  Storage as DatabaseIcon,
  Psychology as AIIcon,
  AccountTree as GraphIcon
} from '@mui/icons-material';

import type { ServicesConfiguration, ValidationError } from '../../../types/configuration';

interface ServicesConfigurationSectionProps {
  config: ServicesConfiguration;
  onChange: (config: ServicesConfiguration) => void;
  validationErrors: ValidationError[];
  readOnly?: boolean;
}

export const ServicesConfigurationSection: React.FC<ServicesConfigurationSectionProps> = ({
  config,
  onChange,
  validationErrors,
  readOnly = false
}) => {
  const getFieldError = (fieldPath: string) => {
    return validationErrors.find(error => error.path.endsWith(fieldPath));
  };

  const handleServiceChange = <T extends keyof ServicesConfiguration>(
    service: T,
    field: keyof ServicesConfiguration[T],
    value: any
  ) => {
    onChange({
      ...config,
      [service]: {
        ...config[service],
        [field]: value
      }
    });
  };

  const handleNestedChange = <T extends keyof ServicesConfiguration>(
    service: T,
    section: keyof ServicesConfiguration[T],
    field: string,
    value: any
  ) => {
    const currentSection = (config[service] as any)[section];
    onChange({
      ...config,
      [service]: {
        ...config[service],
        [section]: {
          ...currentSection,
          [field]: value
        }
      }
    });
  };

  const handleArrayChange = <T extends keyof ServicesConfiguration>(
    service: T,
    field: keyof ServicesConfiguration[T],
    arrayField: string,
    value: string,
    index?: number
  ) => {
    const currentObject = (config[service] as any)[field];
    const currentArray = currentObject[arrayField] as string[];
    let newArray: string[];
    
    if (index !== undefined) {
      newArray = [...currentArray];
      newArray[index] = value;
    } else {
      newArray = [...currentArray, value];
    }
    
    onChange({
      ...config,
      [service]: {
        ...config[service],
        [field]: {
          ...currentObject,
          [arrayField]: newArray
        }
      }
    });
  };

  const removeArrayItem = <T extends keyof ServicesConfiguration>(
    service: T,
    field: keyof ServicesConfiguration[T],
    arrayField: string,
    index: number
  ) => {
    const currentObject = (config[service] as any)[field];
    const currentArray = currentObject[arrayField] as string[];
    const newArray = currentArray.filter((_, i) => i !== index);
    
    onChange({
      ...config,
      [service]: {
        ...config[service],
        [field]: {
          ...currentObject,
          [arrayField]: newArray
        }
      }
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <DatabaseIcon />
        Services Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Qdrant Vector Database */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <DatabaseIcon />
                Qdrant Vector Database
                <Chip label="Vector Store" color="primary" size="small" />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Qdrant URL"
                    value={config.qdrant.url}
                    onChange={(e) => handleServiceChange('qdrant', 'url', e.target.value)}
                    error={!!getFieldError('services.qdrant.url')}
                    helperText={getFieldError('services.qdrant.url')?.message}
                    disabled={readOnly}
                    placeholder="http://localhost:6333"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Collection Name"
                    value={config.qdrant.collection}
                    onChange={(e) => handleServiceChange('qdrant', 'collection', e.target.value)}
                    disabled={readOnly}
                    placeholder="default"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Vector Size"
                    type="number"
                    value={config.qdrant.vectorSize}
                    onChange={(e) => handleServiceChange('qdrant', 'vectorSize', parseInt(e.target.value))}
                    error={!!getFieldError('services.qdrant.vectorSize')}
                    helperText={getFieldError('services.qdrant.vectorSize')?.message}
                    disabled={readOnly}
                    inputProps={{ min: 1, max: 65536 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={readOnly}>
                    <InputLabel>Distance Metric</InputLabel>
                    <Select
                      value={config.qdrant.distance}
                      onChange={(e) => handleServiceChange('qdrant', 'distance', e.target.value)}
                    >
                      <MenuItem value="cosine">Cosine</MenuItem>
                      <MenuItem value="dot">Dot Product</MenuItem>
                      <MenuItem value="euclidean">Euclidean</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Timeout (ms)"
                    type="number"
                    value={config.qdrant.timeout}
                    onChange={(e) => handleServiceChange('qdrant', 'timeout', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 1000 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Retry Attempts"
                    type="number"
                    value={config.qdrant.retryAttempts}
                    onChange={(e) => handleServiceChange('qdrant', 'retryAttempts', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 0, max: 10 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Retry Delay (ms)"
                    type="number"
                    value={config.qdrant.retryDelay}
                    onChange={(e) => handleServiceChange('qdrant', 'retryDelay', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Health Check Interval (s)"
                    type="number"
                    value={config.qdrant.healthCheckInterval}
                    onChange={(e) => handleServiceChange('qdrant', 'healthCheckInterval', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 5 }}
                  />
                </Grid>

                {/* Connection Pool Settings */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Connection Pool
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Connections"
                    type="number"
                    value={config.qdrant.connectionPool.maxConnections}
                    onChange={(e) => handleNestedChange('qdrant', 'connectionPool', 'maxConnections', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Idle Timeout (ms)"
                    type="number"
                    value={config.qdrant.connectionPool.idleTimeout}
                    onChange={(e) => handleNestedChange('qdrant', 'connectionPool', 'idleTimeout', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 10000 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Neo4j Graph Database */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <GraphIcon />
                Neo4j Graph Database
                <Chip label="Graph Store" color="secondary" size="small" />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Neo4j URI"
                    value={config.neo4j.uri}
                    onChange={(e) => handleServiceChange('neo4j', 'uri', e.target.value)}
                    error={!!getFieldError('services.neo4j.uri')}
                    helperText={getFieldError('services.neo4j.uri')?.message}
                    disabled={readOnly}
                    placeholder="bolt://localhost:7687"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Database Name"
                    value={config.neo4j.database}
                    onChange={(e) => handleServiceChange('neo4j', 'database', e.target.value)}
                    disabled={readOnly}
                    placeholder="neo4j"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={config.neo4j.username}
                    onChange={(e) => handleServiceChange('neo4j', 'username', e.target.value)}
                    disabled={readOnly}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={config.neo4j.password}
                    onChange={(e) => handleServiceChange('neo4j', 'password', e.target.value)}
                    disabled={readOnly}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Connection Lifetime (ms)"
                    type="number"
                    value={config.neo4j.maxConnectionLifetime}
                    onChange={(e) => handleServiceChange('neo4j', 'maxConnectionLifetime', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 60000 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Pool Size"
                    type="number"
                    value={config.neo4j.maxConnectionPoolSize}
                    onChange={(e) => handleServiceChange('neo4j', 'maxConnectionPoolSize', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 1, max: 200 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Connection Timeout (ms)"
                    type="number"
                    value={config.neo4j.connectionAcquisitionTimeout}
                    onChange={(e) => handleServiceChange('neo4j', 'connectionAcquisitionTimeout', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 5000 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Health Check Interval (s)"
                    type="number"
                    value={config.neo4j.healthCheckInterval}
                    onChange={(e) => handleServiceChange('neo4j', 'healthCheckInterval', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 5 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.neo4j.encrypted}
                        onChange={(e) => handleServiceChange('neo4j', 'encrypted', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable TLS Encryption"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={readOnly}>
                    <InputLabel>Trust Strategy</InputLabel>
                    <Select
                      value={config.neo4j.trustStrategy}
                      onChange={(e) => handleServiceChange('neo4j', 'trustStrategy', e.target.value)}
                    >
                      <MenuItem value="TRUST_ALL_CERTIFICATES">Trust All Certificates</MenuItem>
                      <MenuItem value="TRUST_SYSTEM_CA_SIGNED_CERTIFICATES">Trust System CA</MenuItem>
                      <MenuItem value="TRUST_CUSTOM_CA_SIGNED_CERTIFICATES">Trust Custom CA</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Ollama LLM Service */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <AIIcon />
                Ollama LLM Service
                <Chip label="AI Service" color="info" size="small" />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Ollama Base URL"
                    value={config.ollama.baseUrl}
                    onChange={(e) => handleServiceChange('ollama', 'baseUrl', e.target.value)}
                    error={!!getFieldError('services.ollama.baseUrl')}
                    helperText={getFieldError('services.ollama.baseUrl')?.message}
                    disabled={readOnly}
                    placeholder="http://host.docker.internal:11434"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Keep Alive Duration"
                    value={config.ollama.keepAlive}
                    onChange={(e) => handleServiceChange('ollama', 'keepAlive', e.target.value)}
                    disabled={readOnly}
                    placeholder="5m"
                    helperText="Duration format: 5m, 300s, etc."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Chat Model"
                    value={config.ollama.chatModel}
                    onChange={(e) => handleServiceChange('ollama', 'chatModel', e.target.value)}
                    disabled={readOnly}
                    placeholder="llama3"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Embedding Model"
                    value={config.ollama.embeddingModel}
                    onChange={(e) => handleServiceChange('ollama', 'embeddingModel', e.target.value)}
                    disabled={readOnly}
                    placeholder="mxbai-embed-large"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Timeout (ms)"
                    type="number"
                    value={config.ollama.timeout}
                    onChange={(e) => handleServiceChange('ollama', 'timeout', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 5000 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Max Retries"
                    type="number"
                    value={config.ollama.maxRetries}
                    onChange={(e) => handleServiceChange('ollama', 'maxRetries', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 0, max: 10 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Retry Delay (ms)"
                    type="number"
                    value={config.ollama.retryDelay}
                    onChange={(e) => handleServiceChange('ollama', 'retryDelay', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 1000 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.ollama.streamingEnabled}
                        onChange={(e) => handleServiceChange('ollama', 'streamingEnabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Streaming Responses"
                  />
                </Grid>

                {/* Model Parameters */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Model Parameters
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Temperature"
                    type="number"
                    value={config.ollama.temperature}
                    onChange={(e) => handleServiceChange('ollama', 'temperature', parseFloat(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 0, max: 2, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Top P"
                    type="number"
                    value={config.ollama.topP}
                    onChange={(e) => handleServiceChange('ollama', 'topP', parseFloat(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 0, max: 1, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Top K"
                    type="number"
                    value={config.ollama.topK}
                    onChange={(e) => handleServiceChange('ollama', 'topK', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Context Window"
                    type="number"
                    value={config.ollama.contextWindow}
                    onChange={(e) => handleServiceChange('ollama', 'contextWindow', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 512, max: 32768 }}
                  />
                </Grid>

                {/* Available Models */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Available Models
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Chat Models
                  </Typography>
                  {config.ollama.models.chat.map((model, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                      <TextField
                        fullWidth
                        size="small"
                        value={model}
                        onChange={(e) => handleArrayChange('ollama', 'models', 'chat', e.target.value, index)}
                        disabled={readOnly}
                      />
                      {!readOnly && (
                        <Chip
                          label="Remove"
                          size="small"
                          onDelete={() => removeArrayItem('ollama', 'models', 'chat', index)}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  ))}
                  {!readOnly && (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add chat model"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value;
                          if (value.trim()) {
                            handleArrayChange('ollama', 'models', 'chat', value.trim());
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Embedding Models
                  </Typography>
                  {config.ollama.models.embedding.map((model, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                      <TextField
                        fullWidth
                        size="small"
                        value={model}
                        onChange={(e) => handleArrayChange('ollama', 'models', 'embedding', e.target.value, index)}
                        disabled={readOnly}
                      />
                      {!readOnly && (
                        <Chip
                          label="Remove"
                          size="small"
                          onDelete={() => removeArrayItem('ollama', 'models', 'embedding', index)}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  ))}
                  {!readOnly && (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add embedding model"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value;
                          if (value.trim()) {
                            handleArrayChange('ollama', 'models', 'embedding', value.trim());
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Services Configuration Errors:
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