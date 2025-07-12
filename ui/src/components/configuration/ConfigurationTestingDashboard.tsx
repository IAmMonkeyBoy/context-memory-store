/**
 * Configuration Testing Dashboard
 * Phase 7.4.4 - Interactive testing dashboard with real-time results
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Grid,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Tooltip,
  Badge,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Speed as PerformanceIcon,
  Security as SecurityIcon,
  Wifi as ConnectivityIcon,
  Assessment as ValidationIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';

import type {
  ConfigurationTest,
  TestResult,
  TestExecution,
  TestContext,
  TestCategory,
  TestSuite,
  HealthScore
} from '../../types/configurationTesting';
import type { SystemConfiguration } from '../../types/configuration';
import type { EnvironmentType } from '../../types/configurationProfiles';
import {
  configurationTests,
  testRunner,
  predefinedTestSuites,
  calculateHealthScore
} from '../../utils/configurationTesting';

interface ConfigurationTestingDashboardProps {
  configuration: SystemConfiguration;
  environment: EnvironmentType;
  onConfigurationChange?: (config: SystemConfiguration) => void;
}

const CATEGORY_ICONS = {
  connectivity: ConnectivityIcon,
  performance: PerformanceIcon,
  security: SecurityIcon,
  validation: ValidationIcon,
  integration: ValidationIcon
};

const SEVERITY_COLORS = {
  error: 'error',
  warning: 'warning',
  info: 'info',
  success: 'success'
} as const;

const SEVERITY_ICONS = {
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
  success: SuccessIcon
};

export const ConfigurationTestingDashboard: React.FC<ConfigurationTestingDashboardProps> = ({
  configuration,
  environment,
  onConfigurationChange
}) => {
  // State management
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | 'all'>('all');
  const [selectedSuite, setSelectedSuite] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<TestExecution | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [expandedTests, setExpandedTests] = useState<string[]>(['summary']);

  // Filtered tests based on category
  const filteredTests = useMemo(() => {
    if (selectedCategory === 'all') {
      return configurationTests;
    }
    return configurationTests.filter(test => test.category === selectedCategory);
  }, [selectedCategory]);

  // Test statistics
  const testStats = useMemo(() => {
    const results = Object.values(testResults);
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const criticalFailed = results.filter(r => !r.passed && r.severity === 'error').length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    
    return { total, passed, failed, criticalFailed, successRate };
  }, [testResults]);

  // Health score calculation
  const healthScore = useMemo(() => {
    const results = Object.values(testResults);
    return calculateHealthScore(results);
  }, [testResults]);

  // Run tests function
  const runTests = useCallback(async (category?: TestCategory | 'all', suiteId?: string) => {
    setIsRunning(true);
    
    try {
      let testsToRun: string[];
      
      if (suiteId) {
        const suite = predefinedTestSuites.find(s => s.id === suiteId);
        testsToRun = suite ? suite.tests.map(t => t.id) : [];
      } else if (category && category !== 'all') {
        testsToRun = configurationTests.filter(t => t.category === category).map(t => t.id);
      } else {
        testsToRun = configurationTests.map(t => t.id);
      }

      const context: TestContext = {
        environment,
        requestId: `test_${Date.now()}`,
        userId: 'dashboard-user'
      };

      const execution = await testRunner.executeTests(testsToRun, configuration, context);
      setCurrentExecution(execution);
      
      // Update results
      const resultMap: Record<string, TestResult> = {};
      execution.results.forEach(result => {
        resultMap[result.testId] = result;
      });
      setTestResults(resultMap);
      
      // Update history
      setTestHistory(prev => [...execution.results, ...prev].slice(0, 100));
      
    } catch (error: any) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [configuration, environment]);

  // Run single test
  const runSingleTest = useCallback(async (testId: string) => {
    const test = configurationTests.find(t => t.id === testId);
    if (!test) return;

    setIsRunning(true);
    try {
      const context: TestContext = {
        environment,
        requestId: `single_test_${Date.now()}`,
        userId: 'dashboard-user'
      };

      const result = await test.execute(configuration, context);
      setTestResults(prev => ({ ...prev, [testId]: result }));
      setTestHistory(prev => [result, ...prev].slice(0, 100));
    } catch (error: any) {
      const errorResult: TestResult = {
        testId,
        passed: false,
        duration: 0,
        timestamp: new Date().toISOString(),
        message: `Test failed: ${error.message}`,
        severity: 'error',
        suggestions: ['Check test configuration', 'Contact system administrator']
      };
      setTestResults(prev => ({ ...prev, [testId]: errorResult }));
    } finally {
      setIsRunning(false);
    }
  }, [configuration, environment]);

  // Toggle test expansion
  const toggleTestExpansion = useCallback((testId: string) => {
    setExpandedTests(prev => 
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  }, []);

  // Render test result item
  const renderTestResult = useCallback((test: ConfigurationTest) => {
    const result = testResults[test.id];
    const CategoryIcon = CATEGORY_ICONS[test.category];
    const isExpanded = expandedTests.includes(test.id);
    
    let statusIcon = <CircularProgress size={20} />;
    let statusColor: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    
    if (result) {
      const SeverityIcon = SEVERITY_ICONS[result.severity];
      statusIcon = <SeverityIcon />;
      statusColor = SEVERITY_COLORS[result.severity];
    }

    return (
      <Card key={test.id} variant="outlined" sx={{ mb: 1 }}>
        <Accordion 
          expanded={isExpanded} 
          onChange={() => toggleTestExpansion(test.id)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
              <CategoryIcon color="action" />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2">{test.name}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {test.description}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={test.category}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={test.priority}
                  size="small"
                  color={test.priority === 'critical' ? 'error' : test.priority === 'high' ? 'warning' : 'default'}
                />
                {result && (
                  <Chip
                    icon={statusIcon}
                    label={result.passed ? 'PASSED' : 'FAILED'}
                    size="small"
                    color={statusColor}
                  />
                )}
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    runSingleTest(test.id);
                  }}
                  disabled={isRunning}
                  variant="outlined"
                >
                  Run
                </Button>
              </Stack>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {result ? (
              <Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color={result.passed ? 'success.main' : 'error.main'}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </Typography>
                      <Typography variant="caption">Status</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6">{result.duration}ms</Typography>
                      <Typography variant="caption">Duration</Typography>
                    </Paper>
                  </Grid>
                  {result.metrics?.responseTime && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">{result.metrics.responseTime}ms</Typography>
                        <Typography variant="caption">Response Time</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {result.metrics?.score && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">{result.metrics.score}/100</Typography>
                        <Typography variant="caption">Score</Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {result.message}
                </Typography>

                {result.suggestions && result.suggestions.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Suggestions:</Typography>
                    <List dense>
                      {result.suggestions.map((suggestion, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <InfoIcon color="info" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={suggestion} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {result.details && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Details:</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No test results yet. Click "Run" to execute this test.
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      </Card>
    );
  }, [testResults, expandedTests, toggleTestExpansion, runSingleTest, isRunning]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Configuration Testing Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Test Suite</InputLabel>
            <Select
              value={selectedSuite}
              onChange={(e) => setSelectedSuite(e.target.value)}
              label="Test Suite"
            >
              <MenuItem value="">All Tests</MenuItem>
              {predefinedTestSuites.map(suite => (
                <MenuItem key={suite.id} value={suite.id}>
                  {suite.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TestCategory | 'all')}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="connectivity">Connectivity</MenuItem>
              <MenuItem value="performance">Performance</MenuItem>
              <MenuItem value="security">Security</MenuItem>
              <MenuItem value="validation">Validation</MenuItem>
              <MenuItem value="integration">Integration</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={() => runTests(selectedCategory, selectedSuite)}
            disabled={isRunning}
            startIcon={isRunning ? <CircularProgress size={16} /> : <PlayIcon />}
          >
            Run Tests
          </Button>
        </Box>
      </Box>

      {/* Test Summary */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Test Summary" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {testStats.passed}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Passed
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {testStats.failed}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Failed
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {testStats.criticalFailed}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Critical Issues
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {Math.round(testStats.successRate)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Success Rate
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={testStats.successRate} 
                  sx={{ mt: 1 }}
                  color={testStats.successRate >= 80 ? 'success' : testStats.successRate >= 60 ? 'warning' : 'error'}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color={
                  healthScore.grade === 'A' ? 'success.main' :
                  healthScore.grade === 'B' ? 'info.main' :
                  healthScore.grade === 'C' ? 'warning.main' : 'error.main'
                }>
                  {healthScore.score}/100
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Health Score ({healthScore.grade})
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {healthScore.recommendations.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Health Recommendations:</Typography>
              {healthScore.recommendations.map((rec, index) => (
                <Typography key={index} variant="body2">• {rec}</Typography>
              ))}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader 
          title="Test Results" 
          subheader={`Showing ${filteredTests.length} tests`}
        />
        <CardContent>
          {filteredTests.length === 0 ? (
            <Typography variant="body2" color="textSecondary" textAlign="center">
              No tests available for the selected category.
            </Typography>
          ) : (
            <Box>
              {filteredTests.map(renderTestResult)}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Current Execution Status */}
      {isRunning && (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Running tests...</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ConfigurationTestingDashboard;