import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { ContextRetrieval } from '@components/Context';

const ContextRetrievalPage: React.FC = () => {
  const handleContextSelect = (context: any) => {
    console.log('Context selected:', context);
  };

  const handleExport = (results: any[]) => {
    console.log('Exporting results:', results);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Context Retrieval & Visualization
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Retrieve relevant context with relationship analysis and interactive visualization.
        </Typography>
        
        <ContextRetrieval
          onContextSelect={handleContextSelect}
          onExport={handleExport}
        />
      </Box>
    </Container>
  );
};

export default ContextRetrievalPage;