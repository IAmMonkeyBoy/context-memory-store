import React from 'react';
import { Box, Typography, Card, CardContent, Alert } from '@mui/material';

const DocumentsIngest: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Document Ingestion
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload and process documents for semantic search and analysis.
      </Typography>
      
      <Card>
        <CardContent>
          <Alert severity="info">
            Document ingestion interface will be implemented in Phase 7.3.
            This will include drag-and-drop file upload, batch processing, and real-time progress tracking.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DocumentsIngest;