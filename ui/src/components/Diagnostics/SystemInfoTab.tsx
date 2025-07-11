import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  Alert,
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Schedule as UptimeIcon,
  Build as VersionIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { formatBytes, formatDuration } from '@utils';

export interface SystemInfoTabProps {
  data: any;
  isLoading: boolean;
}

const SystemInfoTab: React.FC<SystemInfoTabProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading system information...</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Alert severity="info">
        No system information available. Check if the diagnostics service is running.
      </Alert>
    );
  }

  const systemInfo = data.system || {};
  const runtimeInfo = data.runtime || {};
  const environmentInfo = data.environment || {};

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        System Information
      </Typography>

      <Grid container spacing={3}>
        {/* Basic System Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ComputerIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  System Details
                </Typography>
              </Box>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Operating System"
                    secondary={`${systemInfo.osName || 'Unknown'} ${systemInfo.osVersion || ''}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Architecture"
                    secondary={systemInfo.architecture || 'Unknown'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Machine Name"
                    secondary={systemInfo.machineName || 'Unknown'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="User Name"
                    secondary={systemInfo.userName || 'Unknown'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Processor Count"
                    secondary={`${systemInfo.processorCount || 0} cores`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Runtime Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VersionIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Runtime Information
                </Typography>
              </Box>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary=".NET Version"
                    secondary={runtimeInfo.dotnetVersion || 'Unknown'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Runtime Version"
                    secondary={runtimeInfo.runtimeVersion || 'Unknown'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Application Version"
                    secondary={runtimeInfo.applicationVersion || 'Unknown'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Build Configuration"
                    secondary={
                      <Chip
                        label={runtimeInfo.buildConfiguration || 'Unknown'}
                        size="small"
                        color={runtimeInfo.buildConfiguration === 'Release' ? 'success' : 'warning'}
                      />
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Process ID"
                    secondary={runtimeInfo.processId || 'Unknown'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MemoryIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Memory Usage
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Working Set</Typography>
                  <Typography variant="body2">
                    {formatBytes(systemInfo.workingSet || 0)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (systemInfo.workingSet || 0) / (1024 * 1024 * 100))} // Assume 100MB as max for visualization
                  color="primary"
                />
              </Box>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Private Memory"
                    secondary={formatBytes(systemInfo.privateMemory || 0)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Virtual Memory"
                    secondary={formatBytes(systemInfo.virtualMemory || 0)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="GC Memory"
                    secondary={formatBytes(systemInfo.gcMemory || 0)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Uptime and Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <UptimeIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Uptime & Performance
                </Typography>
              </Box>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary="System Uptime"
                    secondary={formatDuration(systemInfo.systemUptime || 0)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Process Uptime"
                    secondary={formatDuration(systemInfo.processUptime || 0)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="CPU Time"
                    secondary={formatDuration(systemInfo.totalProcessorTime || 0)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Thread Count"
                    secondary={systemInfo.threadCount || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Handle Count"
                    secondary={systemInfo.handleCount || 0}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Environment Variables */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InfoIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Environment Information
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Current Directory
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      {environmentInfo.currentDirectory || 'Unknown'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Base Directory
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      {environmentInfo.baseDirectory || 'Unknown'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Environment
                    </Typography>
                    <Chip
                      label={environmentInfo.environmentName || 'Unknown'}
                      color={
                        environmentInfo.environmentName === 'Production' ? 'error' :
                        environmentInfo.environmentName === 'Development' ? 'warning' : 'default'
                      }
                      size="small"
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Command Line
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      {environmentInfo.commandLine || 'Unknown'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Time Zone
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {environmentInfo.timeZone || 'Unknown'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      System Time
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {environmentInfo.systemTime ? new Date(environmentInfo.systemTime).toLocaleString() : 'Unknown'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemInfoTab;