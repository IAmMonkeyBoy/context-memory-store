import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Description as DocumentIcon,
  Search as SearchIcon,
  AccountTree as RelationshipIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Memory as MemoryIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Settings as OptimizeIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  FileCopy as DuplicateIcon,
  CloudUpload as UploadIcon,
  Api as ApiIcon,
  Sync as SyncIcon,
  GetApp as ImportIcon,
} from '@mui/icons-material';
import { formatBytes } from '../../utils';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../../services/api';

export interface MemoryAnalytics {
  overview: {
    totalDocuments: number;
    totalVectors: number;
    totalRelationships: number;
    storageUsed: number;
    storageCapacity: number;
    lastUpdated: string;
  };
  documentAnalytics: {
    typeDistribution: Record<string, number>;
    sizeDistribution: Record<string, number>;
    ageDistribution: Record<string, number>;
    duplicateDocuments: Array<{
      id: string;
      title: string;
      duplicateCount: number;
      similarityScore: number;
    }>;
  };
  searchAnalytics: {
    totalSearches: number;
    averageResultCount: number;
    popularQueries: Array<{
      query: string;
      count: number;
      averageRelevance: number;
    }>;
    searchSuccessRate: number;
  };
  relationshipAnalytics: {
    strongestConnections: Array<{
      sourceTitle: string;
      targetTitle: string;
      strength: number;
      type: string;
    }>;
    isolatedDocuments: number;
    averageConnections: number;
    relationshipTypes: Record<string, number>;
  };
  optimizationRecommendations: Array<{
    type: 'storage' | 'performance' | 'quality';
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    actionRequired: string;
  }>;
}

export interface MemoryAnalyticsProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
  onOptimize?: () => void;
}

