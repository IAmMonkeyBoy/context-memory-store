import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { format, subMinutes, subHours, subDays } from 'date-fns';

export interface HealthTrendData {
  timestamp: Date;
  healthScore: number;
  status: string;
  dependencies?: {
    [service: string]: {
      status: string;
      responseTime: number;
    };
  };
}

export interface HealthTrendChartProps {
  /** Health history data */
  data: HealthTrendData[];
  /** Chart height in pixels */
  height?: number;
  /** Time range for filtering data */
  timeRange?: '1h' | '6h' | '24h' | '7d';
  /** Whether to show service response times */
  showResponseTimes?: boolean;
  /** Whether to allow time range selection */
  allowTimeRangeSelection?: boolean;
}

const HealthTrendChart: React.FC<HealthTrendChartProps> = ({
  data,
  height = 300,
  timeRange = '1h',
  showResponseTimes = true,
  allowTimeRangeSelection = true,
}) => {
  const theme = useTheme();
  const [selectedTimeRange, setSelectedTimeRange] = React.useState(timeRange);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let cutoff: Date;

    switch (selectedTimeRange) {
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
      default:
        cutoff = subHours(now, 1);
    }

    return data
      .filter(item => item.timestamp >= cutoff)
      .map(item => ({
        ...item,
        timestamp: item.timestamp.getTime(),
        formattedTime: format(item.timestamp, selectedTimeRange === '7d' ? 'MM/dd HH:mm' : 'HH:mm'),
        // Extract service response times
        qdrantResponseTime: item.dependencies?.qdrant?.responseTime || 0,
        neo4jResponseTime: item.dependencies?.neo4j?.responseTime || 0,
        ollamaResponseTime: item.dependencies?.ollama?.responseTime || 0,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data, selectedTimeRange]);

  const handleTimeRangeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTimeRange: string | null,
  ) => {
    if (newTimeRange !== null) {
      setSelectedTimeRange(newTimeRange as typeof timeRange);
    }
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
            p: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {format(timestamp, 'MMM dd, HH:mm:ss')}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
              {entry.dataKey === 'healthScore' ? '%' : entry.dataKey.includes('ResponseTime') ? 'ms' : ''}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const formatXAxisTick = (tickItem: number) => {
    const date = new Date(tickItem);
    return format(date, selectedTimeRange === '7d' ? 'MM/dd' : 'HH:mm');
  };

  if (!data || data.length === 0) {
    return (
      <Card sx={{ height: height + 100 }}>
        <CardHeader title="Health Trend" />
        <CardContent>
          <Box
            sx={{
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography color="text.secondary">
              No health trend data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: height + 100 }}>
      <CardHeader
        title="Health Trend"
        action={
          allowTimeRangeSelection && (
            <ToggleButtonGroup
              value={selectedTimeRange}
              exclusive
              onChange={handleTimeRangeChange}
              size="small"
            >
              <ToggleButton value="1h">1H</ToggleButton>
              <ToggleButton value="6h">6H</ToggleButton>
              <ToggleButton value="24h">24H</ToggleButton>
              <ToggleButton value="7d">7D</ToggleButton>
            </ToggleButtonGroup>
          )
        }
      />
      
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXAxisTick}
              scale="time"
            />
            <YAxis
              yAxisId="health"
              domain={[0, 100]}
              label={{ value: 'Health Score (%)', angle: -90, position: 'insideLeft' }}
            />
            {showResponseTimes && (
              <YAxis
                yAxisId="response"
                orientation="right"
                label={{ value: 'Response Time (ms)', angle: 90, position: 'insideRight' }}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Health Score Line */}
            <Line
              yAxisId="health"
              type="monotone"
              dataKey="healthScore"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
              name="Health Score"
            />

            {/* Reference lines for health thresholds */}
            <ReferenceLine yAxisId="health" y={80} stroke="orange" strokeDasharray="5 5" label="Warning" />
            <ReferenceLine yAxisId="health" y={60} stroke="red" strokeDasharray="5 5" label="Critical" />

            {/* Service Response Times */}
            {showResponseTimes && (
              <>
                <Line
                  yAxisId="response"
                  type="monotone"
                  dataKey="qdrantResponseTime"
                  stroke={theme.palette.success.main}
                  strokeWidth={1}
                  dot={false}
                  name="Qdrant"
                />
                <Line
                  yAxisId="response"
                  type="monotone"
                  dataKey="neo4jResponseTime"
                  stroke={theme.palette.info.main}
                  strokeWidth={1}
                  dot={false}
                  name="Neo4j"
                />
                <Line
                  yAxisId="response"
                  type="monotone"
                  dataKey="ollamaResponseTime"
                  stroke={theme.palette.warning.main}
                  strokeWidth={1}
                  dot={false}
                  name="Ollama"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default HealthTrendChart;