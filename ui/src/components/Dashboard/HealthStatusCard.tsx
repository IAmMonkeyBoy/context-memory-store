import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as HealthyIcon,
  Warning as DegradedIcon,
  Error as UnhealthyIcon,
  SignalWifiOff as DisconnectedIcon,
  Wifi as ConnectedIcon,
  Pending as ConnectingIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useRealtimeHealth } from '@hooks';
import { getStatusColor } from '@utils';

export interface HealthStatusCardProps {
  /** Polling interval in milliseconds */
  interval?: number;
  /** Whether to use SSE or polling only */
  useSSE?: boolean;
  /** Whether to show detailed service status */
  showServices?: boolean;
  /** Whether to show connection status */
  showConnectionStatus?: boolean;
}

const HealthStatusCard: React.FC<HealthStatusCardProps> = ({
  interval = 30000,
  useSSE = true,
  showServices = true,
  showConnectionStatus = true,
}) => {
  const {
    healthData,
    lastUpdate,
    connectionInfo,
    isPolling,
    retrySSE,
    isConnected,
  } = useRealtimeHealth(interval, useSSE);

  const getHealthIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return <HealthyIcon color="success" />;
      case 'degraded':
        return <DegradedIcon color="warning" />;
      case 'unhealthy':
        return <UnhealthyIcon color="error" />;
      default:
        return <UnhealthyIcon color="disabled" />;
    }
  };

  const getConnectionIcon = () => {
    if (!useSSE) return null;
    
    switch (connectionInfo.status) {
      case 'connected':
        return <ConnectedIcon color="success" fontSize="small" />;
      case 'connecting':
      case 'reconnecting':
        return <ConnectingIcon color="warning" fontSize="small" />;
      case 'disconnected':
      case 'error':
      case 'max_attempts_reached':
        return <DisconnectedIcon color="error" fontSize="small" />;
      default:
        return <DisconnectedIcon color="disabled" fontSize="small" />;
    }
  };

  const getConnectionStatusText = () => {
    if (isPolling) return 'Polling';
    if (!useSSE) return 'Polling mode';
    
    switch (connectionInfo.status) {
      case 'connected':
        return 'Live updates';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return `Reconnecting... (${connectionInfo.reconnectAttempts})`;
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection error';
      case 'max_attempts_reached':
        return 'Connection failed';
      default:
        return 'Unknown status';
    }
  };

  const healthScore = healthData?.healthScore || 0;
  const overallStatus = healthData?.status || 'unknown';
  const dependencies = healthData?.dependencies || {};

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getHealthIcon(overallStatus)}
            <Typography variant="h6">System Health</Typography>
            {showConnectionStatus && (
              <Tooltip title={getConnectionStatusText()}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getConnectionIcon()}
                </Box>
              </Tooltip>
            )}
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {connectionInfo.status === 'max_attempts_reached' && (
              <Tooltip title="Retry SSE connection">
                <IconButton onClick={retrySSE} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
            {lastUpdate && (
              <Tooltip title={`Last updated: ${lastUpdate.toLocaleString()}`}>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(lastUpdate, { addSuffix: true })}
                </Typography>
              </Tooltip>
            )}
          </Box>
        }
      />
      
      <CardContent>
        {/* Health Score */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h4" color="primary">
              {healthScore}%
            </Typography>
            <Chip 
              label={overallStatus} 
              color={getStatusColor(overallStatus)}
              size="small"
            />
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={healthScore} 
            color={getStatusColor(overallStatus)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Connection Status */}
        {showConnectionStatus && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Connection Status: {getConnectionStatusText()}
            </Typography>
            
            {connectionInfo.error && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {connectionInfo.error}
              </Alert>
            )}
            
            {isPolling && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Using polling mode (updates every {interval / 1000}s)
              </Alert>
            )}
          </Box>
        )}

        {/* Service Status */}
        {showServices && Object.keys(dependencies).length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Services
            </Typography>
            <List dense>
              {Object.entries(dependencies).map(([service, details]: [string, any]) => (
                <ListItem key={service}>
                  <ListItemIcon>
                    {getHealthIcon(details.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={service.charAt(0).toUpperCase() + service.slice(1)}
                    secondary={
                      details.responseTime !== undefined 
                        ? `${details.responseTime}ms` 
                        : 'Response time unavailable'
                    }
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
          </Box>
        )}

        {/* Loading State */}
        {!healthData && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthStatusCard;