import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Chip,
  TextField,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  BugReport as BugIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PlayArrow as RunIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

export interface TroubleshootingTabProps {
  data: any;
  isLoading: boolean;
}

interface TroubleshootingStep {
  id: string;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  category: string;
  solution?: string;
  commands?: string[];
  links?: { title: string; url: string }[];
}

const TroubleshootingTab: React.FC<TroubleshootingTabProps> = ({ data, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPanel, setExpandedPanel] = useState<string | false>('common-issues');
  const [runningTests, setRunningTests] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading troubleshooting information...</Typography>
      </Box>
    );
  }

  // Always show troubleshooting content, even if backend data is unavailable
  // Static content (common issues, diagnostic tests) is still useful

  const troubleshooting = data.troubleshooting || {};
  const issues = troubleshooting.detectedIssues || [];
  const recommendations = troubleshooting.recommendations || [];
  const diagnosticTests = troubleshooting.diagnosticTests || [];

  const handleAccordionChange = (panel: string) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean,
  ) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      case 'success':
        return <SuccessIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'success';
      default: return 'default';
    }
  };

  const runDiagnosticTest = async (testId: string) => {
    setRunningTests(prev => ({ ...prev, [testId]: true }));
    
    // Simulate test execution
    setTimeout(() => {
      setRunningTests(prev => ({ ...prev, [testId]: false }));
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const commonIssues: TroubleshootingStep[] = [
    {
      id: 'connection-failed',
      title: 'Service Connection Failed',
      description: 'One or more services (Qdrant, Neo4j, Ollama) are not responding',
      severity: 'error',
      category: 'Connectivity',
      solution: 'Check if the services are running and accessible on their configured ports.',
      commands: [
        'docker-compose ps',
        'curl -f http://localhost:6333/health',
        'curl -f http://localhost:7474/browser',
        'curl -f http://localhost:11434/api/tags'
      ]
    },
    {
      id: 'high-memory-usage',
      title: 'High Memory Usage',
      description: 'System memory usage is above 85%',
      severity: 'warning',
      category: 'Performance',
      solution: 'Consider restarting services or increasing memory allocation.',
      commands: [
        'docker stats',
        'free -h',
        'ps aux --sort=-%mem | head'
      ]
    },
    {
      id: 'slow-response-time',
      title: 'Slow API Response Times',
      description: 'API endpoints are responding slower than expected',
      severity: 'warning',
      category: 'Performance',
      solution: 'Check database connections and optimize queries.',
      commands: [
        'curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8080/health'
      ]
    },
    {
      id: 'disk-space-low',
      title: 'Low Disk Space',
      description: 'Available disk space is below 10%',
      severity: 'error',
      category: 'Storage',
      solution: 'Clean up logs and temporary files, or increase disk capacity.',
      commands: [
        'df -h',
        'du -sh /var/log/*',
        'docker system prune -f'
      ]
    }
  ];

  const filteredIssues = commonIssues.filter(issue =>
    !searchTerm || 
    issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Troubleshooting & Diagnostics
      </Typography>

      {/* Notice when backend data is unavailable */}
      {!data && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Backend diagnostic data unavailable
          </Typography>
          <Typography variant="body2">
            This is normal in development mode. The troubleshooting guides and diagnostic tools below are still available to help you identify and resolve common issues.
          </Typography>
        </Alert>
      )}

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search troubleshooting guides..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </CardContent>
      </Card>

      {/* Detected Issues */}
      {issues.length > 0 && (
        <Accordion expanded={expandedPanel === 'detected-issues'} onChange={handleAccordionChange('detected-issues')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon color="error" />
              <Typography variant="h6">Detected Issues</Typography>
              <Chip label={issues.length} color="error" size="small" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {issues.map((issue: any, index: number) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getSeverityIcon(issue.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={issue.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {issue.description}
                        </Typography>
                        {issue.solution && (
                          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                            Solution: {issue.solution}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Chip
                    label={issue.severity}
                    color={getSeverityColor(issue.severity) as any}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Common Issues */}
      <Accordion expanded={expandedPanel === 'common-issues'} onChange={handleAccordionChange('common-issues')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugIcon color="primary" />
            <Typography variant="h6">Common Issues</Typography>
            <Chip label={filteredIssues.length} color="primary" size="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {filteredIssues.map((issue) => (
              <Grid item xs={12} md={6} key={issue.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getSeverityIcon(issue.severity)}
                      <Typography variant="subtitle1" sx={{ ml: 1, flexGrow: 1 }}>
                        {issue.title}
                      </Typography>
                      <Chip label={issue.category} size="small" variant="outlined" />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {issue.description}
                    </Typography>
                    
                    {issue.solution && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        {issue.solution}
                      </Alert>
                    )}
                    
                    {issue.commands && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Diagnostic Commands:
                        </Typography>
                        {issue.commands.map((command, cmdIndex) => (
                          <Paper
                            key={cmdIndex}
                            sx={{
                              p: 1,
                              mb: 1,
                              bgcolor: 'grey.100',
                              fontFamily: 'monospace',
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span>{command}</span>
                            <Tooltip title="Copy command">
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(command)}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Diagnostic Tests */}
      <Accordion expanded={expandedPanel === 'diagnostic-tests'} onChange={handleAccordionChange('diagnostic-tests')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RunIcon color="primary" />
            <Typography variant="h6">Diagnostic Tests</Typography>
            <Chip label={diagnosticTests.length || 4} color="primary" size="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {[
              { id: 'connectivity', name: 'Service Connectivity Test', description: 'Test connections to all services' },
              { id: 'performance', name: 'Performance Test', description: 'Check system performance metrics' },
              { id: 'memory', name: 'Memory Test', description: 'Analyze memory usage patterns' },
              { id: 'database', name: 'Database Health Test', description: 'Verify database connectivity and performance' }
            ].map((test) => (
              <Grid item xs={12} sm={6} key={test.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1">{test.name}</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={runningTests[test.id] ? <RefreshIcon /> : <RunIcon />}
                        onClick={() => runDiagnosticTest(test.id)}
                        disabled={runningTests[test.id]}
                      >
                        {runningTests[test.id] ? 'Running...' : 'Run Test'}
                      </Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {test.description}
                    </Typography>
                    {runningTests[test.id] && (
                      <LinearProgress sx={{ mt: 1 }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Accordion expanded={expandedPanel === 'recommendations'} onChange={handleAccordionChange('recommendations')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon color="primary" />
              <Typography variant="h6">Recommendations</Typography>
              <Chip label={recommendations.length} color="primary" size="small" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {recommendations.map((recommendation: any, index: number) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <InfoIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary={recommendation.title}
                    secondary={recommendation.description}
                  />
                  <Chip
                    label={recommendation.priority || 'Medium'}
                    color={
                      recommendation.priority === 'High' ? 'error' :
                      recommendation.priority === 'Low' ? 'success' : 'warning'
                    }
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Quick Actions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => window.location.reload()}
              >
                Refresh System
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<BugIcon />}
                href="/health"
                target="_blank"
              >
                Health Check
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<InfoIcon />}
                href="/diagnostics/system"
                target="_blank"
              >
                System Info
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RunIcon />}
                href="/metrics"
                target="_blank"
              >
                View Metrics
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TroubleshootingTab;