import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  Settings,
  ExpandMore,
  Info,
  Storage,
  Memory,
  AccountTree,
  Schedule,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  StartEngineRequest,
  StopEngineRequest,
  SystemStatus,
  ProjectConfig,
} from '../../types';

interface ProjectLifecycleProps {
  className?: string;
}

const ProjectLifecycle: React.FC<ProjectLifecycleProps> = ({ className }) => {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState('default-project');
  const [commitMessage, setCommitMessage] = useState('');
  const [config, setConfig] = useState<ProjectConfig>({
    projectId: 'default-project',
    llmConfig: {
      model: 'llama3',
      baseUrl: 'http://host.docker.internal:11434/v1',
    },
    vectorConfig: {
      dimensions: 768,
      distance: 'cosine',
    },
    graphConfig: {
      username: 'neo4j',
      password: 'contextmemory',
      database: 'neo4j',
    },
    ingestionConfig: {
      chunkSize: 1000,
      chunkOverlap: 200,
      autoSummarize: true,
      extractRelationships: true,
    },
  });

  // Query current system status
  const {
    data: statusResponse,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['lifecycle-status', projectId],
    queryFn: () => api.lifecycle.getStatus(projectId),
    refetchInterval: 5000, // Refresh every 5 seconds
    enabled: !!projectId,
  });

  const status = statusResponse?.data?.data;

  // Start engine mutation
  const startMutation = useMutation({
    mutationFn: (request: StartEngineRequest) => api.lifecycle.start(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifecycle-status'] });
    },
  });

  // Stop engine mutation
  const stopMutation = useMutation({
    mutationFn: (request: StopEngineRequest) => api.lifecycle.stop(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifecycle-status'] });
    },
  });

  const handleStart = () => {
    const request: StartEngineRequest = {
      projectId,
      config: config as Record<string, any>,
    };
    startMutation.mutate(request);
  };

  const handleStop = () => {
    const request: StopEngineRequest = {
      projectId,
      commitMessage: commitMessage || undefined,
    };
    stopMutation.mutate(request);
  };

  const updateConfig = (section: keyof ProjectConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const getStatusColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'running':
      case 'started':
        return 'success';
      case 'stopped':
      case 'idle':
        return 'default';
      case 'error':
      case 'failed':
        return 'error';
      case 'starting':
      case 'stopping':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state.toLowerCase()) {
      case 'running':
      case 'started':
        return <CheckCircle color="success" />;
      case 'stopped':
      case 'idle':
        return <Stop color="disabled" />;
      case 'error':
      case 'failed':
        return <Error color="error" />;
      case 'starting':
      case 'stopping':
        return <CircularProgress size={20} />;
      default:
        return <Warning color="warning" />;
    }
  };

  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Box className={className}>
      {/* Project Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Project Lifecycle Management
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Control memory engine lifecycle, project configuration, and state persistence.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                variant="outlined"
                size="small"
                helperText="Unique identifier for this project"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrow />}
                  onClick={handleStart}
                  disabled={startMutation.isPending || status?.state === 'running'}
                >
                  Start Engine
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Stop />}
                  onClick={handleStop}
                  disabled={stopMutation.isPending || status?.state !== 'running'}
                >
                  Stop Engine
                </Button>
                <IconButton onClick={() => refetchStatus()} size="small">
                  <Refresh />
                </IconButton>
              </Box>
            </Grid>
          </Grid>

          {/* Commit Message for Stop */}
          {status?.state === 'running' && (
            <Box mt={2}>
              <TextField
                fullWidth
                label="Commit Message (Optional)"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                variant="outlined"
                size="small"
                helperText="Message for Git commit when stopping the engine"
                multiline
                rows={2}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Status
          </Typography>

          {statusLoading ? (
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={20} />
              <Typography>Loading status...</Typography>
            </Box>
          ) : statusError ? (
            <Alert severity="error">
              Failed to load system status: {statusError.message}
            </Alert>
          ) : status ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                    {getStatusIcon(status.state)}
                    <Typography variant="h6">{status.state}</Typography>
                  </Box>
                  <Chip
                    label={status.state}
                    color={getStatusColor(status.state)}
                    size="small"
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Schedule color="primary" sx={{ mb: 1 }} />
                  <Typography variant="h6">{formatUptime(status.uptime_seconds)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uptime
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Storage color="primary" sx={{ mb: 1 }} />
                  <Typography variant="h6">{status.memory_usage.documents.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Documents
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Memory color="primary" sx={{ mb: 1 }} />
                  <Typography variant="h6">{status.memory_usage.vectors.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vectors
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Service Health
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {Object.entries(status.service_health).map(([service, healthy]) => (
                    <Chip
                      key={service}
                      label={service}
                      color={healthy ? 'success' : 'error'}
                      size="small"
                      icon={healthy ? <CheckCircle /> : <Error />}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">No status available</Typography>
          )}
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Project Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure system settings for the project. Changes will be applied when the engine starts.
          </Typography>

          {/* LLM Configuration */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={1}>
                <Settings />
                <Typography variant="subtitle1">LLM Configuration</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Model"
                    value={config.llmConfig?.model || ''}
                    onChange={(e) => updateConfig('llmConfig', 'model', e.target.value)}
                    size="small"
                    helperText="LLM model name (e.g., llama3, mistral)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Base URL"
                    value={config.llmConfig?.baseUrl || ''}
                    onChange={(e) => updateConfig('llmConfig', 'baseUrl', e.target.value)}
                    size="small"
                    helperText="API base URL for LLM service"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Vector Configuration */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={1}>
                <Memory />
                <Typography variant="subtitle1">Vector Configuration</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Dimensions"
                    type="number"
                    value={config.vectorConfig?.dimensions || 768}
                    onChange={(e) => updateConfig('vectorConfig', 'dimensions', parseInt(e.target.value))}
                    size="small"
                    helperText="Vector embedding dimensions"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Distance Metric</InputLabel>
                    <Select
                      value={config.vectorConfig?.distance || 'cosine'}
                      onChange={(e) => updateConfig('vectorConfig', 'distance', e.target.value)}
                      label="Distance Metric"
                    >
                      <MenuItem value="cosine">Cosine</MenuItem>
                      <MenuItem value="euclidean">Euclidean</MenuItem>
                      <MenuItem value="dot">Dot Product</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Graph Configuration */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={1}>
                <AccountTree />
                <Typography variant="subtitle1">Graph Configuration</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={config.graphConfig?.username || ''}
                    onChange={(e) => updateConfig('graphConfig', 'username', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={config.graphConfig?.password || ''}
                    onChange={(e) => updateConfig('graphConfig', 'password', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Database"
                    value={config.graphConfig?.database || ''}
                    onChange={(e) => updateConfig('graphConfig', 'database', e.target.value)}
                    size="small"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Ingestion Configuration */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={1}>
                <Storage />
                <Typography variant="subtitle1">Ingestion Configuration</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Chunk Size"
                    type="number"
                    value={config.ingestionConfig?.chunkSize || 1000}
                    onChange={(e) => updateConfig('ingestionConfig', 'chunkSize', parseInt(e.target.value))}
                    size="small"
                    helperText="Number of characters per chunk"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Chunk Overlap"
                    type="number"
                    value={config.ingestionConfig?.chunkOverlap || 200}
                    onChange={(e) => updateConfig('ingestionConfig', 'chunkOverlap', parseInt(e.target.value))}
                    size="small"
                    helperText="Character overlap between chunks"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.ingestionConfig?.autoSummarize || false}
                        onChange={(e) => updateConfig('ingestionConfig', 'autoSummarize', e.target.checked)}
                      />
                    }
                    label="Auto Summarize"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.ingestionConfig?.extractRelationships || false}
                        onChange={(e) => updateConfig('ingestionConfig', 'extractRelationships', e.target.checked)}
                      />
                    }
                    label="Extract Relationships"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Operation Status */}
      {(startMutation.isPending || stopMutation.isPending) && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={20} />
            <Typography>
              {startMutation.isPending ? 'Starting engine...' : 'Stopping engine...'}
            </Typography>
          </Box>
        </Alert>
      )}

      {startMutation.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to start engine: {startMutation.error.message}
        </Alert>
      )}

      {stopMutation.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to stop engine: {stopMutation.error.message}
        </Alert>
      )}

      {startMutation.isSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Engine started successfully!
        </Alert>
      )}

      {stopMutation.isSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Engine stopped and state persisted successfully!
        </Alert>
      )}
    </Box>
  );
};

export default ProjectLifecycle;