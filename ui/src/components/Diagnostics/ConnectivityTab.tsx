import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  NetworkCheck as NetworkIcon,
  Storage as QdrantIcon,
  AccountTree as Neo4jIcon,
  Psychology as OllamaIcon,
  CheckCircle as ConnectedIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { getStatusColor } from '@utils';

export interface ConnectivityTabProps {
  data: any;
  isLoading: boolean;
}

const ConnectivityTab: React.FC<ConnectivityTabProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading connectivity information...</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Alert severity="info">
        No connectivity information available. Check if the diagnostics service is running.
      </Alert>
    );
  }

  const connectivity = data.connectivity || {};
  const services = connectivity.services || {};
  const networkInfo = connectivity.network || {};
  const endpoints = connectivity.endpoints || [];

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'qdrant':
        return <QdrantIcon />;
      case 'neo4j':
        return <Neo4jIcon />;
      case 'ollama':
        return <OllamaIcon />;
      default:
        return <NetworkIcon />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'connected':
      case 'healthy':
        return <ConnectedIcon color="success" />;
      case 'degraded':
        return <WarningIcon color="warning" />;
      case 'disconnected':
      case 'error':
      case 'unhealthy':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Connectivity Status
      </Typography>

      <Grid container spacing={3}>
        {/* Service Connectivity Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NetworkIcon color="primary" />
                Service Connectivity
              </Typography>

              <Grid container spacing={2}>
                {Object.entries(services).map(([serviceName, serviceInfo]: [string, any]) => (
                  <Grid item xs={12} sm={6} md={4} key={serviceName}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getServiceIcon(serviceName)}
                        <Typography variant="subtitle1" sx={{ ml: 1, flexGrow: 1 }}>
                          {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}
                        </Typography>
                        {getStatusIcon(serviceInfo.status)}
                      </Box>
                      
                      <Chip
                        label={serviceInfo.status || 'Unknown'}
                        color={getStatusColor(serviceInfo.status)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Endpoint: {serviceInfo.endpoint || 'Unknown'}
                      </Typography>
                      
                      {serviceInfo.responseTime !== undefined && (
                        <Typography variant="body2" color="text.secondary">
                          Response Time: {serviceInfo.responseTime}ms
                        </Typography>
                      )}
                      
                      {serviceInfo.version && (
                        <Typography variant="body2" color="text.secondary">
                          Version: {serviceInfo.version}
                        </Typography>
                      )}
                      
                      {serviceInfo.lastChecked && (
                        <Typography variant="caption" color="text.secondary">
                          Last checked: {new Date(serviceInfo.lastChecked).toLocaleString()}
                        </Typography>
                      )}
                      
                      {serviceInfo.error && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {serviceInfo.error}
                        </Alert>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Network Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon color="primary" />
                Network Information
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Host Name"
                    secondary={networkInfo.hostName || 'Unknown'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Domain Name"
                    secondary={networkInfo.domainName || 'Unknown'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="IP Addresses"
                    secondary={
                      networkInfo.ipAddresses?.length > 0
                        ? networkInfo.ipAddresses.join(', ')
                        : 'Unknown'
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Network Available"
                    secondary={
                      <Chip
                        label={networkInfo.isNetworkAvailable ? 'Yes' : 'No'}
                        color={networkInfo.isNetworkAvailable ? 'success' : 'error'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Internet Connected"
                    secondary={
                      <Chip
                        label={networkInfo.hasInternetConnection ? 'Yes' : 'No'}
                        color={networkInfo.hasInternetConnection ? 'success' : 'warning'}
                        size="small"
                      />
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Connection Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NetworkIcon color="primary" />
                Connection Summary
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Overall Connectivity Health
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={connectivity.healthScore || 0}
                  color={connectivity.healthScore > 80 ? 'success' : connectivity.healthScore > 60 ? 'warning' : 'error'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {connectivity.healthScore || 0}% of services are healthy
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1, textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">
                      {connectivity.connectedServices || 0}
                    </Typography>
                    <Typography variant="caption">Connected</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1, textAlign: 'center' }}>
                    <Typography variant="h6" color="error.main">
                      {connectivity.disconnectedServices || 0}
                    </Typography>
                    <Typography variant="caption">Disconnected</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Endpoint Details Table */}
        {endpoints.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Endpoint Details
                </Typography>

                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Endpoint</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Response Time</TableCell>
                        <TableCell>Last Check</TableCell>
                        <TableCell>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {endpoints.map((endpoint: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getServiceIcon(endpoint.service)}
                              {endpoint.service}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200, wordBreak: 'break-all' }}>
                            {endpoint.url}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={endpoint.status}
                              color={getStatusColor(endpoint.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {endpoint.responseTime !== undefined
                              ? `${endpoint.responseTime}ms`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {endpoint.lastChecked
                              ? new Date(endpoint.lastChecked).toLocaleTimeString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 300 }}>
                            {endpoint.error && (
                              <Typography variant="caption" color="error">
                                {endpoint.error}
                              </Typography>
                            )}
                            {endpoint.version && (
                              <Typography variant="caption" color="text.secondary">
                                v{endpoint.version}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Connection Issues */}
        {connectivity.issues && connectivity.issues.length > 0 && (
          <Grid item xs={12}>
            <Alert severity="warning">
              <Typography variant="subtitle2" gutterBottom>
                Connection Issues Detected:
              </Typography>
              <List dense>
                {connectivity.issues.map((issue: string, index: number) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemText primary={issue} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ConnectivityTab;