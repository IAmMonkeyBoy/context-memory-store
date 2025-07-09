# Metrics Collection System

The Context Memory Store includes a comprehensive metrics collection system that provides detailed insights into system performance, resource utilization, and business metrics.

## Overview

The metrics collection system provides:

- **Real-time Metrics**: Live system performance data
- **Historical Analysis**: Time-series data for trend analysis
- **Business Metrics**: Domain-specific metrics for document processing
- **Performance Monitoring**: Detailed timing and throughput metrics
- **Error Tracking**: Comprehensive error categorization and analysis

## Metrics Categories

### System Metrics

System-level metrics provide insights into the overall health and performance of the application:

- **Memory Usage**: Working set memory, allocated memory, GC statistics
- **CPU Usage**: Process CPU utilization percentage
- **Thread Pool**: Available threads, queued work items
- **Uptime**: Application uptime in seconds
- **Garbage Collection**: Generation statistics and collection counts

### Request Metrics

HTTP request metrics track API performance and usage patterns:

- **Request Count**: Total requests by endpoint and status code
- **Response Time**: Request duration histograms with percentiles
- **Error Rate**: Failed request percentage
- **Throughput**: Requests per second
- **Active Requests**: Concurrent request count

### Database Metrics

Database operation metrics for both vector and graph stores:

- **Operation Count**: Total database operations by type
- **Operation Duration**: Average and percentile response times
- **Success Rate**: Successful operation percentage
- **Connection Pool**: Active connections and pool statistics
- **Records Processed**: Total records affected by operations

### LLM Service Metrics

Large Language Model service metrics for embeddings and chat operations:

- **Operation Count**: Total LLM operations by type and model
- **Token Usage**: Total tokens processed
- **Response Time**: LLM operation duration
- **Model Usage**: Operations breakdown by model
- **Error Rate**: LLM operation failure percentage

### Business Metrics

Domain-specific metrics for the Context Memory Store:

- **Document Ingestion**: Documents processed per time period
- **Context Requests**: Context retrieval operation count
- **Search Operations**: Search query count and performance
- **Memory Efficiency**: Memory usage per document
- **Vector Operations**: Vector store operation statistics

## Metrics Collection API

### Core Interface

The `IMetricsCollectionService` provides methods for recording various types of metrics:

```csharp
public interface IMetricsCollectionService
{
    void RecordRequest(string endpoint, string method, int statusCode, long responseTime, string? correlationId = null);
    void RecordDatabaseOperation(string operation, long duration, bool success, int recordCount = 0);
    void RecordLLMOperation(string operation, string model, long duration, bool success, int tokenCount = 0);
    void RecordBusinessMetric(string metric, double value, Dictionary<string, string>? tags = null);
    void RecordError(string errorType, string source, string message, string? correlationId = null);
    
    Task<SystemMetrics> GetSystemMetricsAsync();
    Task<PerformanceMetrics> GetPerformanceMetricsAsync(TimeSpan timeRange);
    Task<ErrorMetrics> GetErrorMetricsAsync(TimeSpan timeRange);
    
    IDisposable StartTimer(string operationName);
    void IncrementCounter(string counterName, long increment = 1, Dictionary<string, string>? tags = null);
    void SetGauge(string gaugeName, double value, Dictionary<string, string>? tags = null);
}
```

### Usage Examples

#### Recording Request Metrics

```csharp
// Record a successful API request
_metricsCollectionService.RecordRequest("api/v1/memory/ingest", "POST", 200, 1250, correlationId);

// Record a failed request
_metricsCollectionService.RecordRequest("api/v1/memory/context", "GET", 500, 3000, correlationId);
```

#### Recording Database Operations

```csharp
// Record successful vector store operation
_metricsCollectionService.RecordDatabaseOperation("vector_search", 245, true, 10);

// Record failed graph database operation
_metricsCollectionService.RecordDatabaseOperation("graph_query", 5000, false, 0);
```

#### Recording LLM Operations

```csharp
// Record successful embedding operation
_metricsCollectionService.RecordLLMOperation("embedding", "mxbai-embed-large", 1500, true, 256);

// Record chat completion
_metricsCollectionService.RecordLLMOperation("chat", "llama3", 3200, true, 512);
```

