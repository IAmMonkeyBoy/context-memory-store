import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Alert,
  Grid,
  Paper,
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Warning as DegradedIcon,
  Error as UnhealthyIcon,
  Storage as QdrantIcon,
  AccountTree as Neo4jIcon,
  Psychology as OllamaIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { getStatusColor } from '@utils';

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck?: Date;
  details?: {
    version?: string;
    endpoint?: string;
    error?: string;
  };
}

export interface ServiceDependencies {
  qdrant: ServiceStatus;
  neo4j: ServiceStatus;
  ollama: ServiceStatus;
}

export interface ServiceStatusPanelProps {
  /** Service dependency data */
  dependencies: Partial<ServiceDependencies>;
  /** Overall system health score */
  healthScore?: number;
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Whether to show response time trends */
  showResponseTimeTrends?: boolean;
}

const ServiceStatusPanel: React.FC<ServiceStatusPanelProps> = ({
  dependencies,
  healthScore,
  showDetails = true,
  showResponseTimeTrends = false,
}) => {
  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'qdrant':
        return <QdrantIcon />;
      case 'neo4j':
        return <Neo4jIcon />;
      case 'ollama':
        return <OllamaIcon />;
      default:
        return <HealthyIcon />;
    }
  };

  const getStatusIcon = (status: string) => {
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

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime <= 100) return 'success';
    if (responseTime <= 500) return 'warning';
    return 'error';
  };

  const getResponseTimePercentage = (responseTime: number) => {
    // Map response time to percentage (0-100) for progress bar
    // 0ms = 100%, 1000ms = 0%
    return Math.max(0, Math.min(100, 100 - (responseTime / 10)));
  };

  const serviceDetails = [
    {
      name: 'Qdrant',
      key: 'qdrant',
      description: 'Vector Database',
      defaultPort: '6333',
    },
    {
      name: 'Neo4j',
      key: 'neo4j',
      description: 'Graph Database',
      defaultPort: '7474',
    },
    {
      name: 'Ollama',
      key: 'ollama',
      description: 'LLM Service',
      defaultPort: '11434',
    },
  ];

  const healthyServices = Object.values(dependencies).filter(
    service => service?.status === 'healthy'
  ).length;
  const totalServices = Object.keys(dependencies).length;

  return (
    <Card>
      <CardHeader
        title="Service Status"
        subheader={
          totalServices > 0 
            ? `${healthyServices}/${totalServices} services healthy`
            : 'No services monitored'
        }
      />
      
      <CardContent>
        {/* Overall Health Score */}
        {healthScore !== undefined && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Overall Health</Typography>
              <Typography variant="body2" fontWeight="bold">{healthScore}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={healthScore} 
              color={getStatusColor(healthScore > 80 ? 'healthy' : healthScore > 60 ? 'degraded' : 'unhealthy')}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* Service List */}
        <List>
          {serviceDetails.map(({ name, key, description, defaultPort }) => {
            const service = dependencies[key as keyof ServiceDependencies];
            
            if (!service) {
              return (
                <ListItem key={key} divider>
                  <ListItemIcon>
                    {getServiceIcon(name)}
                  </ListItemIcon>
                  <ListItemText
                    primary={name}
                    secondary={`${description} - Not monitored`}
                  />
                  <Chip
                    label="Unknown"
                    color="default"
                    size="small"
                    variant="outlined"
                  />
                </ListItem>
              );
            }

            return (
              <ListItem key={key} divider>
                <ListItemIcon>
                  {getStatusIcon(service.status)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">{name}</Typography>
                      {service.details?.version && (
                        <Chip
                          label={service.details.version}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {description}
                        {service.details?.endpoint && ` • ${service.details.endpoint}`}
                      </Typography>
                      {service.responseTime !== undefined && (
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Response time: {service.responseTime}ms
                          </Typography>
                          {showResponseTimeTrends && (
                            <LinearProgress
                              variant="determinate"
                              value={getResponseTimePercentage(service.responseTime)}
                              color={getResponseTimeColor(service.responseTime)}
                              sx={{ height: 4, mt: 0.5, borderRadius: 2 }}
                            />
                          )}
                        </Box>
                      )}
                      {service.lastCheck && (
                        <Typography variant="caption" color="text.secondary">
                          Last checked: {formatDistanceToNow(service.lastCheck, { addSuffix: true })}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={service.status}
                    color={getStatusColor(service.status)}
                    size="small"
                    variant="outlined"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>

        {/* Error Details */}
        {showDetails && (
          <Box sx={{ mt: 2 }}>
            {Object.entries(dependencies).map(([serviceName, service]) => {
              if (service?.details?.error) {
                return (
                  <Alert key={serviceName} severity="error" sx={{ mb: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Error:
                    </Typography>
                    <Typography variant="body2">
                      {service.details.error}
                    </Typography>
                  </Alert>
                );
              }
              return null;
            })}
          </Box>
        )}

        {/* Service Stats Summary */}
        {showDetails && totalServices > 0 && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">
                    {healthyServices}
                  </Typography>
                  <Typography variant="caption">Healthy</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="h6" color="warning.main">
                    {Object.values(dependencies).filter(s => s?.status === 'degraded').length}
                  </Typography>
                  <Typography variant="caption">Degraded</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="h6" color="error.main">
                    {Object.values(dependencies).filter(s => s?.status === 'unhealthy').length}
                  </Typography>
                  <Typography variant="caption">Unhealthy</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceStatusPanel;