import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Grid,
  Paper,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subMinutes, subHours, subDays } from 'date-fns';
import { formatBytes, formatDuration } from '@utils';

export interface MetricsData {
  timestamp: Date;
  api?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  };
  memory?: {
    totalDocuments: number;
    totalChunks: number;
    vectorStoreSize: number;
    graphStoreSize: number;
  };
  performance?: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

export interface MetricsChartCardProps {
  /** Metrics history data */
  data: MetricsData[];
  /** Chart height in pixels */
  height?: number;
  /** Default time range */
  defaultTimeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
  /** Default metric category */
  defaultCategory?: 'api' | 'memory' | 'performance' | 'overview';
  /** Chart type for the selected metric */
  chartType?: 'line' | 'area' | 'bar';
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
type MetricCategory = 'api' | 'memory' | 'performance' | 'overview';

const MetricsChartCard: React.FC<MetricsChartCardProps> = ({
  data,
  height = 400,
  defaultTimeRange = '6h',
  defaultCategory = 'overview',
  chartType = 'line',
}) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [selectedCategory, setSelectedCategory] = useState<MetricCategory>(defaultCategory);

  // Filter and prepare data based on time range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let cutoff: Date;

    switch (timeRange) {
      case '1h':
        cutoff = subHours(now, 1);
        break;
      case '6h':
        cutoff = subHours(now, 6);
        break;
      case '24h':
        cutoff = subDays(now, 1);
        break;
      case '7d':
        cutoff = subDays(now, 7);
        break;
      case '30d':
        cutoff = subDays(now, 30);
        break;
      default:
        cutoff = subHours(now, 6);
    }

