import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { DocumentBrowser } from '@components/Documents';

const DocumentBrowserPage: React.FC = () => {
  const handleDocumentSelect = (document: any) => {
    console.log('Document selected:', document);
  };

  const handleDocumentDelete = (documentId: string) => {
    console.log('Document deleted:', documentId);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Document Browser
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Search, filter, and manage your document collection with advanced search capabilities.
        </Typography>
        
        <DocumentBrowser
          onDocumentSelect={handleDocumentSelect}
          onDocumentDelete={handleDocumentDelete}
          showActions={true}
        />
      </Box>
    </Container>
  );
};

export default DocumentBrowserPage;