#### Recording Business Metrics

```csharp
// Record document ingestion
_metricsCollectionService.RecordBusinessMetric("documents_ingested", 1.0, new Dictionary<string, string> 
{ 
    { "document_type", "pdf" }, 
    { "size_category", "large" } 
});

// Record context retrieval performance
_metricsCollectionService.RecordBusinessMetric("context_relevance_score", 0.85);
```

#### Using Performance Timers

```csharp
// Time an operation
using var timer = _metricsCollectionService.StartTimer("document_processing");
await ProcessDocumentAsync(document);
// Timer automatically records duration when disposed
```

## Prometheus Integration

The metrics collection system integrates seamlessly with Prometheus for monitoring and alerting.

### Exposed Metrics

#### HTTP Metrics

```
# Request count by endpoint and status
http_requests_total{endpoint="/api/v1/memory/ingest",method="POST",status_code="200"} 1234

# Request duration histogram
http_request_duration_seconds_bucket{endpoint="/api/v1/memory/ingest",method="POST",le="0.1"} 456
http_request_duration_seconds_bucket{endpoint="/api/v1/memory/ingest",method="POST",le="0.5"} 789
http_request_duration_seconds_bucket{endpoint="/api/v1/memory/ingest",method="POST",le="1.0"} 890
```

#### Database Metrics

```
# Database operation count
database_operations_total{operation="vector_search",success="true"} 5678

# Database operation duration
database_operation_duration_seconds{operation="vector_search"} 0.245
```

#### LLM Service Metrics

```
# LLM operation count
llm_operations_total{operation="embedding",model="mxbai-embed-large",success="true"} 2345

# Token processing
llm_tokens_processed_total{operation="embedding",model="mxbai-embed-large"} 456789
```

#### System Metrics

```
# Memory usage
system_memory_usage_bytes 1073741824

# CPU usage
system_cpu_usage_percent 15.5

# Garbage collection
dotnet_gc_gen0_collections_total 123
dotnet_gc_gen1_collections_total 45
dotnet_gc_gen2_collections_total 6
```

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'context-memory-store'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s
```

## Performance Metrics

### Response Time Percentiles

The system tracks response time percentiles for performance analysis:

```csharp
var performanceMetrics = await _metricsCollectionService.GetPerformanceMetricsAsync(TimeSpan.FromHours(1));

Console.WriteLine($"P50: {performanceMetrics.P50ResponseTime}ms");
Console.WriteLine($"P90: {performanceMetrics.P90ResponseTime}ms");
Console.WriteLine($"P95: {performanceMetrics.P95ResponseTime}ms");
Console.WriteLine($"P99: {performanceMetrics.P99ResponseTime}ms");
```

### Throughput Analysis

```csharp
var metrics = await _metricsCollectionService.GetSystemMetricsAsync();

Console.WriteLine($"Requests/sec: {metrics.Requests.RequestsPerSecond}");
Console.WriteLine($"Success rate: {metrics.Requests.SuccessfulRequests / (double)metrics.Requests.TotalRequests * 100}%");
```

## Error Metrics

### Error Categorization

Errors are categorized by type and source for better analysis:

```csharp
var errorMetrics = await _metricsCollectionService.GetErrorMetricsAsync(TimeSpan.FromHours(1));

foreach (var errorType in errorMetrics.ErrorsByType)
{
    Console.WriteLine($"Error type '{errorType.Key}': {errorType.Value} occurrences");
}

foreach (var errorSource in errorMetrics.ErrorsBySource)
{
    Console.WriteLine($"Error source '{errorSource.Key}': {errorSource.Value} occurrences");
}
```

### Error Tracking

```csharp
// Record different types of errors
_metricsCollectionService.RecordError("validation_error", "MemoryController", "Invalid document format", correlationId);
_metricsCollectionService.RecordError("timeout_error", "QdrantService", "Connection timeout", correlationId);
_metricsCollectionService.RecordError("authentication_error", "OllamaService", "API key invalid", correlationId);
```

## Custom Metrics

### Adding Custom Metrics

You can add custom metrics for specific business requirements:

```csharp
// Custom counter
_metricsCollectionService.IncrementCounter("custom_events_total", 1, new Dictionary<string, string> 
{ 
    { "event_type", "user_action" },
    { "action", "document_upload" }
});

