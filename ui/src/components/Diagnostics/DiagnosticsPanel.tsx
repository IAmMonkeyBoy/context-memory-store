import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Computer as SystemIcon,
  NetworkCheck as ConnectivityIcon,
  Settings as ConfigIcon,
  Speed as PerformanceIcon,
  BugReport as TroubleshootIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useSystemDiagnostics } from '@hooks';
import SystemInfoTab from './SystemInfoTab';
import ConnectivityTab from './ConnectivityTab';
import ConfigurationTab from './ConfigurationTab';
import PerformanceTab from './PerformanceTab';
import TroubleshootingTab from './TroubleshootingTab';

export interface DiagnosticsPanelProps {
  /** Whether to show the refresh button */
  showRefresh?: boolean;
  /** Whether to show the download report button */
  showDownload?: boolean;
  /** Default tab to show */
  defaultTab?: number;
  /** Whether to auto-refresh data */
  autoRefresh?: boolean;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`diagnostics-tabpanel-${index}`}
      aria-labelledby={`diagnostics-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  showRefresh = true,
  showDownload = true,
  defaultTab = 0,
  autoRefresh = false,
  refreshInterval = 30000,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { data: diagnosticsData, isLoading, error, refetch } = useSystemDiagnostics();

  // Auto-refresh functionality
  React.useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, refetch]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleDownloadReport = () => {
    if (!diagnosticsData) return;

    const report = {
      timestamp: new Date().toISOString(),
      systemInfo: diagnosticsData,
      generatedBy: 'Context Memory Store - Diagnostics Panel',
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `context-memory-store-diagnostics-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    {
      label: 'System Info',
      icon: <SystemIcon />,
      component: <SystemInfoTab data={diagnosticsData} isLoading={isLoading} />,
    },
    {
      label: 'Connectivity',
      icon: <ConnectivityIcon />,
      component: <ConnectivityTab data={diagnosticsData} isLoading={isLoading} />,
    },
    {
      label: 'Configuration',
      icon: <ConfigIcon />,
      component: <ConfigurationTab data={diagnosticsData} isLoading={isLoading} />,
    },
    {
      label: 'Performance',
      icon: <PerformanceIcon />,
      component: <PerformanceTab data={diagnosticsData} isLoading={isLoading} />,
    },
    {
      label: 'Troubleshooting',
      icon: <TroubleshootIcon />,
      component: <TroubleshootingTab data={diagnosticsData} isLoading={isLoading} />,
    },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon />
            <Typography variant="h6">System Diagnostics</Typography>
            {autoRefresh && (
              <Chip
                label={`Auto-refresh: ${refreshInterval / 1000}s`}
                size="small"
                color="info"
                variant="outlined"
              />
            )}
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {diagnosticsData && (
              <Typography variant="caption" color="text.secondary">
                Last updated: {formatDistanceToNow(new Date(), { addSuffix: true })}
              </Typography>
            )}
            {showRefresh && (
              <Tooltip title="Refresh diagnostics">
                <IconButton onClick={handleRefresh} disabled={isLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
            {showDownload && diagnosticsData && (
              <Tooltip title="Download diagnostic report">
                <IconButton onClick={handleDownloadReport}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
      />

      <CardContent sx={{ p: 0 }}>
        {error && (
          <Alert severity="warning" sx={{ m: 2 }}>
            Some diagnostic data is unavailable: {error.message || 'Unknown error'}
            {error.message?.includes('404') && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                This is expected in development mode. Static diagnostic tools are still available below.
              </Typography>
            )}
            <Button onClick={handleRefresh} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        )}

        {isLoading && !diagnosticsData && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 200,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Always show tabs - they have graceful fallbacks for missing data */}
        <>
          {/* Tabs Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="diagnostics tabs"
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                  id={`diagnostics-tab-${index}`}
                  aria-controls={`diagnostics-tabpanel-${index}`}
                  sx={{ minHeight: 48 }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Tab Content */}
          {tabs.map((tab, index) => (
            <TabPanel key={index} value={activeTab} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </>
      </CardContent>
    </Card>
  );
};

export default DiagnosticsPanel;