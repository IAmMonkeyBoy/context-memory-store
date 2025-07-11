import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as ValidIcon,
  Error as InvalidIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

export interface ConfigurationTabProps {
  data: any;
  isLoading: boolean;
}

const ConfigurationTab: React.FC<ConfigurationTabProps> = ({ data, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSensitive, setShowSensitive] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | false>('general');

  if (isLoading) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading configuration information...</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Alert severity="info">
        No configuration information available. Check if the diagnostics service is running.
      </Alert>
    );
  }

  const config = data.configuration || {};
  const validation = config.validation || {};
  const sections = config.sections || {};

  const handleAccordionChange = (panel: string) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean,
  ) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const getValidationIcon = (isValid: boolean) => {
    return isValid ? <ValidIcon color="success" /> : <InvalidIcon color="error" />;
  };

  const maskSensitiveValue = (key: string, value: string) => {
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'connectionstring'];
    const isSensitive = sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive)
    );
    
    if (isSensitive && !showSensitive) {
      return '••••••••';
    }
    return value;
  };

  const filterConfigItems = (items: Record<string, any>) => {
    if (!searchTerm) return items;
    
    return Object.entries(items).reduce((filtered, [key, value]) => {
      if (key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase()))) {
        filtered[key] = value;
      }
      return filtered;
    }, {} as Record<string, any>);
  };

  const renderConfigSection = (title: string, items: Record<string, any>) => {
    const filteredItems = filterConfigItems(items);
    
    if (Object.keys(filteredItems).length === 0) return null;

    return (
      <Accordion 
        expanded={expandedSection === title.toLowerCase()} 
        onChange={handleAccordionChange(title.toLowerCase())}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">{title}</Typography>
          <Chip 
            label={Object.keys(filteredItems).length} 
            size="small" 
            sx={{ ml: 2 }} 
          />
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Setting</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(filteredItems).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{key}</TableCell>
                    <TableCell sx={{ 
                      fontFamily: 'monospace',
                      maxWidth: 300,
                      wordBreak: 'break-all'
                    }}>
                      {maskSensitiveValue(key, String(value))}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={typeof value} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configuration Management
      </Typography>

      {/* Configuration Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {Object.keys(sections).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Config Sections
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {validation.validSettings || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Valid Settings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {validation.invalidSettings || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Invalid Settings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {validation.missingSettings || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Missing Settings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search configuration settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={showSensitive ? "contained" : "outlined"}
                  size="small"
                  startIcon={showSensitive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  onClick={() => setShowSensitive(!showSensitive)}
                >
                  {showSensitive ? 'Hide' : 'Show'} Sensitive
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSearchTerm('')}
                  disabled={!searchTerm}
                >
                  Clear Search
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Validation Issues */}
      {validation.issues && validation.issues.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Configuration Issues Found:
          </Typography>
          <List dense>
            {validation.issues.map((issue: any, index: number) => (
              <ListItem key={index} sx={{ py: 0 }}>
                <ListItemText 
                  primary={issue.setting}
                  secondary={issue.message}
                />
                {getValidationIcon(false)}
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Configuration Sections */}
      <Box>
        {Object.entries(sections).map(([sectionName, sectionData]: [string, any]) => (
          renderConfigSection(sectionName, sectionData)
        ))}

        {/* Fallback if no sections */}
        {Object.keys(sections).length === 0 && (
          <Alert severity="info">
            No configuration sections available. This may indicate that the configuration 
            service is not properly initialized or the current user lacks permission to view 
            configuration details.
          </Alert>
        )}
      </Box>

      {/* Configuration Metadata */}
      {config.metadata && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon color="primary" />
              Configuration Metadata
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Configuration Source"
                      secondary={config.metadata.source || 'Unknown'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Last Modified"
                      secondary={
                        config.metadata.lastModified 
                          ? new Date(config.metadata.lastModified).toLocaleString()
                          : 'Unknown'
                      }
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} sm={6}>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Environment"
                      secondary={
                        <Chip
                          label={config.metadata.environment || 'Unknown'}
                          color={
                            config.metadata.environment === 'Production' ? 'error' :
                            config.metadata.environment === 'Development' ? 'warning' : 'default'
                          }
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Config File Path"
                      secondary={config.metadata.configPath || 'Unknown'}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ConfigurationTab;