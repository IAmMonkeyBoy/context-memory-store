import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Pagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText as MuiListItemText,
  Tooltip,
  Autocomplete,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
  Slider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
  Sort as SortIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  DataObject as JsonIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { formatBytes } from '../../utils';
import { formatDistanceToNow } from 'date-fns';
import { useDebounce } from '../../hooks';
import { api } from '../../services/api';

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  type: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  sourceType: string;
  relevanceScore?: number;
  metadata: Record<string, any>;
  summary?: string;
  thumbnail?: string;
}

export interface SearchFilters {
  documentTypes: string[];
  dateRange: [Date | null, Date | null];
  tags: string[];
  sourceTypes: string[];
  contentLength: [number, number];
  relevanceThreshold: number;
}

export interface DocumentBrowserProps {
  initialQuery?: string;
  onDocumentSelect?: (document: DocumentItem) => void;
  onDocumentDelete?: (documentId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortField = 'relevance' | 'date' | 'title' | 'size';
type SortOrder = 'asc' | 'desc';

const DOCUMENT_TYPES = ['text', 'pdf', 'markdown', 'json', 'yaml', 'code'];
const SOURCE_TYPES = ['upload', 'api', 'sync', 'import'];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const DocumentBrowser: React.FC<DocumentBrowserProps> = ({
  initialQuery = '',
  onDocumentSelect,
  onDocumentDelete,
  showActions = true,
  compact = false,
}) => {
  // State management
  const [query, setQuery] = useState(initialQuery);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  
  // View and pagination state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>('relevance');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    documentTypes: [],
    dateRange: [null, null],
    tags: [],
    sourceTypes: [],
    contentLength: [0, 100000],
    relevanceThreshold: 0,
  });
  
  // Available filter options
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Menu state
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Debounced search query
  const debouncedQuery = useDebounce(query, 300);
  
