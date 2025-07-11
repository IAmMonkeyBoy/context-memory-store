/**
 * Security Configuration Section
 * Phase 7.4.2 - Form controls for security configuration
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
  Security as SecurityIcon,
  Https as HttpsIcon,
  Shield as HeadersIcon,
  Lock as DataIcon,
  Verified as ValidationIcon,
  Assessment as AuditIcon
} from '@mui/icons-material';

import type { SecurityConfiguration, ValidationError } from '../../../types/configuration';

interface SecurityConfigurationSectionProps {
  config: SecurityConfiguration;
  onChange: (config: SecurityConfiguration) => void;
  validationErrors: ValidationError[];
  readOnly?: boolean;
}

export const SecurityConfigurationSection: React.FC<SecurityConfigurationSectionProps> = ({
  config,
  onChange,
  validationErrors,
  readOnly = false
}) => {
  const getFieldError = (fieldPath: string) => {
    return validationErrors.find(error => error.path.endsWith(fieldPath));
  };

  const handleNestedChange = <T extends keyof SecurityConfiguration>(
    section: T,
    field: keyof SecurityConfiguration[T],
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

  const handleArrayChange = <T extends keyof SecurityConfiguration>(
    section: T,
    field: keyof SecurityConfiguration[T],
    value: string,
    index?: number
  ) => {
    const currentArray = (config[section] as any)[field] as string[];
    let newArray: string[];
    
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

  const removeArrayItem = <T extends keyof SecurityConfiguration>(
    section: T,
    field: keyof SecurityConfiguration[T],
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
        <SecurityIcon />
        Security Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* HTTPS Configuration */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <HttpsIcon />
                HTTPS & TLS
                <Chip 
                  label={config.https.enabled ? 'Enabled' : 'Disabled'} 
                  color={config.https.enabled ? 'success' : 'warning'} 
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
                        checked={config.https.enabled}
                        onChange={(e) => handleNestedChange('https', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable HTTPS"
                  />
                </Grid>
                
                {config.https.enabled && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Certificate Path"
                        value={config.https.certificatePath || ''}
                        onChange={(e) => handleNestedChange('https', 'certificatePath', e.target.value)}
                        error={!!getFieldError('https.certificatePath')}
                        helperText={getFieldError('https.certificatePath')?.message}
                        disabled={readOnly}
                        placeholder="/path/to/certificate.crt"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Private Key Path"
                        value={config.https.keyPath || ''}
                        onChange={(e) => handleNestedChange('https', 'keyPath', e.target.value)}
                        error={!!getFieldError('https.keyPath')}
                        helperText={getFieldError('https.keyPath')?.message}
                        disabled={readOnly}
                        placeholder="/path/to/private.key"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth disabled={readOnly}>
                        <InputLabel>Minimum TLS Version</InputLabel>
                        <Select
                          value={config.https.minTlsVersion}
                          onChange={(e) => handleNestedChange('https', 'minTlsVersion', e.target.value)}
                        >
                          <MenuItem value="1.0">TLS 1.0</MenuItem>
                          <MenuItem value="1.1">TLS 1.1</MenuItem>
                          <MenuItem value="1.2">TLS 1.2</MenuItem>
                          <MenuItem value="1.3">TLS 1.3</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.https.redirectHttp}
                            onChange={(e) => handleNestedChange('https', 'redirectHttp', e.target.checked)}
                            disabled={readOnly}
                          />
                        }
                        label="Redirect HTTP to HTTPS"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Security Headers */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <HeadersIcon />
                Security Headers
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Content Security Policy"
                    value={config.headers.contentSecurityPolicy}
                    onChange={(e) => handleNestedChange('headers', 'contentSecurityPolicy', e.target.value)}
                    disabled={readOnly}
                    multiline
                    rows={2}
                    helperText="CSP header to prevent XSS attacks"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Strict Transport Security"
                    value={config.headers.strictTransportSecurity}
                    onChange={(e) => handleNestedChange('headers', 'strictTransportSecurity', e.target.value)}
                    disabled={readOnly}
                    placeholder="max-age=31536000; includeSubDomains"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={readOnly}>
                    <InputLabel>X-Frame-Options</InputLabel>
                    <Select
                      value={config.headers.xFrameOptions}
                      onChange={(e) => handleNestedChange('headers', 'xFrameOptions', e.target.value)}
                    >
                      <MenuItem value="DENY">DENY</MenuItem>
                      <MenuItem value="SAMEORIGIN">SAMEORIGIN</MenuItem>
                      <MenuItem value="ALLOW-FROM">ALLOW-FROM</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={readOnly}>
                    <InputLabel>X-Content-Type-Options</InputLabel>
                    <Select
                      value={config.headers.xContentTypeOptions}
                      onChange={(e) => handleNestedChange('headers', 'xContentTypeOptions', e.target.value)}
                    >
                      <MenuItem value="nosniff">nosniff</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={readOnly}>
                    <InputLabel>Referrer Policy</InputLabel>
                    <Select
                      value={config.headers.referrerPolicy}
                      onChange={(e) => handleNestedChange('headers', 'referrerPolicy', e.target.value)}
                    >
                      <MenuItem value="no-referrer">no-referrer</MenuItem>
                      <MenuItem value="no-referrer-when-downgrade">no-referrer-when-downgrade</MenuItem>
                      <MenuItem value="same-origin">same-origin</MenuItem>
                      <MenuItem value="strict-origin">strict-origin</MenuItem>
                      <MenuItem value="strict-origin-when-cross-origin">strict-origin-when-cross-origin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="X-XSS-Protection"
                    value={config.headers.xXssProtection}
                    onChange={(e) => handleNestedChange('headers', 'xXssProtection', e.target.value)}
                    disabled={readOnly}
                    placeholder="1; mode=block"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Data Protection */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <DataIcon />
                Data Protection
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Hash Salt Rounds"
                    type="number"
                    value={config.dataProtection.hashSaltRounds}
                    onChange={(e) => handleNestedChange('dataProtection', 'hashSaltRounds', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 8, max: 20 }}
                    helperText="Bcrypt salt rounds (higher = more secure, slower)"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.dataProtection.cookieSecure}
                        onChange={(e) => handleNestedChange('dataProtection', 'cookieSecure', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Secure Cookies"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={readOnly}>
                    <InputLabel>Cookie SameSite</InputLabel>
                    <Select
                      value={config.dataProtection.cookieSameSite}
                      onChange={(e) => handleNestedChange('dataProtection', 'cookieSameSite', e.target.value)}
                    >
                      <MenuItem value="strict">Strict</MenuItem>
                      <MenuItem value="lax">Lax</MenuItem>
                      <MenuItem value="none">None</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Encryption Key"
                    type="password"
                    value={config.dataProtection.encryptionKey || ''}
                    onChange={(e) => handleNestedChange('dataProtection', 'encryptionKey', e.target.value)}
                    disabled={readOnly}
                    helperText="32+ character encryption key"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Session Secret"
                    type="password"
                    value={config.dataProtection.sessionSecret || ''}
                    onChange={(e) => handleNestedChange('dataProtection', 'sessionSecret', e.target.value)}
                    disabled={readOnly}
                    helperText="Secret for session signing"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data Retention (days)"
                    type="number"
                    value={config.dataProtection.dataRetentionDays}
                    onChange={(e) => handleNestedChange('dataProtection', 'dataRetentionDays', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 1, max: 3650 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Input Validation */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <ValidationIcon />
                Input Validation
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.validation.strictMode}
                        onChange={(e) => handleNestedChange('validation', 'strictMode', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Strict Validation Mode"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Request Size (bytes)"
                    type="number"
                    value={config.validation.maxRequestSize}
                    onChange={(e) => handleNestedChange('validation', 'maxRequestSize', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 1024 }}
                    helperText="Maximum request body size"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max URL Length"
                    type="number"
                    value={config.validation.maxUrlLength}
                    onChange={(e) => handleNestedChange('validation', 'maxUrlLength', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 256, max: 8192 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max File Size (bytes)"
                    type="number"
                    value={config.validation.maxFileSize}
                    onChange={(e) => handleNestedChange('validation', 'maxFileSize', parseInt(e.target.value))}
                    disabled={readOnly}
                    inputProps={{ min: 1024 }}
                    helperText="Maximum upload file size"
                  />
                </Grid>

                {/* Allowed File Types */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Allowed File Types
                  </Typography>
                  {config.validation.allowedFileTypes.map((fileType, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                      <TextField
                        fullWidth
                        size="small"
                        value={fileType}
                        onChange={(e) => handleArrayChange('validation', 'allowedFileTypes', e.target.value, index)}
                        disabled={readOnly}
                        placeholder=".txt, .pdf, .doc"
                      />
                      {!readOnly && (
                        <Chip
                          label="Remove"
                          size="small"
                          onDelete={() => removeArrayItem('validation', 'allowedFileTypes', index)}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  ))}
                  {!readOnly && (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add file type (.ext)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value;
                          if (value.trim()) {
                            handleArrayChange('validation', 'allowedFileTypes', value.trim());
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

        {/* Audit Logging */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" display="flex" alignItems="center" gap={1}>
                <AuditIcon />
                Audit Logging
                <Chip 
                  label={config.audit.enabled ? 'Enabled' : 'Disabled'} 
                  color={config.audit.enabled ? 'success' : 'default'} 
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
                        checked={config.audit.enabled}
                        onChange={(e) => handleNestedChange('audit', 'enabled', e.target.checked)}
                        disabled={readOnly}
                      />
                    }
                    label="Enable Audit Logging"
                  />
                </Grid>
                
                {config.audit.enabled && (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Retention Days"
                        type="number"
                        value={config.audit.retentionDays}
                        onChange={(e) => handleNestedChange('audit', 'retentionDays', parseInt(e.target.value))}
                        disabled={readOnly}
                        inputProps={{ min: 1, max: 3650 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.audit.includeRequestBodies}
                            onChange={(e) => handleNestedChange('audit', 'includeRequestBodies', e.target.checked)}
                            disabled={readOnly}
                          />
                        }
                        label="Include Request Bodies"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.audit.includeResponseBodies}
                            onChange={(e) => handleNestedChange('audit', 'includeResponseBodies', e.target.checked)}
                            disabled={readOnly}
                          />
                        }
                        label="Include Response Bodies"
                      />
                    </Grid>

                    {/* Audit Events */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Audited Events
                      </Typography>
                      {config.audit.events.map((event, index) => (
                        <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                          <TextField
                            fullWidth
                            size="small"
                            value={event}
                            onChange={(e) => handleArrayChange('audit', 'events', e.target.value, index)}
                            disabled={readOnly}
                            placeholder="login, logout, data_access, etc."
                          />
                          {!readOnly && (
                            <Chip
                              label="Remove"
                              size="small"
                              onDelete={() => removeArrayItem('audit', 'events', index)}
                              variant="outlined"
                            />
                          )}
                        </Box>
                      ))}
                      {!readOnly && (
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Add audit event"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const value = (e.target as HTMLInputElement).value;
                              if (value.trim()) {
                                handleArrayChange('audit', 'events', value.trim());
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                      )}
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
            Security Configuration Errors:
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