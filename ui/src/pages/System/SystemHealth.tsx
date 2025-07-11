import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useDetailedHealth, useSystemDiagnostics } from '@hooks';

const SystemHealth: React.FC = () => {
  const { data: healthData, isLoading: healthLoading, error: healthError } = useDetailedHealth();
  const { data: diagnosticsData, isLoading: diagnosticsLoading } = useSystemDiagnostics();

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return <CheckCircleIcon color="success" />;
      case 'degraded': return <WarningIcon color="warning" />;
      case 'unhealthy': return <ErrorIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return 'success' as const;
      case 'degraded': return 'warning' as const;
      case 'unhealthy': return 'error' as const;
      default: return 'default' as const;
    }
  };

  if (healthError) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          System Health
        </Typography>
        <Alert severity="error">
          Failed to load health data: {healthError.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        System Health
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Monitor the health and status of all system components.
      </Typography>

      <Grid container spacing={3}>
        {/* Overall Health */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall System Health
              </Typography>
              {healthLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={24} />
                  <Typography>Loading health data...</Typography>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {getStatusIcon(healthData?.status)}
                    <Typography variant="h5">
                      {healthData?.status || 'Unknown'}
                    </Typography>
                    <Chip 
                      label={`${healthData?.healthScore || 0}%`}
                      color={getStatusColor(healthData?.status)}
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Health Score: {healthData?.healthScore || 0}% | 
                    Trend: {healthData?.trend || 'Unknown'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Service Dependencies */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Dependencies
              </Typography>
              {healthLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={24} />
                  <Typography>Loading dependencies...</Typography>
                </Box>
              ) : (
                <List>
                  {Object.entries(healthData?.dependencies || {}).map(([service, details]: [string, any]) => (
                    <ListItem key={service} divider>
                      <ListItemIcon>
                        {getStatusIcon(details.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={service.charAt(0).toUpperCase() + service.slice(1)}
                        secondary={`Response time: ${details.responseTime || 0}ms`}
                      />
                      <Chip
                        label={details.status}
                        color={getStatusColor(details.status)}
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              {diagnosticsLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={24} />
                  <Typography>Loading system information...</Typography>
                </Box>
              ) : diagnosticsData ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Platform
                    </Typography>
                    <Typography variant="body1">
                      {diagnosticsData.systemInfo?.platform || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Architecture
                    </Typography>
                    <Typography variant="body1">
                      {diagnosticsData.systemInfo?.architecture || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Memory
                    </Typography>
                    <Typography variant="body1">
                      {diagnosticsData.systemInfo?.totalMemory 
                        ? (diagnosticsData.systemInfo.totalMemory / 1024 / 1024 / 1024).toFixed(2) + ' GB'
                        : 'Unknown'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Uptime
                    </Typography>
                    <Typography variant="body1">
                      {diagnosticsData.systemInfo?.uptime 
                        ? Math.floor(diagnosticsData.systemInfo.uptime / 3600) + ' hours'
                        : 'Unknown'
                      }
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">
                  Detailed system diagnostics will be available in Phase 7.2.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemHealth;