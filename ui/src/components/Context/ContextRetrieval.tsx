import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Slider,
  FormControlLabel,
  Switch,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stack,
  Divider,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  AccountTree as RelationshipIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Analytics as AnalyticsIcon,
  Description as DocumentIcon,
  Timeline as GraphIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../../services/api';

export interface ContextQuery {
  query: string;
  maxDocuments: number;
  includeRelationships: boolean;
  minRelevanceScore: number;
  expandContext: boolean;
}

export interface ContextResult {
  document: {
    id: string;
    title: string;
    content: string;
    type: string;
    size: number;
    createdAt: string;
    tags: string[];
  };
  relevanceScore: number;
  relationships: Relationship[];
  contextSummary: string;
  qualityMetrics: {
    completeness: number;
    relevance: number;
    freshness: number;
  };
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  strength: number;
  metadata: Record<string, any>;
}

export interface RelationshipGraph {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    properties: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    weight: number;
  }>;
}

export interface ContextRetrievalProps {
  initialQuery?: string;
  onContextSelect?: (context: ContextResult) => void;
  onExport?: (results: ContextResult[]) => void;
}

const ContextRetrieval: React.FC<ContextRetrievalProps> = ({
  initialQuery = '',
  onContextSelect,
  onExport,
}) => {
  // State management
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ContextResult[]>([]);
  const [relationshipGraph, setRelationshipGraph] = useState<RelationshipGraph>({ nodes: [], edges: [] });
  const [queryTime, setQueryTime] = useState<number>(0);
  
  // Query options
  const [maxDocuments, setMaxDocuments] = useState(10);
  const [includeRelationships, setIncludeRelationships] = useState(true);
  const [minRelevanceScore, setMinRelevanceScore] = useState(0.1);
  const [expandContext, setExpandContext] = useState(false);
  
  // UI state
  const [selectedResult, setSelectedResult] = useState<ContextResult | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  
  // Graph visualization ref
  const graphRef = useRef<HTMLDivElement>(null);
  
  // Context retrieval function
  const retrieveContext = useCallback(async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const contextQuery: ContextQuery = {
        query: query.trim(),
        maxDocuments,
        includeRelationships,
        minRelevanceScore,
        expandContext,
      };
      
      const response = await api.memory.retrieveContext(contextQuery);
      
      if (response.success && response.data) {
        setResults(response.data.results || []);
        setRelationshipGraph(response.data.relationshipGraph || { nodes: [], edges: [] });
        setQueryTime(response.data.queryTime || 0);
      } else {
        throw new Error(response.message || 'Context retrieval failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during context retrieval');
      setResults([]);
      setRelationshipGraph({ nodes: [], edges: [] });
    } finally {
      setLoading(false);
    }
  }, [query, maxDocuments, includeRelationships, minRelevanceScore, expandContext]);
  
  // Handle result expansion
  const toggleResultExpansion = (resultId: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };
  
  // Quality score color
  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };
  
  // Quality score label
  const getQualityLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };
  
  // Simple graph visualization (placeholder for D3.js implementation)
  const GraphVisualization: React.FC<{ graph: RelationshipGraph }> = ({ graph }) => {
    useEffect(() => {
      if (!graphRef.current || graph.nodes.length === 0) return;
      
      // This is a placeholder for D3.js graph visualization
      // In a real implementation, you would use D3.js to create an interactive graph
      const container = graphRef.current;
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; background: #f5f5f5; border-radius: 8px;">
          <p><strong>Graph Visualization</strong></p>
          <p>Nodes: ${graph.nodes.length}</p>
          <p>Relationships: ${graph.edges.length}</p>
          <p><em>Interactive D3.js graph would be rendered here</em></p>
        </div>
      `;
    }, [graph]);
    
    return (
      <Box
        ref={graphRef}
        sx={{
          height: 400,
          width: '100%',
          border: 1,
          borderColor: 'grey.300',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      />
    );
  };
  
  // Export functionality
  const handleExport = () => {
    onExport?.(results);
    
    // Simple JSON export as fallback
    const exportData = {
      query,
      timestamp: new Date().toISOString(),
      queryTime,
      resultCount: results.length,
      results: results.map(result => ({
        document: result.document,
        relevanceScore: result.relevanceScore,
        contextSummary: result.contextSummary,
        qualityMetrics: result.qualityMetrics,
      })),
      relationshipGraph,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `context-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      {/* Query Interface */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Context Query Interface
          </Typography>
          
          <Stack spacing={3}>
            {/* Search Input */}
            <TextField
              fullWidth
              placeholder="Enter your context query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && retrieveContext()}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            
            {/* Options Panel */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Query Options
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
                    max={50}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 10, label: '10' },
                      { value: 25, label: '25' },
                      { value: 50, label: '50' },
                    ]}
                    valueLabelDisplay="auto"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Minimum Relevance Score: {Math.round(minRelevanceScore * 100)}%
                  </Typography>
                  <Slider
                    value={minRelevanceScore}
                    onChange={(_, value) => setMinRelevanceScore(value as number)}
                    min={0}
                    max={1}
                    step={0.1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 0.5, label: '50%' },
                      { value: 1, label: '100%' },
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeRelationships}
                        onChange={(e) => setIncludeRelationships(e.target.checked)}
                      />
                    }
                    label="Include Relationships"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={expandContext}
                        onChange={(e) => setExpandContext(e.target.checked)}
                      />
                    }
                    label="Expand Context"
                  />
                </Grid>
              </Grid>
            </Paper>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={retrieveContext}
                disabled={loading || !query.trim()}
              >
                Retrieve Context
              </Button>
              
              {results.length > 0 && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<GraphIcon />}
                    onClick={() => setShowGraph(!showGraph)}
                    disabled={relationshipGraph.nodes.length === 0}
                  >
                    {showGraph ? 'Hide' : 'Show'} Graph
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                  >
                    Export Results
                  </Button>
                </>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
      
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Results Summary */}
      {!loading && results.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {results.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Documents Found
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">
                    {Math.round(queryTime)}ms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Query Time
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {relationshipGraph.edges.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Relationships
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {Math.round(results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length * 100)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Relevance
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      
      {/* Relationship Graph */}
      {showGraph && relationshipGraph.nodes.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Relationship Graph
            </Typography>
            <GraphVisualization graph={relationshipGraph} />
          </CardContent>
        </Card>
      )}
      
      {/* Results List */}
      {!loading && results.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Context Results
          </Typography>
          
          {results.map((result, index) => (
            <Accordion 
              key={result.document.id}
              expanded={expandedResults.has(result.document.id)}
              onChange={() => toggleResultExpansion(result.document.id)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Badge badgeContent={index + 1} color="primary">
                    <DocumentIcon />
                  </Badge>
                  
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>
                      {result.document.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {result.document.type} • {formatDistanceToNow(new Date(result.document.createdAt))}
                    </Typography>
                  </Box>
                  
                  <Chip
                    label={`${Math.round(result.relevanceScore * 100)}%`}
                    color="primary"
                    size="small"
                  />
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Document">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResult(result);
                          onContextSelect?.(result);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {result.relationships.length > 0 && (
                      <Tooltip title={`${result.relationships.length} relationships`}>
                        <IconButton size="small">
                          <RelationshipIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Stack spacing={2}>
                  {/* Quality Metrics */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Quality Metrics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <LinearProgress
                            variant="determinate"
                            value={result.qualityMetrics.completeness * 100}
                            color={getQualityColor(result.qualityMetrics.completeness)}
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="caption">
                            Completeness: {Math.round(result.qualityMetrics.completeness * 100)}%
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <LinearProgress
                            variant="determinate"
                            value={result.qualityMetrics.relevance * 100}
                            color={getQualityColor(result.qualityMetrics.relevance)}
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="caption">
                            Relevance: {Math.round(result.qualityMetrics.relevance * 100)}%
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <LinearProgress
                            variant="determinate"
                            value={result.qualityMetrics.freshness * 100}
                            color={getQualityColor(result.qualityMetrics.freshness)}
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="caption">
                            Freshness: {Math.round(result.qualityMetrics.freshness * 100)}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  {/* Context Summary */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Context Summary
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2">
                        {result.contextSummary}
                      </Typography>
                    </Paper>
                  </Box>
                  
                  {/* Tags */}
                  {result.document.tags.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Tags
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {result.document.tags.map((tag) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {/* Relationships */}
                  {result.relationships.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Relationships ({result.relationships.length})
                      </Typography>
                      <List dense>
                        {result.relationships.slice(0, 5).map((rel) => (
                          <ListItem key={rel.id}>
                            <ListItemIcon>
                              <RelationshipIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={rel.type}
                              secondary={`Strength: ${Math.round(rel.strength * 100)}%`}
                            />
                          </ListItem>
                        ))}
                        {result.relationships.length > 5 && (
                          <ListItem>
                            <ListItemText
                              secondary={`+${result.relationships.length - 5} more relationships`}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
      
      {/* No Results */}
      {!loading && results.length === 0 && query && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No context found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your query or reducing the minimum relevance score
          </Typography>
        </Box>
      )}
      
      {/* Document Detail Dialog */}
      <Dialog
        open={Boolean(selectedResult)}
        onClose={() => setSelectedResult(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedResult && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocumentIcon />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {selectedResult.document.title}
                </Typography>
                <Chip
                  label={getQualityLabel(selectedResult.qualityMetrics.relevance)}
                  color={getQualityColor(selectedResult.qualityMetrics.relevance)}
                  size="small"
                />
                <IconButton onClick={() => setSelectedResult(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Stack spacing={3}>
                {/* Quality Metrics */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Quality Analysis
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                          <CircularProgress
                            variant="determinate"
                            value={selectedResult.qualityMetrics.completeness * 100}
                            size={60}
                            color={getQualityColor(selectedResult.qualityMetrics.completeness)}
                          />
                          <Box
                            sx={{
                              top: 0,
                              left: 0,
                              bottom: 0,
                              right: 0,
                              position: 'absolute',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="caption" component="div" color="text.secondary">
                              {Math.round(selectedResult.qualityMetrics.completeness * 100)}%
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Completeness
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                          <CircularProgress
                            variant="determinate"
                            value={selectedResult.qualityMetrics.relevance * 100}
                            size={60}
                            color={getQualityColor(selectedResult.qualityMetrics.relevance)}
                          />
                          <Box
                            sx={{
                              top: 0,
                              left: 0,
                              bottom: 0,
                              right: 0,
                              position: 'absolute',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="caption" component="div" color="text.secondary">
                              {Math.round(selectedResult.qualityMetrics.relevance * 100)}%
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Relevance
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                          <CircularProgress
                            variant="determinate"
                            value={selectedResult.qualityMetrics.freshness * 100}
                            size={60}
                            color={getQualityColor(selectedResult.qualityMetrics.freshness)}
                          />
                          <Box
                            sx={{
                              top: 0,
                              left: 0,
                              bottom: 0,
                              right: 0,
                              position: 'absolute',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="caption" component="div" color="text.secondary">
                              {Math.round(selectedResult.qualityMetrics.freshness * 100)}%
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Freshness
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                
                <Divider />
                
                {/* Context Summary */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Context Summary
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">
                      {selectedResult.contextSummary}
                    </Typography>
                  </Paper>
                </Box>
                
                {/* Document Content Preview */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Content Preview
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedResult.document.content.substring(0, 1000)}
                      {selectedResult.document.content.length > 1000 && '...'}
                    </Typography>
                  </Paper>
                </Box>
              </Stack>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setSelectedResult(null)}>
                Close
              </Button>
              <Button variant="outlined" startIcon={<ShareIcon />}>
                Share
              </Button>
              <Button variant="contained" startIcon={<DownloadIcon />}>
                Export
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ContextRetrieval;