  // Search function
  const searchDocuments = useCallback(async (
    searchQuery: string,
    searchFilters: SearchFilters,
    searchPage: number,
    searchPageSize: number,
    searchSortField: SortField,
    searchSortOrder: SortOrder
  ) => {
    if (!searchQuery.trim()) {
      setDocuments([]);
      setTotalCount(0);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const filterParams = {
        types: searchFilters.documentTypes,
        tags: searchFilters.tags,
        sources: searchFilters.sourceTypes,
        minSize: searchFilters.contentLength[0],
        maxSize: searchFilters.contentLength[1],
        minRelevance: searchFilters.relevanceThreshold,
        sortBy: searchSortField,
        sortOrder: searchSortOrder,
        ...(searchFilters.dateRange[0] && { startDate: searchFilters.dateRange[0].toISOString() }),
        ...(searchFilters.dateRange[1] && { endDate: searchFilters.dateRange[1].toISOString() }),
      };
      
      const response = await api.memory.searchAdvanced(
        searchQuery,
        filterParams,
        searchPage,
        searchPageSize
      );
      
      if (response.success && response.data) {
        setDocuments(response.data.results || []);
        setTotalCount(response.data.totalCount || 0);
        
        // Update available tags from aggregations
        if (response.data.aggregations?.tags) {
          setAvailableTags(Object.keys(response.data.aggregations.tags));
        }
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      setDocuments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Effect to trigger search when parameters change
  useEffect(() => {
    searchDocuments(debouncedQuery, filters, page, pageSize, sortField, sortOrder);
  }, [debouncedQuery, filters, page, pageSize, sortField, sortOrder, searchDocuments]);
  
  // Get search suggestions
  const getSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      const response = await api.memory.getSuggestions(searchQuery);
      if (response.success && response.data) {
        setSuggestions(response.data);
      }
    } catch (err) {
      console.warn('Failed to get suggestions:', err);
    }
  }, []);
  
  // Debounced suggestions
  useEffect(() => {
    getSuggestions(query);
  }, [query, getSuggestions]);
  
  // Document type icon
  const getDocumentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <PdfIcon />;
      case 'image':
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <ImageIcon />;
      case 'json':
        return <JsonIcon />;
      case 'code':
      case 'javascript':
      case 'typescript':
        return <CodeIcon />;
      default:
        return <DocumentIcon />;
    }
  };
  
  // Handle document actions
  const handleDocumentView = (document: DocumentItem) => {
    setSelectedDocument(document);
    onDocumentSelect?.(document);
  };
  
  const handleDocumentDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      await api.memory.deleteDocument(documentId);
      setDocuments(docs => docs.filter(doc => doc.id !== documentId));
      setTotalCount(count => count - 1);
      onDocumentDelete?.(documentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };
  
  // Clear filters
  const clearFilters = () => {
    setFilters({
      documentTypes: [],
      dateRange: [null, null],
      tags: [],
      sourceTypes: [],
      contentLength: [0, 100000],
      relevanceThreshold: 0,
    });
    setPage(1);
  };
  
  // Memoized filtered documents count
  const hasActiveFilters = useMemo(() => {
    return filters.documentTypes.length > 0 ||
           filters.tags.length > 0 ||
           filters.sourceTypes.length > 0 ||
           filters.dateRange[0] !== null ||
           filters.dateRange[1] !== null ||
           filters.contentLength[0] > 0 ||
           filters.contentLength[1] < 100000 ||
           filters.relevanceThreshold > 0;
  }, [filters]);
  
  // Document card component
  const DocumentCard: React.FC<{ document: DocumentItem }> = ({ document }) => (
    <Card 
      sx={{ 
        height: compact ? 'auto' : 280,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': { elevation: 4 },
      }}
      onClick={() => handleDocumentView(document)}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          {getDocumentIcon(document.type)}
          <Box sx={{ ml: 1, flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle2" 
              noWrap 
              title={document.title}
              sx={{ fontWeight: 600 }}
            >
              {document.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {document.type} • {formatBytes(document.size)} • {formatDistanceToNow(new Date(document.updatedAt))}
            </Typography>
          </Box>
          {document.relevanceScore && (
            <Chip 
              label={`${Math.round(document.relevanceScore * 100)}%`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        
        {document.summary && !compact && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              mb: 1,
            }}
          >
            {document.summary}
          </Typography>
        )}
        
        {document.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
            {document.tags.slice(0, compact ? 2 : 4).map((tag) => (
              <Chip 
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
              />
            ))}
            {document.tags.length > (compact ? 2 : 4) && (
              <Chip 
                label={`+${document.tags.length - (compact ? 2 : 4)}`}
                size="small"
                variant="outlined"
                color="secondary"
              />
            )}
          </Box>
        )}
      </CardContent>
      
      {showActions && (
        <CardActions sx={{ pt: 0 }}>
          <Tooltip title="View document">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDocumentView(document); }}>
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              color="error"
              onClick={(e) => { e.stopPropagation(); handleDocumentDelete(document.id); }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </CardActions>
      )}
    </Card>
  );
  
  // Document list item component
  const DocumentListItem: React.FC<{ document: DocumentItem }> = ({ document }) => (
    <ListItem
      sx={{ 
        border: 1,
        borderColor: 'grey.200',
        borderRadius: 1,
        mb: 1,
        cursor: 'pointer',
        '&:hover': { bgcolor: 'grey.50' },
      }}
      onClick={() => handleDocumentView(document)}
    >
      <ListItemIcon>
        {getDocumentIcon(document.type)}
      </ListItemIcon>
      <MuiListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
              {document.title}
            </Typography>
            {document.relevanceScore && (
              <Chip 
                label={`${Math.round(document.relevanceScore * 100)}%`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              {document.type} • {formatBytes(document.size)} • {formatDistanceToNow(new Date(document.updatedAt))}
            </Typography>
            {document.summary && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  mt: 0.5,
                }}
              >
                {document.summary}
              </Typography>
            )}
            {document.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {document.tags.slice(0, 6).map((tag) => (
                  <Chip 
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                  />
                ))}
                {document.tags.length > 6 && (
                  <Chip 
                    label={`+${document.tags.length - 6}`}
                    size="small"
                    variant="outlined"
                    color="secondary"
                  />
                )}
              </Box>
            )}
          </Box>
        }
      />
      {showActions && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View document">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDocumentView(document); }}>
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              color="error"
              onClick={(e) => { e.stopPropagation(); handleDocumentDelete(document.id); }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </ListItem>
  );

  return (
    <Box>
      {/* Search and Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          {/* Search Bar */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Autocomplete
              freeSolo
              options={suggestions}
              value={query}
              onInputChange={(_, newValue) => setQuery(newValue || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search documents..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              )}
              sx={{ flexGrow: 1 }}
            />
            
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              color={hasActiveFilters ? 'primary' : 'inherit'}
            >
              Filters {hasActiveFilters && `(${Object.values(filters).flat().length})`}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={(e) => setSortMenuAnchor(e.currentTarget)}
            >
              Sort
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={() => setViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
              >
                <GridViewIcon />
              </IconButton>
              <IconButton
                onClick={() => setViewMode('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
              >
                <ListViewIcon />
              </IconButton>
            </Box>
            
            <IconButton onClick={() => searchDocuments(debouncedQuery, filters, page, pageSize, sortField, sortOrder)}>
              <RefreshIcon />
            </IconButton>
          </Box>
          
          {/* Filter Panel */}
          {showFilters && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Filters</Typography>
                  <Button 
                    size="small" 
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                  >
                    Clear All
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Document Types</InputLabel>
                      <Select
                        multiple
                        value={filters.documentTypes}
                        onChange={(e) => setFilters(f => ({ ...f, documentTypes: e.target.value as string[] }))}
                        input={<OutlinedInput label="Document Types" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {DOCUMENT_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            <Checkbox checked={filters.documentTypes.includes(type)} />
                            <ListItemText primary={type} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Source Types</InputLabel>
                      <Select
                        multiple
                        value={filters.sourceTypes}
                        onChange={(e) => setFilters(f => ({ ...f, sourceTypes: e.target.value as string[] }))}
                        input={<OutlinedInput label="Source Types" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {SOURCE_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            <Checkbox checked={filters.sourceTypes.includes(type)} />
                            <ListItemText primary={type} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      multiple
                      options={availableTags}
                      value={filters.tags}
                      onChange={(_, newValue) => setFilters(f => ({ ...f, tags: newValue }))}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Tags"
                          size="small"
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip {...getTagProps({ index })} key={option} label={option} size="small" />
                        ))
                      }
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography gutterBottom>
                      Relevance Threshold: {filters.relevanceThreshold}%
                    </Typography>
                    <Slider
                      value={filters.relevanceThreshold}
                      onChange={(_, value) => setFilters(f => ({ ...f, relevanceThreshold: value as number }))}
                      min={0}
                      max={100}
                      valueLabelDisplay="auto"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Paper>
      
      {/* Results */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {!loading && documents.length === 0 && query && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No documents found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search query or filters
          </Typography>
        </Box>
      )}
      
      {!loading && documents.length > 0 && (
        <>
          {/* Results Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {totalCount.toLocaleString()} document{totalCount !== 1 ? 's' : ''} found
            </Typography>
            <FormControl size="small">
              <Select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value as number);
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <MenuItem key={size} value={size}>
                    {size} per page
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {/* Documents */}
          {viewMode === 'grid' ? (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {documents.map((document) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={document.id}>
                  <DocumentCard document={document} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <List sx={{ mb: 3 }}>
              {documents.map((document) => (
                <DocumentListItem key={document.id} document={document} />
              ))}
            </List>
          )}
          
          {/* Pagination */}
          {totalCount > pageSize && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={Math.ceil(totalCount / pageSize)}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
      
      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        {(['relevance', 'date', 'title', 'size'] as SortField[]).map((field) => (
          <MenuItem
            key={field}
            onClick={() => {
              if (sortField === field) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortField(field);
                setSortOrder('desc');
              }
              setSortMenuAnchor(null);
            }}
            selected={sortField === field}
          >
            {field.charAt(0).toUpperCase() + field.slice(1)} {sortField === field && (sortOrder === 'desc' ? '↓' : '↑')}
          </MenuItem>
        ))}
      </Menu>
      
      {/* Document Detail Dialog */}
      <Dialog
        open={Boolean(selectedDocument)}
        onClose={() => setSelectedDocument(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedDocument && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getDocumentIcon(selectedDocument.type)}
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {selectedDocument.title}
                </Typography>
                <IconButton onClick={() => setSelectedDocument(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Metadata
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Type: {selectedDocument.type}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Size: {formatBytes(selectedDocument.size)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created: {formatDistanceToNow(new Date(selectedDocument.createdAt))}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Updated: {formatDistanceToNow(new Date(selectedDocument.updatedAt))}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                {selectedDocument.tags.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedDocument.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Content Preview
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedDocument.content.substring(0, 1000)}
                      {selectedDocument.content.length > 1000 && '...'}
                    </Typography>
                  </Paper>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedDocument(null)}>
                Close
              </Button>
              <Button variant="contained" startIcon={<DownloadIcon />}>
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DocumentBrowser;