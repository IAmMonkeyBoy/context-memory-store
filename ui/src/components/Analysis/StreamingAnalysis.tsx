import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Slider,
  Grid,
  Stack,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Analytics as AnalyticsIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Clear as ClearIcon,
  Timeline as TimelineIcon,
  AccountTree as RelationshipIcon,
  Description as DocumentIcon,
  Insights as InsightIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { config } from '../../utils';

export interface StreamingEvent {
  type: 'status' | 'analysis' | 'metadata' | 'error' | 'done';
  data: string;
  timestamp: Date;
}

export interface AnalysisMetadata {
  documents_analyzed: number;
  relationships_found: number;
  processing_time_ms: number;
  total_analysis_chunks: number;
}

export interface StreamingAnalysisProps {
  initialQuery?: string;
  onAnalysisComplete?: (analysis: string, metadata: AnalysisMetadata) => void;
  onError?: (error: string) => void;
}

const StreamingAnalysis: React.FC<StreamingAnalysisProps> = ({
  initialQuery = '',
  onAnalysisComplete,
  onError,
}) => {
  // State management
  const [query, setQuery] = useState(initialQuery);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [events, setEvents] = useState<StreamingEvent[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [metadata, setMetadata] = useState<AnalysisMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  
  // Options
  const [maxDocuments, setMaxDocuments] = useState(5);
  const [includeRelationships, setIncludeRelationships] = useState(true);
  
  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<Date | null>(null);
  
  // Auto-scroll to bottom of analysis
  useEffect(() => {
    if (analysisRef.current) {
      analysisRef.current.scrollTop = analysisRef.current.scrollHeight;
    }
  }, [currentAnalysis]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);
  
  const addEvent = useCallback((type: StreamingEvent['type'], data: string) => {
    const event: StreamingEvent = {
      type,
      data,
      timestamp: new Date(),
    };
    
    setEvents(prev => [...prev, event]);
    
    switch (type) {
      case 'status':
        setStatus(data);
        break;
      case 'analysis':
        if (!isPaused) {
          setCurrentAnalysis(prev => prev + data);
        }
        break;
      case 'metadata':
        try {
          const meta = JSON.parse(data) as AnalysisMetadata;
          setMetadata(meta);
        } catch (e) {
          console.warn('Failed to parse metadata:', data);
        }
        break;
      case 'error':
        setError(data);
        onError?.(data);
        break;
      case 'done':
        setIsStreaming(false);
        setStatus('Analysis completed');
        if (currentAnalysis && metadata) {
          onAnalysisComplete?.(currentAnalysis, metadata);
        }
        break;
    }
  }, [currentAnalysis, metadata, onAnalysisComplete, onError, isPaused]);
  
  const startStreaming = useCallback(async () => {
    if (!query.trim()) {
      setError('Please enter a query to analyze');
      return;
    }
    
    // Reset state
    setEvents([]);
    setCurrentAnalysis('');
    setStatus('');
    setMetadata(null);
    setError(null);
    setProgress(0);
    setIsStreaming(true);
    startTimeRef.current = new Date();
    
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        q: query,
        limit: maxDocuments.toString(),
        includeRelationships: includeRelationships.toString(),
      });
      
      const url = `${config.apiBaseUrl}/memory/analyze-stream?${params}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('SSE connection opened');
        addEvent('status', 'Connected to streaming service');
      };
      
      eventSource.addEventListener('status', (event) => {
        addEvent('status', event.data);
        // Update progress based on status
        if (event.data.includes('Starting')) setProgress(10);
        else if (event.data.includes('Found')) setProgress(30);
        else if (event.data.includes('Generating')) setProgress(50);
        else if (event.data.includes('complete')) setProgress(100);
      });
      
      eventSource.addEventListener('analysis', (event) => {
        addEvent('analysis', event.data);
        setProgress(prev => Math.min(prev + 2, 95));
      });
      
      eventSource.addEventListener('metadata', (event) => {
        addEvent('metadata', event.data);
      });
      
      eventSource.addEventListener('error', (event) => {
        addEvent('error', event.data);
      });
      
      eventSource.addEventListener('done', (event) => {
        addEvent('done', event.data);
        setProgress(100);
        eventSource.close();
      });
      
      eventSource.onerror = (event) => {
        console.error('SSE error:', event);
        setError('Connection error occurred');
        setIsStreaming(false);
        eventSource.close();
      };
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start streaming analysis');
      setIsStreaming(false);
    }
  }, [query, maxDocuments, includeRelationships, addEvent]);
  
  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
    addEvent('status', 'Analysis stopped by user');
  }, [addEvent]);
  
  const clearAnalysis = useCallback(() => {
    setEvents([]);
    setCurrentAnalysis('');
    setStatus('');
    setMetadata(null);
    setError(null);
    setProgress(0);
  }, []);
  
  const exportAnalysis = useCallback(() => {
    const analysisData = {
      query,
      analysis: currentAnalysis,
      metadata,
      events: events.map(e => ({
        ...e,
        timestamp: e.timestamp.toISOString(),
      })),
      options: {
        maxDocuments,
        includeRelationships,
      },
      exportTime: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streaming-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [query, currentAnalysis, metadata, events, maxDocuments, includeRelationships]);
  
  const elapsedTime = startTimeRef.current 
    ? formatDistanceToNow(startTimeRef.current, { includeSeconds: true })
    : null;

  return (
    <Box>
      {/* Query Interface */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Real-time Streaming Analysis
          </Typography>
          
          <Stack spacing={3}>
            {/* Query Input */}
            <TextField
              fullWidth
              placeholder="Enter your analysis query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isStreaming && startStreaming()}
              disabled={isStreaming}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            
            {/* Options Panel */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Analysis Options
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Maximum Documents: {maxDocuments}
                  </Typography>
                  <Slider
                    value={maxDocuments}
                    onChange={(_, value) => setMaxDocuments(value as number)}
                    min={1}
                    max={20}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 5, label: '5' },
                      { value: 10, label: '10' },
                      { value: 20, label: '20' },
                    ]}
                    valueLabelDisplay="auto"
                    disabled={isStreaming}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeRelationships}
                        onChange={(e) => setIncludeRelationships(e.target.checked)}
                        disabled={isStreaming}
                      />
                    }
                    label="Include Relationships"
                  />
                </Grid>
              </Grid>
            </Paper>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {!isStreaming ? (
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={startStreaming}
                  disabled={!query.trim()}
                >
                  Start Analysis
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<StopIcon />}
                  onClick={stopStreaming}
                  color="error"
                >
                  Stop Analysis
                </Button>
              )}
              
              <Button
                variant="outlined"
                startIcon={isPaused ? <PlayIcon /> : <PauseIcon />}
                onClick={() => setIsPaused(!isPaused)}
                disabled={!isStreaming}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearAnalysis}
                disabled={isStreaming}
              >
                Clear
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportAnalysis}
                disabled={!currentAnalysis}
              >
                Export
              </Button>
              
              {elapsedTime && (
                <Chip
                  icon={<TimelineIcon />}
                  label={`Elapsed: ${elapsedTime}`}
                  variant="outlined"
                />
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
      
      {/* Progress and Status */}
      {(isStreaming || status) && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="subtitle2">Status:</Typography>
              <Typography variant="body2" color="text.secondary">
                {status || 'Initializing...'}
              </Typography>
              {isStreaming && <CircularProgress size={16} />}
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={progress}
              color={error ? 'error' : 'primary'}
              sx={{ mb: 1 }}
            />
            
            {metadata && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip icon={<DocumentIcon />} label={`${metadata.documents_analyzed} docs`} size="small" />
                <Chip icon={<RelationshipIcon />} label={`${metadata.relationships_found} relations`} size="small" />
                <Chip icon={<InsightIcon />} label={`${metadata.total_analysis_chunks} chunks`} size="small" />
                <Chip icon={<TimelineIcon />} label={`${metadata.processing_time_ms}ms`} size="small" />
              </Box>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Analysis Results */}
      {currentAnalysis && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Analysis Results
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {isPaused && (
                  <Chip
                    label="Paused"
                    color="warning"
                    size="small"
                    icon={<PauseIcon />}
                  />
                )}
                <Tooltip title="Analysis content">
                  <IconButton size="small">
                    <AnalyticsIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <Paper
              variant="outlined"
              ref={analysisRef}
              sx={{
                p: 2,
                maxHeight: 400,
                overflow: 'auto',
                backgroundColor: 'grey.50',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
              }}
            >
              {currentAnalysis || 'Analysis will appear here as it streams...'}
            </Paper>
          </CardContent>
        </Card>
      )}
      
      {/* Event Log */}
      {events.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Event Log
            </Typography>
            
            <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
              {events.slice(-10).map((event, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {event.type === 'status' && <TimelineIcon />}
                    {event.type === 'analysis' && <InsightIcon />}
                    {event.type === 'metadata' && <AnalyticsIcon />}
                    {event.type === 'error' && <StopIcon color="error" />}
                    {event.type === 'done' && <PlayIcon color="success" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={event.data.length > 50 ? `${event.data.substring(0, 50)}...` : event.data}
                    secondary={`${event.type} • ${formatDistanceToNow(event.timestamp)} ago`}
                  />
                </ListItem>
              ))}
            </List>
            
            {events.length > 10 && (
              <Typography variant="caption" color="text.secondary">
                Showing last 10 events of {events.length} total
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default StreamingAnalysis;