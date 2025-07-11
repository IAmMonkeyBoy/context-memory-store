import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Container,
  Alert,
  Chip,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Search as SearchIcon,
  Analytics as AnalyticsIcon,
  Memory as MemoryIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { DocumentUpload } from '@components/Documents';
import { UploadFile } from '@components/Documents/DocumentUpload';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`memory-tabpanel-${index}`}
      aria-labelledby={`memory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `memory-tab-${index}`,
    'aria-controls': `memory-tabpanel-${index}`,
  };
};

const MemoryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [totalMemorySize, setTotalMemorySize] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFilesUploaded = (files: UploadFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleUploadComplete = (fileId: string, success: boolean, error?: string) => {
    if (success) {
      setTotalDocuments(prev => prev + 1);
      // In a real implementation, we'd get the actual memory size from the API
      const uploadedFile = uploadedFiles.find(f => f.id === fileId);
      if (uploadedFile) {
        setTotalMemorySize(prev => prev + uploadedFile.file.size);
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Container maxWidth="xl">
      <Box>
        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Memory Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Upload, search, and analyze documents in your context memory store
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh data">
              <IconButton color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton color="primary">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Memory Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MemoryIcon color="primary" />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Total Documents
                  </Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {totalDocuments.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Documents in memory store
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AnalyticsIcon color="primary" />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Memory Size
                  </Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {formatBytes(totalMemorySize)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total storage used
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <UploadIcon color="primary" />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Uploaded Today
                  </Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {uploadedFiles.filter(f => {
                    const today = new Date();
                    const fileDate = f.uploadedAt;
                    return fileDate && 
                           fileDate.toDateString() === today.toDateString();
                  }).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Files added today
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SearchIcon color="primary" />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Search Index
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Vector" color="success" size="small" />
                  <Chip label="Graph" color="success" size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Index status
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="memory management tabs">
              <Tab 
                icon={<UploadIcon />} 
                label="Document Upload" 
                {...a11yProps(0)} 
              />
              <Tab 
                icon={<SearchIcon />} 
                label="Search & Browse" 
                {...a11yProps(1)} 
                disabled
              />
              <Tab 
                icon={<MemoryIcon />} 
                label="Context Visualization" 
                {...a11yProps(2)} 
                disabled
              />
              <Tab 
                icon={<AnalyticsIcon />} 
                label="Analytics" 
                {...a11yProps(3)} 
                disabled
              />
            </Tabs>
          </Box>

          {/* Document Upload Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h5" gutterBottom>
                Document Upload & Ingestion
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Upload documents to add them to your context memory store. Supported formats include text files, 
                PDFs, Word documents, JSON, and YAML files.
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Phase 7.3 Implementation
                </Typography>
                <Typography variant="body2">
                  This is the document upload interface for Phase 7.3. The backend ingestion API endpoints 
                  are not yet implemented, so uploads will fail with 404 errors. This is expected during development.
                </Typography>
              </Alert>

              <DocumentUpload
                maxFileSize={50 * 1024 * 1024} // 50MB
                maxFiles={20}
                onFilesUploaded={handleFilesUploaded}
                onUploadComplete={handleUploadComplete}
                autoStart={true}
                concurrentUploads={3}
              />
            </Box>
          </TabPanel>

          {/* Search & Browse Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h5" gutterBottom>
                Document Search & Browser
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Search through your document collection using semantic search, browse by categories, 
                and filter by metadata.
              </Typography>
              
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Coming in Week 2
                </Typography>
                <Typography variant="body2">
                  Document browser and advanced search functionality will be implemented in Week 2 of Phase 7.3 
                  (Issue #88).
                </Typography>
              </Alert>
            </Box>
          </TabPanel>

          {/* Context Visualization Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h5" gutterBottom>
                Context Retrieval & Visualization
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Visualize document relationships, explore context graphs, and understand how your documents 
                are connected in the memory store.
              </Typography>
              
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Coming in Week 3
                </Typography>
                <Typography variant="body2">
                  Context visualization interface will be implemented in Week 3 of Phase 7.3 
                  (Issue #89).
                </Typography>
              </Alert>
            </Box>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h5" gutterBottom>
                Memory Analytics & Management
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Analyze memory usage patterns, view document statistics, and manage your context store 
                performance and capacity.
              </Typography>
              
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Coming in Week 4
                </Typography>
                <Typography variant="body2">
                  Memory analytics dashboard will be implemented in Week 4 of Phase 7.3 
                  (Issue #90).
                </Typography>
              </Alert>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default MemoryManagement;