// Custom gauge
_metricsCollectionService.SetGauge("queue_size", 42, new Dictionary<string, string> 
{ 
    { "queue_type", "processing" }
});
```

### Business-Specific Metrics

```csharp
// Document processing metrics
_metricsCollectionService.RecordBusinessMetric("document_processing_rate", documentsPerMinute);
_metricsCollectionService.RecordBusinessMetric("average_document_size", averageDocumentSize);
_metricsCollectionService.RecordBusinessMetric("vector_storage_efficiency", vectorsPerMB);

// Context retrieval metrics
_metricsCollectionService.RecordBusinessMetric("context_retrieval_accuracy", accuracyScore);
_metricsCollectionService.RecordBusinessMetric("search_result_relevance", relevanceScore);
```

## Monitoring Dashboards

### Grafana Dashboard Configuration

Create comprehensive dashboards for system monitoring:

```json
{
  "dashboard": {
    "title": "Context Memory Store Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{endpoint}} - {{method}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(errors_total[5m])",
            "legendFormat": "{{error_type}}"
          }
        ]
      }
    ]
  }
}
```

### Key Performance Indicators (KPIs)

Monitor these critical metrics:

1. **System Health**
   - Response time percentiles
   - Error rate
   - Throughput
   - System resource utilization

2. **Business Metrics**
   - Document ingestion rate
   - Context retrieval success rate
   - Search result relevance
   - Memory efficiency

3. **Service Dependencies**
   - Database operation success rate
   - LLM service response time
   - External service availability

## Alerting

### Prometheus Alerting Rules

```yaml
# alerting.yml
groups:
  - name: context-memory-store
    rules:
      - alert: HighErrorRate
        expr: rate(errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time detected"
          description: "95th percentile response time is {{ $value }} seconds"

      - alert: HighMemoryUsage
        expr: system_memory_usage_bytes > 2000000000
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is {{ $value }} bytes"
```

## Configuration

### Metrics Collection Configuration

```json
{
  "MetricsCollection": {
    "EnableSystemMetrics": true,
    "EnableBusinessMetrics": true,
    "SystemMetricsInterval": "00:00:30",
    "HistoryRetentionDays": 30,
    "MaxErrorSamples": 100,
    "MaxResponseTimeSamples": 1000
  }
}
```

### Performance Tuning

```json
{
  "PerformanceMonitoring": {
    "SampleRate": 1.0,
    "EnableDetailedMetrics": true,
    "MaxConcurrentRequests": 100,
    "MetricsBufferSize": 10000
  }
}
```

## Best Practices

1. **Metric Naming**: Use consistent naming conventions
2. **Label Usage**: Use labels for dimensions, not high-cardinality values
3. **Sampling**: Consider sampling for high-volume metrics
4. **Retention**: Configure appropriate retention policies
5. **Alerting**: Set up meaningful alerts with proper thresholds
6. **Dashboard Design**: Create focused dashboards for different audiences

## Troubleshooting

### Common Issues

1. **High Memory Usage**: Monitor metrics buffer size and retention
2. **Performance Impact**: Adjust sampling rates for high-volume endpoints
3. **Missing Metrics**: Verify service registration and middleware configuration
4. **Alert Fatigue**: Review and tune alert thresholds

### Diagnostic Commands

```bash
# Check current metrics
curl http://localhost:8080/api/v1/diagnostics/metrics

# Get performance metrics
curl http://localhost:8080/api/v1/diagnostics/performance

# Check Prometheus metrics
curl http://localhost:8080/metrics
```

## Migration and Scaling

### Adding New Metrics

1. Define the metric in the service interface
2. Implement collection logic
3. Add Prometheus metric definition
4. Update dashboards and alerts
5. Document the new metric

### Scaling Considerations

- Use appropriate metric types (counter, gauge, histogram)
- Consider metric cardinality impact
- Implement proper retention policies
- Monitor metrics collection overhead
- Use sampling for high-volume metrics