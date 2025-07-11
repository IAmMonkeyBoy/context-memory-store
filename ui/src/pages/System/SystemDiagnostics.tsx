import React from 'react';
import { Box, Typography } from '@mui/material';
import { DiagnosticsPanel } from '../../components/Diagnostics';

const SystemDiagnostics: React.FC = () => {
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          System Diagnostics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive system analysis and troubleshooting tools
        </Typography>
      </Box>

      {/* Diagnostics Panel */}
      <DiagnosticsPanel
        showRefresh={true}
        showDownload={true}
        defaultTab={0}
        autoRefresh={false}
        refreshInterval={30000}
      />
    </Box>
  );
};

export default SystemDiagnostics;