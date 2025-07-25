// Utility functions for parsing Prometheus metrics format

export interface PrometheusMetric {
  name: string;
  labels: Record<string, string>;
  value: number;
  timestamp?: number;
}

export interface ParsedPrometheusMetrics {
  [metricName: string]: PrometheusMetric[];
}

/**
 * Parse Prometheus text format metrics
 * @param metricsText Raw Prometheus metrics text
 * @returns Parsed metrics object
 */
export const parsePrometheusMetrics = (metricsText: string): ParsedPrometheusMetrics => {
  const metrics: ParsedPrometheusMetrics = {};
  const lines = metricsText.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  for (const line of lines) {
    try {
      const metric = parseMetricLine(line);
      if (metric) {
        if (!metrics[metric.name]) {
          metrics[metric.name] = [];
        }
        metrics[metric.name].push(metric);
      }
    } catch (error) {
      console.warn('Failed to parse metric line:', line, error);
    }
  }

  return metrics;
};

/**
 * Parse a single metric line
 * @param line Single line from Prometheus metrics
 * @returns Parsed metric or null
 */
const parseMetricLine = (line: string): PrometheusMetric | null => {
  // Match pattern: metric_name{label="value",label2="value2"} value timestamp
  const metricRegex = /^([a-zA-Z_:][a-zA-Z0-9_:]*)((?:\{[^}]*\})?)?\s+([^\s]+)(?:\s+(\d+))?$/;
  const match = line.match(metricRegex);

  if (!match) {
    return null;
  }

  const [, name, labelsStr, valueStr, timestampStr] = match;
  const value = parseFloat(valueStr);

  if (isNaN(value)) {
    return null;
  }

  const labels = parseLabels(labelsStr || '');
  const timestamp = timestampStr ? parseInt(timestampStr, 10) : Date.now();

  return {
    name,
    labels,
    value,
    timestamp,
  };
};

/**
 * Parse labels from label string
 * @param labelsStr Label string like {label="value",label2="value2"}
 * @returns Labels object
 */
const parseLabels = (labelsStr: string): Record<string, string> => {
  const labels: Record<string, string> = {};

  if (!labelsStr || labelsStr === '{}') {
    return labels;
  }

  // Remove surrounding braces
  const cleanStr = labelsStr.slice(1, -1);
  
  // Split by comma but respect quoted values
  const labelPairs = cleanStr.match(/[^,]+="[^"]*"|[^,]+=[^,]*/g) || [];

  for (const pair of labelPairs) {
    const [key, value] = pair.split('=', 2);
    if (key && value) {
      // Remove quotes from value if present
      const cleanValue = value.replace(/^"(.*)"$/, '$1');
      labels[key.trim()] = cleanValue;
    }
  }

  return labels;
};

/**
 * Extract specific metric by name and optional labels
 * @param metrics Parsed metrics object
 * @param name Metric name
 * @param labelFilters Optional label filters
 * @returns Array of matching metrics
 */
export const getMetricByName = (
  metrics: ParsedPrometheusMetrics,
  name: string,
  labelFilters?: Record<string, string>
): PrometheusMetric[] => {
  const metricList = metrics[name] || [];

  if (!labelFilters || Object.keys(labelFilters).length === 0) {
    return metricList;
  }

  return metricList.filter(metric => {
    return Object.entries(labelFilters).every(([key, value]) => {
      return metric.labels[key] === value;
    });
  });
};

/**
 * Get metric value by name and labels
 * @param metrics Parsed metrics object
 * @param name Metric name
 * @param labelFilters Optional label filters
 * @returns Metric value or 0 if not found
 */
export const getMetricValue = (
  metrics: ParsedPrometheusMetrics,
  name: string,
  labelFilters?: Record<string, string>
): number => {
  const matchingMetrics = getMetricByName(metrics, name, labelFilters);
  return matchingMetrics.length > 0 ? matchingMetrics[0].value : 0;
};

/**
 * Calculate rate of change for counter metrics
 * @param current Current metric value
 * @param previous Previous metric value
 * @param timeWindow Time window in seconds
 * @returns Rate per second
 */
export const calculateRate = (current: number, previous: number, timeWindow: number): number => {
  if (timeWindow <= 0 || current < previous) {
    return 0;
  }
  return (current - previous) / timeWindow;
};

/**
 * Convert parsed Prometheus metrics to dashboard metrics format
 * @param prometheusMetrics Parsed Prometheus metrics
 * @returns Dashboard-compatible metrics object
 */
export const convertToMetricsData = (prometheusMetrics: ParsedPrometheusMetrics) => {
  const timestamp = new Date();

  // Extract API metrics from actual .NET metrics
  // Sum all request metrics since we have multiple endpoints
  const contextMemoryRequests = getMetricByName(prometheusMetrics, 'context_memory_requests_total');
  const httpRequests = getMetricByName(prometheusMetrics, 'http_requests_total');
  
  let totalRequests = 0;
  let successfulRequests = 0;
  
  // Sum context_memory_requests_total
  for (const metric of contextMemoryRequests) {
    totalRequests += metric.value;
    if (metric.labels.status === 'success') {
      successfulRequests += metric.value;
    }
  }
  
  // Sum http_requests_total with status_code 200
  for (const metric of httpRequests) {
    totalRequests += metric.value;
    if (metric.labels.status_code === '200') {
      successfulRequests += metric.value;
    }
  }
  
  // Failed requests calculation
  const failedRequests = Math.max(0, totalRequests - successfulRequests);
  
  // Average response time from duration metrics (convert seconds to milliseconds)
  const contextMemoryDurationSums = getMetricByName(prometheusMetrics, 'context_memory_request_duration_seconds_sum');
  const contextMemoryDurationCounts = getMetricByName(prometheusMetrics, 'context_memory_request_duration_seconds_count');
  const httpDurationSums = getMetricByName(prometheusMetrics, 'http_request_duration_seconds_sum');
  const httpDurationCounts = getMetricByName(prometheusMetrics, 'http_request_duration_seconds_count');
  
  let totalDurationSum = 0;
  let totalDurationCount = 0;
  
  // Sum context_memory durations
  for (const metric of contextMemoryDurationSums) {
    totalDurationSum += metric.value;
  }
  for (const metric of contextMemoryDurationCounts) {
    totalDurationCount += metric.value;
  }
  
  // Sum http durations
  for (const metric of httpDurationSums) {
    totalDurationSum += metric.value;
  }
  for (const metric of httpDurationCounts) {
    totalDurationCount += metric.value;
  }
  
  const averageResponseTime = totalDurationCount > 0 ? (totalDurationSum / totalDurationCount) * 1000 : 0;

  // Extract memory metrics from custom context_memory metrics
  const totalDocuments = getMetricValue(prometheusMetrics, 'context_memory_documents_total');
  const totalChunks = getMetricValue(prometheusMetrics, 'context_memory_vectors_total'); // vectors as proxy for chunks
  const totalRelationships = getMetricValue(prometheusMetrics, 'context_memory_relationships_total');
  
  // Memory usage metrics
  const memoryUsageBytes = getMetricValue(prometheusMetrics, 'context_memory_usage_bytes');
  const vectorStoreSize = memoryUsageBytes * 0.7; // Estimate vector store as 70% of total memory
  const graphStoreSize = memoryUsageBytes * 0.3;  // Estimate graph store as 30% of total memory

  // Extract performance metrics from system metrics
  const cpuUsage = getMetricValue(prometheusMetrics, 'system_cpu_usage_percent') ||
                   getMetricValue(prometheusMetrics, 'system_runtime_cpu_usage') ||
                   (getMetricValue(prometheusMetrics, 'process_cpu_seconds_total') * 100);
  
  const workingSetBytes = getMetricValue(prometheusMetrics, 'process_working_set_bytes') ||
                         getMetricValue(prometheusMetrics, 'system_runtime_dotnet_process_memory_working_set');
  
  const virtualMemoryBytes = getMetricValue(prometheusMetrics, 'process_virtual_memory_bytes') ||
                            getMetricValue(prometheusMetrics, 'system_memory_usage_bytes');
  
  // Calculate memory usage percentage
  const memoryUsage = virtualMemoryBytes > 0 ? 
                     Math.min(100, (workingSetBytes / virtualMemoryBytes) * 100) : 
                     Math.min(100, workingSetBytes / (1024 * 1024 * 1024) * 10); // Rough estimate
  
  // Disk usage - use a reasonable estimate since we don't have direct disk metrics
  const diskUsage = Math.min(50, Math.max(10, (memoryUsageBytes / (1024 * 1024 * 1024)) * 5)); // Rough estimate based on memory usage

  const result = {
    timestamp,
    api: {
      totalRequests: Math.round(totalRequests),
      successfulRequests: Math.round(successfulRequests),
      failedRequests: Math.round(failedRequests),
      averageResponseTime: Math.round(averageResponseTime),
    },
    memory: {
      totalDocuments: Math.round(totalDocuments),
      totalChunks: Math.round(totalChunks + totalRelationships), // Combined chunks and relationships
      vectorStoreSize: Math.round(vectorStoreSize),
      graphStoreSize: Math.round(graphStoreSize),
    },
    performance: {
      cpuUsage: Math.min(100, Math.max(0, cpuUsage)),
      memoryUsage: Math.min(100, Math.max(0, memoryUsage)),
      diskUsage: Math.min(100, Math.max(0, diskUsage)),
    },
  };

  // Debug logging to help troubleshoot
  console.debug('[Metrics] Conversion result:', {
    input: {
      totalRequests,
      successfulRequests,
      totalDurationSum,
      totalDurationCount,
      totalDocuments,
      totalChunks,
      memoryUsageBytes,
      cpuUsage,
      workingSetBytes,
      virtualMemoryBytes
    },
    output: result
  });

  return result;
};

/**
 * Mock Prometheus metrics for development
 * @returns Mock Prometheus metrics text
 */
export const generateMockPrometheusMetrics = (): string => {
  const now = Date.now();
  return `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{status="200"} ${1200 + Math.floor(Math.random() * 100)} ${now}
http_requests_total{status="400"} ${30 + Math.floor(Math.random() * 10)} ${now}
http_requests_total{status="500"} ${5 + Math.floor(Math.random() * 5)} ${now}
http_requests_total 1247 ${now}

# HELP api_request_duration_ms_avg Average API request duration in milliseconds
# TYPE api_request_duration_ms_avg gauge
api_request_duration_ms_avg ${150 + Math.floor(Math.random() * 50)} ${now}

# HELP memory_documents_count Total number of documents in memory store
# TYPE memory_documents_count gauge
memory_documents_count ${340 + Math.floor(Math.random() * 20)} ${now}

# HELP memory_chunks_count Total number of chunks processed
# TYPE memory_chunks_count gauge
memory_chunks_count ${1520 + Math.floor(Math.random() * 50)} ${now}

# HELP memory_vector_store_bytes Vector store size in bytes
# TYPE memory_vector_store_bytes gauge
memory_vector_store_bytes ${45000000 + Math.floor(Math.random() * 1000000)} ${now}

# HELP memory_graph_store_bytes Graph store size in bytes
# TYPE memory_graph_store_bytes gauge
memory_graph_store_bytes ${2800000 + Math.floor(Math.random() * 100000)} ${now}

# HELP system_cpu_usage_percent CPU usage percentage
# TYPE system_cpu_usage_percent gauge
system_cpu_usage_percent ${20 + Math.floor(Math.random() * 30)} ${now}

# HELP system_memory_usage_percent Memory usage percentage
# TYPE system_memory_usage_percent gauge
system_memory_usage_percent ${60 + Math.floor(Math.random() * 20)} ${now}

# HELP system_disk_usage_percent Disk usage percentage
# TYPE system_disk_usage_percent gauge
system_disk_usage_percent ${30 + Math.floor(Math.random() * 15)} ${now}
`.trim();
};