    return data
      .filter(item => item.timestamp >= cutoff)
      .map(item => ({
        ...item,
        timestamp: item.timestamp.getTime(),
        formattedTime: format(
          item.timestamp, 
          timeRange === '7d' || timeRange === '30d' ? 'MM/dd HH:mm' : 'HH:mm'
        ),
        // API metrics
        requestSuccessRate: item.api 
          ? ((item.api.successfulRequests / item.api.totalRequests) * 100) 
          : 0,
        requestFailureRate: item.api 
          ? ((item.api.failedRequests / item.api.totalRequests) * 100) 
          : 0,
        // Storage metrics in MB
        vectorStoreSizeMB: (item.memory?.vectorStoreSize || 0) / (1024 * 1024),
        graphStoreSizeMB: (item.memory?.graphStoreSize || 0) / (1024 * 1024),
        totalStorageMB: ((item.memory?.vectorStoreSize || 0) + (item.memory?.graphStoreSize || 0)) / (1024 * 1024),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data, timeRange]);

  // Get latest metrics for summary cards
  const latestMetrics = filteredData[filteredData.length - 1];

  const handleTimeRangeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTimeRange: string | null,
  ) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange as TimeRange);
    }
  };

  const formatXAxisTick = (tickItem: number) => {
    const date = new Date(tickItem);
    return format(date, timeRange === '7d' || timeRange === '30d' ? 'MM/dd' : 'HH:mm');
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const timestamp = new Date(label);
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.5,
            boxShadow: 3,
            maxWidth: 250,
          }}
        >
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {format(timestamp, 'MMM dd, HH:mm:ss')}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color, display: 'block' }}
            >
              {entry.name}: {entry.value}
              {entry.dataKey.includes('Rate') ? '%' : 
               entry.dataKey.includes('ResponseTime') ? 'ms' :
               entry.dataKey.includes('Usage') ? '%' :
               entry.dataKey.includes('Size') || entry.dataKey.includes('MB') ? 'MB' :
               entry.dataKey.includes('Documents') || entry.dataKey.includes('Chunks') || entry.dataKey.includes('Requests') ? '' : ''}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  // Render different chart types based on category
  const renderChart = () => {
    if (!filteredData || filteredData.length === 0) {
      return (
        <Box
          sx={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary">
            No metrics data available for the selected time range
          </Typography>
        </Box>
      );
    }

    const ChartComponent = chartType === 'area' ? AreaChart : chartType === 'bar' ? BarChart : LineChart;
    const DataComponent = chartType === 'area' ? Area : chartType === 'bar' ? Bar : Line;

    switch (selectedCategory) {
      case 'api':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ChartComponent data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatXAxisTick}
                scale="time"
              />
              <YAxis yAxisId="requests" />
              <YAxis yAxisId="time" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <DataComponent
                yAxisId="requests"
                dataKey="api.totalRequests"
                stroke={theme.palette.primary.main}
                fill={theme.palette.primary.main}
                name="Total Requests"
              />
              <DataComponent
                yAxisId="requests"
                dataKey="api.successfulRequests"
                stroke={theme.palette.success.main}
                fill={theme.palette.success.main}
                name="Successful Requests"
              />
              <DataComponent
                yAxisId="requests"
                dataKey="api.failedRequests"
                stroke={theme.palette.error.main}
                fill={theme.palette.error.main}
                name="Failed Requests"
              />
              <DataComponent
                yAxisId="time"
                dataKey="api.averageResponseTime"
                stroke={theme.palette.warning.main}
                fill={theme.palette.warning.main}
                name="Avg Response Time (ms)"
              />
            </ChartComponent>
          </ResponsiveContainer>
        );

      case 'memory':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ChartComponent data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatXAxisTick}
                scale="time"
              />
              <YAxis yAxisId="count" />
              <YAxis yAxisId="size" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <DataComponent
                yAxisId="count"
                dataKey="memory.totalDocuments"
                stroke={theme.palette.primary.main}
                fill={theme.palette.primary.main}
                name="Documents"
              />
              <DataComponent
                yAxisId="count"
                dataKey="memory.totalChunks"
                stroke={theme.palette.secondary.main}
                fill={theme.palette.secondary.main}
                name="Chunks"
              />
              <DataComponent
                yAxisId="size"
                dataKey="vectorStoreSizeMB"
                stroke={theme.palette.info.main}
                fill={theme.palette.info.main}
                name="Vector Store (MB)"
              />
              <DataComponent
                yAxisId="size"
                dataKey="graphStoreSizeMB"
                stroke={theme.palette.warning.main}
                fill={theme.palette.warning.main}
                name="Graph Store (MB)"
              />
            </ChartComponent>
          </ResponsiveContainer>
        );

      case 'performance':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ChartComponent data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatXAxisTick}
                scale="time"
              />
              <YAxis domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <DataComponent
                dataKey="performance.cpuUsage"
                stroke={theme.palette.error.main}
                fill={theme.palette.error.main}
                name="CPU Usage (%)"
              />
              <DataComponent
                dataKey="performance.memoryUsage"
                stroke={theme.palette.warning.main}
                fill={theme.palette.warning.main}
                name="Memory Usage (%)"
              />
              <DataComponent
                dataKey="performance.diskUsage"
                stroke={theme.palette.info.main}
                fill={theme.palette.info.main}
                name="Disk Usage (%)"
              />
            </ChartComponent>
          </ResponsiveContainer>
        );

      case 'overview':
      default:
        return (
          <Grid container spacing={2} sx={{ height }}>
            {/* Request Success Rate Pie Chart */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Request Success Rate</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Successful', value: latestMetrics?.api?.successfulRequests || 0, color: theme.palette.success.main },
                      { name: 'Failed', value: latestMetrics?.api?.failedRequests || 0, color: theme.palette.error.main },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {[theme.palette.success.main, theme.palette.error.main].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>

            {/* Storage Distribution */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Storage Distribution</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Vector Store', value: latestMetrics?.vectorStoreSizeMB || 0, color: theme.palette.info.main },
                      { name: 'Graph Store', value: latestMetrics?.graphStoreSizeMB || 0, color: theme.palette.warning.main },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}MB`}
                  >
                    {[theme.palette.info.main, theme.palette.warning.main].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        );
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="System Metrics"
        subheader={`Real-time metrics visualization • ${filteredData.length} data points`}
        action={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Metric Category Selector */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value as MetricCategory)}
              >
                <MenuItem value="overview">Overview</MenuItem>
                <MenuItem value="api">API</MenuItem>
                <MenuItem value="memory">Memory</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
              </Select>
            </FormControl>

            {/* Time Range Selector */}
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={handleTimeRangeChange}
              size="small"
            >
              <ToggleButton value="1h">1H</ToggleButton>
              <ToggleButton value="6h">6H</ToggleButton>
              <ToggleButton value="24h">24H</ToggleButton>
              <ToggleButton value="7d">7D</ToggleButton>
              <ToggleButton value="30d">30D</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        }
      />
      
      <CardContent>
        {/* Latest Metrics Summary */}
        {latestMetrics && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={3}>
                <Chip
                  label={`${latestMetrics.api?.totalRequests || 0} requests`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={3}>
                <Chip
                  label={`${latestMetrics.api?.averageResponseTime || 0}ms avg`}
                  color="info"
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={3}>
                <Chip
                  label={`${latestMetrics.memory?.totalDocuments || 0} docs`}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={3}>
                <Chip
                  label={`${formatBytes((latestMetrics.memory?.vectorStoreSize || 0) + (latestMetrics.memory?.graphStoreSize || 0))} storage`}
                  color="warning"
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Chart */}
        {renderChart()}

        {/* Data Status */}
        {filteredData.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No metrics data available for the selected time range. 
            Try selecting a longer time range or check if the metrics collection is working properly.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricsChartCard;