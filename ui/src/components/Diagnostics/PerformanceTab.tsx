import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
} from '@mui/material';
import {
  Speed as PerformanceIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Schedule as TimerIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { formatBytes, formatDuration } from '@utils';

export interface PerformanceTabProps {
  data: any;
  isLoading: boolean;
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading performance information...</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Alert severity="info">
        No performance information available. Check if the diagnostics service is running.
      </Alert>
    );
  }

  const performance = data.performance || {};
  const metrics = performance.metrics || {};
  const resources = performance.resources || {};
  const trends = performance.trends || [];

  const getPerformanceColor = (value: number, thresholds = { good: 70, warning: 85 }) => {
    if (value <= thresholds.good) return 'success';
    if (value <= thresholds.warning) return 'warning';
    return 'error';
  };

  const formatTrendData = (trends: any[]) => {
    return trends.map((point, index) => ({
      ...point,
      time: index,
      formattedTime: new Date(point.timestamp).toLocaleTimeString(),
    }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Performance Analysis
      </Typography>

      {/* Performance Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PerformanceIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  CPU Usage
                </Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {metrics.cpuUsage?.toFixed(1) || 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.cpuUsage || 0}
                color={getPerformanceColor(metrics.cpuUsage || 0)}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {metrics.cpuCores || 0} cores available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MemoryIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Memory Usage
                </Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {metrics.memoryUsage?.toFixed(1) || 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.memoryUsage || 0}
                color={getPerformanceColor(metrics.memoryUsage || 0)}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {formatBytes(metrics.usedMemory || 0)} / {formatBytes(metrics.totalMemory || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Disk Usage
                </Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {metrics.diskUsage?.toFixed(1) || 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.diskUsage || 0}
                color={getPerformanceColor(metrics.diskUsage || 0)}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {formatBytes(metrics.usedDisk || 0)} / {formatBytes(metrics.totalDisk || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimerIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Response Time
                </Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {metrics.averageResponseTime || 0}ms
              </Typography>
              <Chip
                label={
                  metrics.averageResponseTime < 100 ? 'Excellent' :
                  metrics.averageResponseTime < 500 ? 'Good' :
                  metrics.averageResponseTime < 1000 ? 'Fair' : 'Poor'
                }
                color={
                  metrics.averageResponseTime < 100 ? 'success' :
                  metrics.averageResponseTime < 500 ? 'success' :
                  metrics.averageResponseTime < 1000 ? 'warning' : 'error'
                }
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Trends */}
      {trends.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon color="primary" />
                  CPU & Memory Trends
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={formatTrendData(trends)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedTime" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="cpuUsage"
                      stroke="#f44336"
                      strokeWidth={2}
                      name="CPU Usage (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="memoryUsage"
                      stroke="#2196f3"
                      strokeWidth={2}
                      name="Memory Usage (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimerIcon color="primary" />
                  Response Time Trends
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={formatTrendData(trends)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedTime" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#ff9800"
                      fill="#ff9800"
                      fillOpacity={0.3}
                      name="Response Time (ms)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Resource Details */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Resources
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Process Working Set"
                    secondary={formatBytes(resources.workingSet || 0)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Private Memory"
                    secondary={formatBytes(resources.privateMemory || 0)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Virtual Memory"
                    secondary={formatBytes(resources.virtualMemory || 0)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="GC Memory"
                    secondary={formatBytes(resources.gcMemory || 0)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Thread Count"
                    secondary={resources.threadCount || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Handle Count"
                    secondary={resources.handleCount || 0}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Performance
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Total Requests"
                    secondary={metrics.totalRequests || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Requests per Second"
                    secondary={metrics.requestsPerSecond?.toFixed(2) || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Error Rate"
                    secondary={`${(metrics.errorRate || 0).toFixed(2)}%`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Cache Hit Rate"
                    secondary={`${(metrics.cacheHitRate || 0).toFixed(2)}%`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Database Connections"
                    secondary={metrics.databaseConnections || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Uptime"
                    secondary={formatDuration(metrics.uptime || 0)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Garbage Collection Stats */}
        {metrics.gcStats && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Garbage Collection Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {metrics.gcStats.gen0Collections || 0}
                      </Typography>
                      <Typography variant="caption">Gen 0 Collections</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {metrics.gcStats.gen1Collections || 0}
                      </Typography>
                      <Typography variant="caption">Gen 1 Collections</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {metrics.gcStats.gen2Collections || 0}
                      </Typography>
                      <Typography variant="caption">Gen 2 Collections</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {formatBytes(metrics.gcStats.totalMemory || 0)}
                      </Typography>
                      <Typography variant="caption">GC Total Memory</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Performance Alerts */}
      {performance.alerts && performance.alerts.length > 0 && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Performance Alerts:
          </Typography>
          <List dense>
            {performance.alerts.map((alert: any, index: number) => (
              <ListItem key={index} sx={{ py: 0 }}>
                <ListItemText
                  primary={alert.message}
                  secondary={alert.timestamp ? new Date(alert.timestamp).toLocaleString() : ''}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}
    </Box>
  );
};

export default PerformanceTab;