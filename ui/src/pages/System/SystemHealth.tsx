import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { useDetailedHealth, useSystemDiagnostics } from '@hooks';
import { HealthStatusCard, HealthTrendChart } from '../../components/Dashboard';
import { DiagnosticsPanel } from '../../components/Diagnostics';

const SystemHealth: React.FC = () => {
  const { data: healthData, isLoading: healthLoading, error: healthError } = useDetailedHealth();
  const { data: diagnosticsData, isLoading: diagnosticsLoading } = useSystemDiagnostics();

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
        Real-time health monitoring and comprehensive system diagnostics.
      </Typography>

      <Grid container spacing={3}>
        {/* Enhanced Health Status */}
        <Grid item xs={12} lg={8}>
          <HealthStatusCard
            interval={30000}
            useSSE={true}
            showServices={true}
            showConnectionStatus={true}
          />
        </Grid>

        {/* Quick System Info */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick System Info
              </Typography>
              {diagnosticsLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={24} />
                  <Typography>Loading...</Typography>
                </Box>
              ) : diagnosticsData ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Platform
                    </Typography>
                    <Typography variant="body1">
                      {diagnosticsData.system?.osName || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Architecture
                    </Typography>
                    <Typography variant="body1">
                      {diagnosticsData.system?.architecture || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Memory Usage
                    </Typography>
                    <Typography variant="body1">
                      {diagnosticsData.system?.workingSet 
                        ? (diagnosticsData.system.workingSet / 1024 / 1024).toFixed(0) + ' MB'
                        : 'Unknown'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Process Uptime
                    </Typography>
                    <Typography variant="body1">
                      {diagnosticsData.system?.processUptime 
                        ? Math.floor(diagnosticsData.system.processUptime / 3600000) + ' hours'
                        : 'Unknown'
                      }
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">
                  System information unavailable
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Health Trend Chart */}
        <Grid item xs={12}>
          <HealthTrendChart
            data={[]} // This will be populated by real-time data
            height={300}
            timeRange="1h"
            showResponseTimes={true}
            allowTimeRangeSelection={true}
          />
        </Grid>

        {/* Comprehensive Diagnostics */}
        <Grid item xs={12}>
          <DiagnosticsPanel
            showRefresh={true}
            showDownload={true}
            defaultTab={0}
            autoRefresh={false}
            refreshInterval={60000}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemHealth;