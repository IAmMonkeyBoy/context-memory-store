import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { MemoryAnalytics } from '@components/Analytics';

const MemoryAnalyticsPage: React.FC = () => {
  const handleOptimize = () => {
    console.log('Memory optimization completed');
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Memory Analytics & Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Monitor memory usage, analyze document patterns, and optimize system performance.
        </Typography>
        
        <MemoryAnalytics
          autoRefresh={true}
          refreshInterval={30000}
          onOptimize={handleOptimize}
        />
      </Box>
    </Container>
  );
};

export default MemoryAnalyticsPage;