import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { Home as HomeIcon, Analytics as AnalyticsIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { StreamingAnalysis } from '../../components/Analysis';

const StreamingAnalysisPage: React.FC = () => {
  const handleAnalysisComplete = (analysis: string, metadata: any) => {
    console.log('Analysis completed:', { analysis, metadata });
  };

  const handleError = (error: string) => {
    console.error('Analysis error:', error);
  };

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <HomeIcon fontSize="small" />
          Dashboard
        </Link>
        <Link
          component={RouterLink}
          to="/analysis"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <AnalyticsIcon fontSize="small" />
          Analysis
        </Link>
        <Typography color="text.primary">Streaming Analysis</Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Real-time Streaming Analysis
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Perform real-time analysis of your memory content with AI-powered insights. 
          Get streaming results as the analysis progresses with live feedback and interactive controls.
        </Typography>
      </Box>

      {/* Streaming Analysis Component */}
      <StreamingAnalysis
        onAnalysisComplete={handleAnalysisComplete}
        onError={handleError}
      />
    </Box>
  );
};

export default StreamingAnalysisPage;