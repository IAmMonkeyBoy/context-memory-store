/**
 * API Configuration Section
 * Phase 7.4.2 - Form controls for API configuration
 */

import React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Switch,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Api as ApiIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Description as DocsIcon
} from '@mui/icons-material';

import type { ApiConfiguration, ValidationError } from '../../../types/configuration';

interface ApiConfigurationSectionProps {
  config: ApiConfiguration;
  onChange: (config: ApiConfiguration) => void;
  validationErrors: ValidationError[];
  readOnly?: boolean;
}

export const ApiConfigurationSection: React.FC<ApiConfigurationSectionProps> = ({
  config,
  onChange,
  validationErrors,
  readOnly = false
}) => {
  const getFieldError = (fieldPath: string) => {
    return validationErrors.find(error => error.path.endsWith(fieldPath));
  };

  const handleChange = <K extends keyof ApiConfiguration>(
    field: K,
    value: ApiConfiguration[K]
  ) => {
    onChange({ ...config, [field]: value });
  };

  const handleNestedChange = <T extends keyof ApiConfiguration>(
    section: T,
    field: keyof ApiConfiguration[T],
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

  const handleArrayChange = <T extends keyof ApiConfiguration>(
    section: T,
    field: keyof ApiConfiguration[T],
    value: string,
    index?: number
  ) => {
    const currentArray = (config[section] as any)[field] as string[];
    let newArray: string[];
    
    if (index !== undefined) {
      // Update existing item
      newArray = [...currentArray];
      newArray[index] = value;
    } else {
      // Add new item
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

  const removeArrayItem = <T extends keyof ApiConfiguration>(
    section: T,
    field: keyof ApiConfiguration[T],
    index: number
  ) => {
    const currentArray = (config[section] as any)[field] as string[];
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
        <ApiIcon />
        API Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Basic API Settings */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                🌐 Server Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Base URL"
                    value={config.baseUrl}
                    onChange={(e) => handleChange('baseUrl', e.target.value)}
                    error={!!getFieldError('baseUrl')}
                    helperText={getFieldError('baseUrl')?.message}
                    disabled={readOnly}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Port"
                    type="number"
                    value={config.port}
                    onChange={(e) => handleChange('port', parseInt(e.target.value))}
                    error={!!getFieldError('port')}
                    helperText={getFieldError('port')?.message}
                    disabled={readOnly}
                    inputProps={{ min: 1, max: 65535 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* CORS Configuration */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                🌍 CORS Settings
                <Chip 
                  label={config.cors.enabled ? 'Enabled' : 'Disabled'} 
                  color={config.cors.enabled ? 'success' : 'default'} 
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
                        checked={config.cors.enabled}
                        onChange={(e) => handleNestedChange('cors', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable CORS"
                  />
                </Grid>
                
                {config.cors.enabled && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Allowed Origins
                      </Typography>
                      {config.cors.origins.map((origin, index) => (
                        <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                          <TextField
                            fullWidth
                            size="small"
                            value={origin}
                            onChange={(e) => handleArrayChange('cors', 'origins', e.target.value, index)}
                            disabled={readOnly}
                            placeholder="https://example.com or *"
                          />
                          {!readOnly && (
                            <Chip
                              label="Remove"
                              size="small"
                              onDelete={() => removeArrayItem('cors', 'origins', index)}
                              variant="outlined"
                            />
                          )}
                        </Box>
                      ))}
                      {!readOnly && (
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Add new origin"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const value = (e.target as HTMLInputElement).value;
                              if (value.trim()) {
                                handleArrayChange('cors', 'origins', value.trim());
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                      )}
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.cors.credentials}
                            onChange={(e) => handleNestedChange('cors', 'credentials', e.target.checked)}
                            disabled={readOnly}
                          />
                        }
                        label="Allow Credentials"
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Max Age (seconds)"
                        type="number"
                        value={config.cors.maxAge}
                        onChange={(e) => handleNestedChange('cors', 'maxAge', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 0, max: 86400 }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Rate Limiting */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <SpeedIcon />
                Rate Limiting
                <Chip 
                  label={config.rateLimiting.enabled ? 'Enabled' : 'Disabled'} 
                  color={config.rateLimiting.enabled ? 'warning' : 'default'} 
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
                        checked={config.rateLimiting.enabled}
                        onChange={(e) => handleNestedChange('rateLimiting', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Rate Limiting"
                  />
                </Grid>
                
                {config.rateLimiting.enabled && (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Requests per Minute"
                        type="number"
                        value={config.rateLimiting.requestsPerMinute}
                        onChange={(e) => handleNestedChange('rateLimiting', 'requestsPerMinute', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 1, max: 10000 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Burst Limit"
                        type="number"
                        value={config.rateLimiting.burstLimit}
                        onChange={(e) => handleNestedChange('rateLimiting', 'burstLimit', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 1, max: 1000 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Window (ms)"
                        type="number"
                        value={config.rateLimiting.windowMs}
                        onChange={(e) => handleNestedChange('rateLimiting', 'windowMs', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 1000, max: 3600000 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Rate Limit Message"
                        value={config.rateLimiting.message}
                        onChange={(e) => handleNestedChange('rateLimiting', 'message', e.target.value)}
                        disabled={readOnly}
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Authentication */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <SecurityIcon />
                Authentication
                <Chip 
                  label={config.authentication.enabled ? config.authentication.provider : 'Disabled'} 
                  color={config.authentication.enabled ? 'success' : 'default'} 
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
                        checked={config.authentication.enabled}
                        onChange={(e) => handleNestedChange('authentication', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Authentication"
                  />
                </Grid>
                
                {config.authentication.enabled && (
                  <>
                    <Grid item xs={12}>
                      <FormControl component="fieldset">
                        <FormLabel component="legend">Authentication Provider</FormLabel>
                        <RadioGroup
                          value={config.authentication.provider}
                          onChange={(e) => handleNestedChange('authentication', 'provider', e.target.value)}
                          row
                        >
                          <FormControlLabel 
                            value="jwt" 
                            control={<Radio />} 
                            label="JWT" 
                            disabled={readOnly}
                          />
                          <FormControlLabel 
                            value="oauth" 
                            control={<Radio />} 
                            label="OAuth" 
                            disabled={readOnly}
                          />
                          <FormControlLabel 
                            value="apikey" 
                            control={<Radio />} 
                            label="API Key" 
                            disabled={readOnly}
                          />
                        </RadioGroup>
                      </FormControl>
                    </Grid>

                    {config.authentication.provider === 'jwt' && (
                      <>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="JWT Secret"
                            type="password"
                            value={config.authentication.jwtSecret || ''}
                            onChange={(e) => handleNestedChange('authentication', 'jwtSecret', e.target.value)}
                            error={!!getFieldError('authentication.jwtSecret')}
                            helperText={getFieldError('authentication.jwtSecret')?.message || 'Minimum 32 characters'}
                            disabled={readOnly}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Token Expiry"
                            value={config.authentication.tokenExpiry || '1h'}
                            onChange={(e) => handleNestedChange('authentication', 'tokenExpiry', e.target.value)}
                            disabled={readOnly}
                            placeholder="1h, 30m, 86400s"
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Refresh Token Expiry"
                            value={config.authentication.refreshTokenExpiry || '7d'}
                            onChange={(e) => handleNestedChange('authentication', 'refreshTokenExpiry', e.target.value)}
                            disabled={readOnly}
                            placeholder="7d, 168h, 604800s"
                          />
                        </Grid>
                      </>
                    )}
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Documentation */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <DocsIcon />
                API Documentation
                <Chip 
                  label={config.swagger.enabled ? 'Enabled' : 'Disabled'} 
                  color={config.swagger.enabled ? 'info' : 'default'} 
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
                        checked={config.swagger.enabled}
                        onChange={(e) => handleNestedChange('swagger', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Swagger/OpenAPI Documentation"
                  />
                </Grid>
                
                {config.swagger.enabled && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Documentation Path"
                        value={config.swagger.path}
                        onChange={(e) => handleNestedChange('swagger', 'path', e.target.value)}
                        disabled={readOnly}
                        placeholder="/swagger"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="API Version"
                        value={config.swagger.version}
                        onChange={(e) => handleNestedChange('swagger', 'version', e.target.value)}
                        disabled={readOnly}
                        placeholder="1.0.0"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="API Title"
                        value={config.swagger.title}
                        onChange={(e) => handleNestedChange('swagger', 'title', e.target.value)}
                        disabled={readOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={config.swagger.description}
                        onChange={(e) => handleNestedChange('swagger', 'description', e.target.value)}
                        disabled={readOnly}
                        multiline
                        rows={3}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Static Files */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                📁 Static Files
                <Chip 
                  label={config.staticFiles.enabled ? 'Enabled' : 'Disabled'} 
                  color={config.staticFiles.enabled ? 'success' : 'default'} 
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
                        checked={config.staticFiles.enabled}
                        onChange={(e) => handleNestedChange('staticFiles', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Static File Serving"
                  />
                </Grid>
                
                {config.staticFiles.enabled && (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Root Directory"
                        value={config.staticFiles.root}
                        onChange={(e) => handleNestedChange('staticFiles', 'root', e.target.value)}
                        disabled={readOnly}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Index File"
                        value={config.staticFiles.index}
                        onChange={(e) => handleNestedChange('staticFiles', 'index', e.target.value)}
                        disabled={readOnly}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Cache Max Age (seconds)"
                        type="number"
                        value={config.staticFiles.maxAge}
                        onChange={(e) => handleNestedChange('staticFiles', 'maxAge', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.staticFiles.etag}
                            onChange={(e) => handleNestedChange('staticFiles', 'etag', e.target.checked)}
                            disabled={readOnly}
                          />
                        }
                        label="Enable ETag Headers"
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
            API Configuration Errors:
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