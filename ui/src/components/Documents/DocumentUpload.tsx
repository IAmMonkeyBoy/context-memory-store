import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Chip,
  Grid,
  Paper,
  Button,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  Refresh as RetryIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { formatBytes } from '@utils';
import { useDocumentUpload } from '@hooks';

export interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'cancelled';
  progress: number;
  error?: string;
  uploadedAt?: Date;
}

export interface DocumentUploadProps {
  onFilesUploaded?: (files: UploadFile[]) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
  onUploadComplete?: (fileId: string, success: boolean, error?: string) => void;
  maxFileSize?: number;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  disabled?: boolean;
  autoStart?: boolean;
  concurrentUploads?: number;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onFilesUploaded,
  onUploadProgress,
  onUploadComplete,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  maxFiles = 10,
  acceptedFileTypes = ['.txt', '.md', '.pdf', '.doc', '.docx', '.json', '.yaml', '.yml'],
  disabled = false,
  autoStart = true,
  concurrentUploads = 3,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const {
    uploads,
    uploadStats,
    serviceStatus,
    addFiles,
    startUpload,
    cancelUpload,
    cancelAllUploads,
    removeFile,
    retryUpload,
    clearCompleted,
    isUploading,
    hasUploads,
    hasPendingUploads,
  } = useDocumentUpload({
    autoStart,
    concurrentUploads,
    onUploadComplete,
  });

  // Notify parent component of upload progress
  useEffect(() => {
    uploads.forEach(upload => {
      onUploadProgress?.(upload.id, upload.progress);
    });
  }, [uploads, onUploadProgress]);

  // Notify parent component when files are added
  useEffect(() => {
    if (uploads.length > 0) {
      onFilesUploaded?.(uploads);
    }
  }, [uploads.length, onFilesUploaded]);

  // Map file extensions to MIME types for react-dropzone
  const accept = {
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/json': ['.json'],
    'application/x-yaml': ['.yaml', '.yml'],
    'text/yaml': ['.yaml', '.yml'],
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (acceptedFiles.length > 0) {
      const filesToAdd = acceptedFiles.slice(0, Math.max(0, maxFiles - uploads.length));
      addFiles(filesToAdd);
    }

    if (rejectedFiles.length > 0) {
      console.warn('Some files were rejected:', rejectedFiles);
    }
  }, [maxFiles, uploads.length, addFiles]);

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxFileSize,
    maxFiles,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });


  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'cancelled':
        return <CancelIcon color="disabled" />;
      case 'uploading':
        return <UploadIcon color="primary" />;
      default:
        return <FileIcon color="action" />;
    }
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'cancelled':
        return 'default';
      case 'uploading':
        return 'primary';
      default:
        return 'default';
    }
  };

  const pendingCount = uploads.filter(f => f.status === 'pending').length;
  const uploadingCount = uploads.filter(f => f.status === 'uploading').length;
  const successCount = uploadStats.completedFiles;
  const errorCount = uploadStats.failedFiles;

  return (
    <Box>
      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive || dropzoneActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          backgroundColor: isDragActive || dropzoneActive ? 'primary.50' : 'grey.50',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: disabled ? 'grey.300' : 'primary.main',
            backgroundColor: disabled ? 'grey.50' : 'primary.50',
          },
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{ textAlign: 'center' }}>
          <UploadIcon 
            sx={{ 
              fontSize: 48, 
              color: isDragActive || dropzoneActive ? 'primary.main' : 'grey.400',
              mb: 2 
            }} 
          />
          <Typography variant="h6" gutterBottom>
            {isDragActive || dropzoneActive
              ? 'Drop files here...'
              : 'Drag & drop files here, or click to select'
            }
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Supported formats: {acceptedFileTypes.join(', ')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Maximum file size: {formatBytes(maxFileSize)} | Maximum files: {maxFiles}
          </Typography>
          {hasUploads && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
              {hasPendingUploads && !autoStart && (
                <Button
                  variant="contained"
                  startIcon={<StartIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    startUpload();
                  }}
                  disabled={isUploading}
                >
                  Start Upload
                </Button>
              )}
              {isUploading && (
                <Button
                  variant="outlined"
                  startIcon={<StopIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelAllUploads();
                  }}
                  color="error"
                >
                  Cancel All
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  clearCompleted();
                }}
              >
                Clear Completed
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Upload Statistics */}
      {hasUploads && (
        <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}>
          <Grid item xs={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {pendingCount}
              </Typography>
              <Typography variant="caption">Pending</Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {uploadingCount}
              </Typography>
              <Typography variant="caption">Uploading</Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {successCount}
              </Typography>
              <Typography variant="caption">Success</Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">
                {errorCount}
              </Typography>
              <Typography variant="caption">Failed</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* File List */}
      {hasUploads && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Upload Queue ({uploads.length})
              </Typography>
              {isUploading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {serviceStatus.activeUploads} active, {serviceStatus.queuedUploads} queued
                  </Typography>
                  <LinearProgress sx={{ width: 100 }} />
                </Box>
              )}
            </Box>
            <List>
              {uploads.map((uploadFile) => (
                <ListItem
                  key={uploadFile.id}
                  sx={{
                    border: 1,
                    borderColor: 'grey.200',
                    borderRadius: 1,
                    mb: 1,
                    '&:last-child': { mb: 0 },
                  }}
                >
                  <ListItemIcon>
                    {getStatusIcon(uploadFile.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">
                          {uploadFile.file.name}
                        </Typography>
                        <Chip
                          label={uploadFile.status}
                          size="small"
                          color={getStatusColor(uploadFile.status)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatBytes(uploadFile.file.size)} • {uploadFile.file.type || 'Unknown type'}
                        </Typography>
                        {uploadFile.status === 'uploading' && (
                          <LinearProgress
                            variant="determinate"
                            value={uploadFile.progress}
                            sx={{ mt: 1 }}
                          />
                        )}
                        {uploadFile.error && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {uploadFile.error}
                          </Alert>
                        )}
                        {uploadFile.uploadedAt && (
                          <Typography variant="caption" color="success.main">
                            Uploaded at {uploadFile.uploadedAt.toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {uploadFile.status === 'uploading' && (
                      <IconButton
                        size="small"
                        onClick={() => cancelUpload(uploadFile.id)}
                        color="error"
                      >
                        <CancelIcon />
                      </IconButton>
                    )}
                    {uploadFile.status === 'error' && (
                      <Tooltip title="Retry upload">
                        <IconButton
                          size="small"
                          onClick={() => retryUpload(uploadFile.id)}
                          color="primary"
                        >
                          <RetryIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(uploadFile.status === 'pending' || 
                      uploadFile.status === 'error' || 
                      uploadFile.status === 'cancelled') && (
                      <Tooltip title="Remove file">
                        <IconButton
                          size="small"
                          onClick={() => removeFile(uploadFile.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DocumentUpload;