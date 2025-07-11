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
import { useDetailedHealth, useSystemMetrics, useSystemDiagnostics, useRealtimeHealth, useRealtimeMetrics } from '@hooks';
import { getStatusColor, formatBytes, formatDuration } from '@utils';
import HealthStatusCard from '../../components/Dashboard/HealthStatusCard';
import HealthTrendChart from '../../components/Dashboard/HealthTrendChart';
import ServiceStatusPanel from '../../components/Dashboard/ServiceStatusPanel';
import MetricsChartCard from '../../components/Dashboard/MetricsChartCard';

const Dashboard: React.FC = () => {
  // Original API hooks for fallback data
  const { data: healthData, isLoading: healthLoading, error: healthError } = useDetailedHealth();
  const { data: metricsData, isLoading: metricsLoading } = useSystemMetrics();
  const { data: diagnosticsData, isLoading: diagnosticsLoading } = useSystemDiagnostics();

  // Real-time hooks for live updates
  const { 
    healthData: realtimeHealth, 
    healthHistory, 
    connectionInfo,
    isConnected: healthConnected 
  } = useRealtimeHealth(30000, true);
  
  const { 
    metricsData: realtimeMetrics, 
    metricsHistory,
    isConnected: metricsConnected 
  } = useRealtimeMetrics(10000);

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

  // Use real-time data if available, fallback to API data, then mock data
  const health = realtimeHealth || healthData || mockHealth;
  const metrics = realtimeMetrics || metricsData || mockMetrics;

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
        {/* Enhanced Health Status Card */}
        <Grid item xs={12} md={6} lg={4}>
          <HealthStatusCard
            interval={30000}
            useSSE={true}
            showServices={true}
            showConnectionStatus={true}
          />
        </Grid>

        {/* API Performance */}
        <Grid item xs={12} md={6} lg={4}>
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

        {/* Storage & Documents */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Storage & Documents
                </Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {metrics.memory?.totalDocuments || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total documents stored
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Storage: {formatBytes((metrics.memory?.vectorStoreSize || 0) + (metrics.memory?.graphStoreSize || 0))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {metrics.memory?.totalChunks || 0} chunks • 
                  Vector: {formatBytes(metrics.memory?.vectorStoreSize || 0)} • 
                  Graph: {formatBytes(metrics.memory?.graphStoreSize || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Health Trend Chart */}
        <Grid item xs={12} md={6} lg={8}>
          <HealthTrendChart
            data={healthHistory}
            height={300}
            timeRange="1h"
            showResponseTimes={true}
            allowTimeRangeSelection={true}
          />
        </Grid>

        {/* Enhanced Service Status */}
        <Grid item xs={12} md={6} lg={4}>
          <ServiceStatusPanel
            dependencies={health.dependencies || {}}
            healthScore={health.healthScore}
            showDetails={true}
            showResponseTimeTrends={true}
          />
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

        {/* Metrics Visualization */}
        <Grid item xs={12}>
          <MetricsChartCard
            data={metricsHistory}
            height={350}
            defaultTimeRange="6h"
            defaultCategory="overview"
            chartType="line"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;