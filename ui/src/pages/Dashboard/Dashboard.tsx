import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from '@mui/material';
import {
  Favorite as HealthIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useDetailedHealth, useSystemMetrics, useSystemDiagnostics } from '@hooks';
import { getStatusColor, formatBytes, formatDuration } from '@utils';

const Dashboard: React.FC = () => {
  const { data: healthData, isLoading: healthLoading, error: healthError } = useDetailedHealth();
  const { data: metricsData, isLoading: metricsLoading } = useSystemMetrics();
  const { data: diagnosticsData, isLoading: diagnosticsLoading } = useSystemDiagnostics();

  // Mock data for development
  const mockHealth = {
    status: 'healthy',
    healthScore: 85,
    trend: 'stable',
    dependencies: {
      qdrant: { status: 'healthy', responseTime: 12 },
      neo4j: { status: 'healthy', responseTime: 8 },
      ollama: { status: 'healthy', responseTime: 45 }
    }
  };

  const mockMetrics = {
    api: {
      totalRequests: 1247,
      successfulRequests: 1198,
      failedRequests: 49,
      averageResponseTime: 156
    },
    memory: {
      totalDocuments: 342,
      totalChunks: 1528,
      vectorStoreSize: 45672819,
      graphStoreSize: 2847291
    },
    performance: {
      cpuUsage: 23.4,
      memoryUsage: 67.8,
      diskUsage: 34.2
    }
  };

  const health = healthData || mockHealth;
  const metrics = metricsData || mockMetrics;

  const getHealthIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return <CheckCircleIcon color="success" />;
      case 'degraded': return <WarningIcon color="warning" />;
      case 'unhealthy': return <ErrorIcon color="error" />;
      default: return <HealthIcon />;
    }
  };

  if (healthError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load dashboard data. Please check your connection to the API.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          System Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time overview of your Context Memory Store system
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* System Health Summary */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {getHealthIcon(health.status)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  System Health
                </Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {health.healthScore || 0}%
              </Typography>
              <Chip 
                label={health.status || 'Unknown'} 
                color={health.status === 'healthy' ? 'success' : 'warning'}
                size="small"
              />
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={health.healthScore || 0} 
                  color={health.status === 'healthy' ? 'success' : 'warning'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* API Performance */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  API Performance
                </Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {metrics.api?.averageResponseTime || 0}ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average response time
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Success rate: {metrics.api ? ((metrics.api.successfulRequests / metrics.api.totalRequests) * 100).toFixed(1) : 0}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Usage */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MemoryIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Documents
                </Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {metrics.memory?.totalDocuments || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total documents stored
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {metrics.memory?.totalChunks || 0} chunks processed
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Storage Usage */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Storage
                </Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {formatBytes((metrics.memory?.vectorStoreSize || 0) + (metrics.memory?.graphStoreSize || 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total storage used
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Vector: {formatBytes(metrics.memory?.vectorStoreSize || 0)} | 
                  Graph: {formatBytes(metrics.memory?.graphStoreSize || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Service Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Status
              </Typography>
              <List>
                {Object.entries(health.dependencies || {}).map(([service, details]: [string, any]) => (
                  <ListItem key={service} divider>
                    <ListItemIcon>
                      {getHealthIcon(details.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={service.charAt(0).toUpperCase() + service.slice(1)}
                      secondary={`Response time: ${details.responseTime || 0}ms`}
                    />
                    <Chip
                      label={details.status}
                      color={details.status === 'healthy' ? 'success' : 'warning'}
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Resources */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Resources
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">CPU Usage</Typography>
                  <Typography variant="body2">{metrics.performance?.cpuUsage || 0}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={metrics.performance?.cpuUsage || 0} 
                  color={metrics.performance?.cpuUsage > 80 ? 'error' : 'primary'}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Memory Usage</Typography>
                  <Typography variant="body2">{metrics.performance?.memoryUsage || 0}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={metrics.performance?.memoryUsage || 0}
                  color={metrics.performance?.memoryUsage > 80 ? 'error' : 'primary'}
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Disk Usage</Typography>
                  <Typography variant="body2">{metrics.performance?.diskUsage || 0}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={metrics.performance?.diskUsage || 0}
                  color={metrics.performance?.diskUsage > 80 ? 'error' : 'primary'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity Placeholder */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Activity monitoring will be implemented in future phases.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;