const MemoryAnalytics: React.FC<MemoryAnalyticsProps> = ({
  refreshInterval = 30000, // 30 seconds
  autoRefresh = false,
  onOptimize,
}) => {
  // State management
  const [analytics, setAnalytics] = useState<MemoryAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // UI state
  const [selectedView, setSelectedView] = useState<'overview' | 'documents' | 'search' | 'relationships' | 'recommendations'>('overview');
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  
  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.memory.getAnalytics();
      
      if (response.success && response.data) {
        setAnalytics(response.data);
        setLastRefresh(new Date());
      } else {
        throw new Error(response.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Auto refresh effect
  useEffect(() => {
    fetchAnalytics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAnalytics, autoRefresh, refreshInterval]);
  
  // Handle optimization
  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const response = await api.memory.optimize();
      
      if (response.success) {
        onOptimize?.();
        // Refresh analytics after optimization
        await fetchAnalytics();
        setShowOptimizationDialog(false);
      } else {
        throw new Error(response.message || 'Optimization failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };
  
  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };
  
  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <ErrorIcon />;
      case 'medium': return <WarningIcon />;
      case 'low': return <SuccessIcon />;
      default: return <SuccessIcon />;
    }
  };
  
  // Get source type icon
  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'upload': return <UploadIcon />;
      case 'api': return <ApiIcon />;
      case 'sync': return <SyncIcon />;
      case 'import': return <ImportIcon />;
      default: return <DocumentIcon />;
    }
  };
  
  // Calculate storage usage percentage
  const storagePercentage = analytics 
    ? Math.round((analytics.overview.storageUsed / analytics.overview.storageCapacity) * 100)
    : 0;
  
  // Overview metrics component
  const OverviewMetrics: React.FC = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <DocumentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" color="primary">
              {analytics?.overview.totalDocuments.toLocaleString() || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Documents
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <MemoryIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
            <Typography variant="h4" color="secondary">
              {analytics?.overview.totalVectors.toLocaleString() || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vector Embeddings
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <RelationshipIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" color="success.main">
              {analytics?.overview.totalRelationships.toLocaleString() || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Relationships
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <StorageIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" color="warning.main">
              {storagePercentage}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Storage Used
            </Typography>
            <LinearProgress
              variant="determinate"
              value={storagePercentage}
              color={storagePercentage > 80 ? 'error' : storagePercentage > 60 ? 'warning' : 'success'}
              sx={{ mt: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatBytes(analytics?.overview.storageUsed || 0)} / {formatBytes(analytics?.overview.storageCapacity || 0)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  
  // Document analytics component
  const DocumentAnalytics: React.FC = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Document Type Distribution
            </Typography>
            <List>
              {Object.entries(analytics?.documentAnalytics.typeDistribution || {}).map(([type, count]) => (
                <ListItem key={type}>
                  <ListItemIcon>
                    <DocumentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={type}
                    secondary={`${count} documents`}
                  />
                  <Chip label={count} size="small" />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Document Age Distribution
            </Typography>
            <List>
              {Object.entries(analytics?.documentAnalytics.ageDistribution || {}).map(([age, count]) => (
                <ListItem key={age}>
                  <ListItemIcon>
                    <TimelineIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={age}
                    secondary={`${count} documents`}
                  />
                  <Chip label={count} size="small" />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      {(analytics?.documentAnalytics.duplicateDocuments?.length || 0) > 0 && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Potential Duplicate Documents
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Document</TableCell>
                      <TableCell align="right">Duplicates</TableCell>
                      <TableCell align="right">Similarity</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(analytics?.documentAnalytics.duplicateDocuments || []).map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DuplicateIcon />
                            <Typography variant="body2">
                              {doc.title}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={doc.duplicateCount}
                            color="warning"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {Math.round(doc.similarityScore * 100)}%
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined">
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
  
  // Search analytics component
  const SearchAnalytics: React.FC = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Search Statistics
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Total Searches:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {analytics?.searchAnalytics.totalSearches.toLocaleString() || 0}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Average Results:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {analytics?.searchAnalytics.averageResultCount.toFixed(1) || 0}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Success Rate:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {Math.round((analytics?.searchAnalytics.searchSuccessRate || 0) * 100)}%
                </Typography>
              </Box>
              
              <LinearProgress
                variant="determinate"
                value={(analytics?.searchAnalytics.searchSuccessRate || 0) * 100}
                color="primary"
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Popular Search Queries
            </Typography>
            <List>
              {analytics?.searchAnalytics.popularQueries.slice(0, 5).map((query, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <SearchIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={query.query}
                    secondary={`${query.count} searches • ${Math.round(query.averageRelevance * 100)}% avg relevance`}
                  />
                  <Chip label={query.count} size="small" />
                </ListItem>
              )) || []}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  
  // Relationship analytics component
  const RelationshipAnalytics: React.FC = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <RelationshipIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" color="primary">
              {analytics?.relationshipAnalytics.averageConnections.toFixed(1) || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average Connections
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <DocumentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" color="warning.main">
              {analytics?.relationshipAnalytics.isolatedDocuments || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Isolated Documents
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <RelationshipIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" color="success.main">
              {Object.keys(analytics?.relationshipAnalytics.relationshipTypes || {}).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Relationship Types
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Strongest Connections
            </Typography>
            <List>
              {analytics?.relationshipAnalytics.strongestConnections.slice(0, 5).map((connection, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <RelationshipIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${connection.sourceTitle} → ${connection.targetTitle}`}
                    secondary={`${connection.type} • Strength: ${Math.round(connection.strength * 100)}%`}
                  />
                  <Chip 
                    label={`${Math.round(connection.strength * 100)}%`}
                    color="primary"
                    size="small"
                  />
                </ListItem>
              )) || []}
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Relationship Type Distribution
            </Typography>
            <List>
              {Object.entries(analytics?.relationshipAnalytics.relationshipTypes || {}).map(([type, count]) => (
                <ListItem key={type}>
                  <ListItemIcon>
                    <RelationshipIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={type}
                    secondary={`${count} relationships`}
                  />
                  <Chip label={count} size="small" />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  
  // Recommendations component
  const OptimizationRecommendations: React.FC = () => (
    <Stack spacing={2}>
      {analytics?.optimizationRecommendations.map((rec, index) => (
        <Accordion key={index}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Badge 
                badgeContent={rec.severity} 
                color={getSeverityColor(rec.severity) as any}
              >
                {getSeverityIcon(rec.severity)}
              </Badge>
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                {rec.title}
              </Typography>
              <Chip 
                label={rec.type}
                size="small"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="body2">
                {rec.description}
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recommended Action:
                </Typography>
                <Typography variant="body2">
                  {rec.actionRequired}
                </Typography>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      )) || []}
      
      {analytics?.optimizationRecommendations.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <SuccessIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" color="success.main">
            No optimization recommendations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your memory system is running optimally
          </Typography>
        </Box>
      )}
    </Stack>
  );
  
  const highPriorityRecommendations = analytics?.optimizationRecommendations.filter(r => r.severity === 'high').length || 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Memory Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnalytics}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `memory-analytics-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={!analytics}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<OptimizeIcon />}
            onClick={() => setShowOptimizationDialog(true)}
            disabled={loading || !analytics}
            color={highPriorityRecommendations > 0 ? 'error' : 'primary'}
          >
            Optimize
            {highPriorityRecommendations > 0 && (
              <Badge badgeContent={highPriorityRecommendations} color="error" sx={{ ml: 1 }} />
            )}
          </Button>
        </Box>
      </Box>
      
      {/* Last Updated */}
      {lastRefresh && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Last updated: {formatDistanceToNow(lastRefresh)} 
          {analytics?.overview.lastUpdated && (
            <> • Data from: {formatDistanceToNow(new Date(analytics.overview.lastUpdated))}</>
          )}
        </Typography>
      )}
      
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
      
      {/* View Selector */}
      {analytics && (
        <Box sx={{ mb: 3 }}>
          <FormControl>
            <InputLabel>View</InputLabel>
            <Select
              value={selectedView}
              label="View"
              onChange={(e) => setSelectedView(e.target.value as any)}
            >
              <MenuItem value="overview">Overview</MenuItem>
              <MenuItem value="documents">Document Analytics</MenuItem>
              <MenuItem value="search">Search Analytics</MenuItem>
              <MenuItem value="relationships">Relationship Analytics</MenuItem>
              <MenuItem value="recommendations">
                Recommendations
                {highPriorityRecommendations > 0 && (
                  <Badge badgeContent={highPriorityRecommendations} color="error" sx={{ ml: 1 }} />
                )}
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}
      
      {/* Analytics Content */}
      {!loading && analytics && (
        <Box>
          {selectedView === 'overview' && <OverviewMetrics />}
          {selectedView === 'documents' && <DocumentAnalytics />}
          {selectedView === 'search' && <SearchAnalytics />}
          {selectedView === 'relationships' && <RelationshipAnalytics />}
          {selectedView === 'recommendations' && <OptimizationRecommendations />}
        </Box>
      )}
      
      {/* No Data */}
      {!loading && !analytics && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <AnalyticsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No analytics data available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click refresh to load the latest analytics
          </Typography>
        </Box>
      )}
      
      {/* Optimization Dialog */}
      <Dialog
        open={showOptimizationDialog}
        onClose={() => setShowOptimizationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Memory Optimization
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Alert severity="warning">
              This will optimize your memory system by cleaning up duplicate entries, 
              rebuilding indexes, and reorganizing storage.
            </Alert>
            
            {highPriorityRecommendations > 0 && (
              <Alert severity="error">
                {highPriorityRecommendations} high-priority optimization{highPriorityRecommendations > 1 ? 's' : ''} available.
                We recommend running optimization now.
              </Alert>
            )}
            
            <Typography variant="body2">
              Optimization may take several minutes depending on your data size. 
              The system will remain available during optimization.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOptimizationDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleOptimize}
            disabled={optimizing}
            startIcon={optimizing ? <CircularProgress size={20} /> : <OptimizeIcon />}
          >
            {optimizing ? 'Optimizing...' : 'Start Optimization'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemoryAnalytics;