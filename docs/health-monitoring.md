# Health Monitoring System

The Context Memory Store includes a comprehensive health monitoring system that provides real-time insights into system performance, service health, and operational metrics.

## Overview

The health monitoring system consists of several key components:

- **Health Check Caching**: Reduces external service calls with intelligent caching
- **Health Check Scoring**: Provides numerical scoring (0-100) for service health
- **Health Trend Analysis**: Tracks historical health data and identifies trends
- **Correlation ID Tracking**: Enables request tracing across service boundaries
- **Performance Monitoring**: Detailed performance metrics and bottleneck detection

## Health Check Caching

### Purpose

The health check caching service reduces the load on external services by caching health check results for configurable durations.

### Features

- **Configurable TTL**: Set different cache durations for different services
- **Cache Statistics**: Track hit/miss ratios and cache effectiveness
- **Automatic Eviction**: Intelligent cache eviction based on memory pressure
- **Service-Specific Caching**: Different caching strategies per service type

### Usage

```csharp
// Get cached health check result
var cachedResult = await _healthCheckCacheService.GetCachedHealthCheckAsync("qdrant");

// Set health check result with 5-minute cache
await _healthCheckCacheService.SetCachedHealthCheckAsync("qdrant", result, TimeSpan.FromMinutes(5));

// Invalidate cache when needed
await _healthCheckCacheService.InvalidateCachedHealthCheckAsync("qdrant");
```

### Configuration

Cache durations can be configured in `appsettings.json`:

```json
{
  "HealthCheckCache": {
    "DefaultTtl": "00:05:00",
    "ServiceTtl": {
      "qdrant": "00:10:00",
      "neo4j": "00:05:00",
      "ollama": "00:15:00"
    }
  }
}
```

## Health Check Scoring

### Purpose

The health check scoring system provides a numerical score (0-100) for each service based on multiple factors including response time, error rates, and service-specific metrics.

### Scoring Algorithm

The scoring system considers:

1. **Base Score**: Determined by health status (Healthy=100, Unhealthy=0, Timeout=25, Cancelled=50)
2. **Response Time Penalty**: Penalties for slow response times
3. **Service-Specific Adjustments**: Custom scoring logic per service type

### Scoring Thresholds

- **Response Time Penalties**:
  - < 1 second: No penalty
  - 1-3 seconds: 5 point penalty
  - 3-5 seconds: 15 point penalty
  - 5-10 seconds: 30 point penalty
  - > 10 seconds: 50 point penalty

### Service Weights

Different services have different weights in the overall system health score:

- **Qdrant (Vector Store)**: 40% weight
- **Neo4j (Graph Store)**: 30% weight
- **Ollama (LLM Service)**: 20% weight
- **Memory Service**: 10% weight

## Health Trend Analysis

### Purpose

The health trend analysis system tracks historical health data to identify patterns and provide early warning of potential issues.

### Features

- **Trend Detection**: Identifies improving, stable, or degrading health trends
- **Uptime Tracking**: Calculates uptime percentages over time periods
- **Performance Metrics**: Tracks average response times and error rates
- **Historical Data**: Maintains rolling history of health check results

### Trend Classifications

- **Improving**: Health scores trending upward over time
- **Stable**: Consistent health scores within acceptable variance
- **Degrading**: Health scores trending downward over time
- **Unknown**: Insufficient data for trend analysis

### Usage

```csharp
// Get health trend for the last 30 minutes
var trendData = await _healthCheckScoringService.GetHealthTrendAsync("qdrant", TimeSpan.FromMinutes(30));

// Get overall system health score
var systemHealth = await _healthCheckScoringService.GetSystemHealthScoreAsync();

// Get health alerts
var alerts = await _healthCheckScoringService.GetHealthAlertsAsync();
```

## API Endpoints

### Health Check Endpoints

- **GET /api/v1/health** - Basic health check with caching
- **GET /api/v1/health/detailed** - Detailed health check with service breakdown

### Diagnostics Endpoints

- **GET /api/v1/diagnostics/system** - Comprehensive system diagnostics
- **GET /api/v1/diagnostics/performance** - Performance diagnostics
- **GET /api/v1/diagnostics/connectivity** - Service connectivity diagnostics
- **GET /api/v1/diagnostics/configuration** - Configuration diagnostics
- **GET /api/v1/diagnostics/resources** - Resource usage diagnostics
- **GET /api/v1/diagnostics/health-check** - Comprehensive health check
- **GET /api/v1/diagnostics/recommendations** - Troubleshooting recommendations
- **GET /api/v1/diagnostics/report** - Complete diagnostic report
- **GET /api/v1/diagnostics/metrics** - Current system metrics

### Example Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "response_time_ms": 45,
  "checks_passed": 3,
  "checks_total": 3,
  "dependencies": {
    "qdrant": {
      "status": "healthy",
      "response_time_ms": 23,
      "collections": 2,
      "vectors": 1500,
      "score": 95
    },
    "neo4j": {
      "status": "healthy",
      "response_time_ms": 18,
      "nodes": 450,
      "relationships": 890,
      "score": 98
    },
    "ollama": {
      "status": "healthy",
      "response_time_ms": 156,
      "models": ["llama3", "mxbai-embed-large"],
      "score": 92
    }
  }
}
```

## Health Alerts

### Alert Types

The system automatically generates alerts based on health trends and thresholds:

- **Critical**: Services with scores below 25
- **Error**: Services with uptime below 95%
- **Warning**: Services with degrading trends or high response times
- **Info**: General health information

### Alert Thresholds

- **Critical Score**: < 25
- **Warning Score**: < 70 with degrading trend
- **High Response Time**: > 5 seconds average
- **Low Uptime**: < 95% over monitoring period

### Example Alert

```json
{
  "severity": "Warning",
  "serviceName": "qdrant",
  "title": "High Response Time",
  "message": "Service qdrant has high average response time of 5200ms",
  "recommendedAction": "Check service load and network connectivity",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Correlation ID Tracking

### Purpose

Correlation IDs enable request tracing across service boundaries, making it easier to debug issues and track request flow.

### Features

- **Automatic Generation**: Generates unique correlation IDs for each request
- **Header Support**: Accepts correlation IDs from request headers
- **Structured Logging**: Includes correlation IDs in all log entries
- **Cross-Service Tracking**: Passes correlation IDs to downstream services

### Usage

Correlation IDs are automatically handled by the middleware. They can be:

- Provided in the `X-Correlation-ID` header
- Provided as a query parameter: `?correlationId=abc123`
- Automatically generated if not provided

### Implementation

```csharp
// Access correlation ID in controllers
var correlationId = _correlationIdService.GetCorrelationId();

// Include in service calls
await _externalService.CallAsync(correlationId);
```

## Performance Monitoring

### Purpose

The performance monitoring system tracks request performance, identifies bottlenecks, and provides detailed metrics for optimization.

### Features

- **Request Timing**: Tracks response times for all endpoints
- **Endpoint Metrics**: Per-endpoint performance statistics
- **Slow Request Detection**: Automatic detection of slow requests
- **Performance Percentiles**: P50, P90, P95, P99 response time tracking

### Metrics Collected

- **Response Time**: Request duration from start to completion
- **Request Count**: Total number of requests per endpoint
- **Error Rate**: Percentage of failed requests
- **Throughput**: Requests per second
- **Active Requests**: Number of concurrent requests

### Configuration

Performance monitoring can be configured in `appsettings.json`:

```json
{
  "PerformanceMonitoring": {
    "SlowRequestThreshold": "00:00:05",
    "EnableDetailedMetrics": true,
    "SampleRate": 1.0
  }
}
```

## Troubleshooting

### Common Issues

1. **Cache Hit Ratio Too Low**
   - Check cache TTL settings
   - Verify cache size limits
   - Monitor cache eviction patterns

2. **Degrading Health Trends**
   - Check service resource utilization
   - Review recent configuration changes
   - Monitor external service dependencies

3. **High Response Times**
   - Check network connectivity
   - Review service load
   - Verify database query performance

### Diagnostic Commands

```bash
# Check overall system health
curl http://localhost:8080/api/v1/health/detailed

# Get performance diagnostics
curl http://localhost:8080/api/v1/diagnostics/performance?timeRangeMinutes=30

# Get troubleshooting recommendations
curl http://localhost:8080/api/v1/diagnostics/recommendations

# Generate diagnostic report
curl http://localhost:8080/api/v1/diagnostics/report
```

## Best Practices

1. **Health Check Frequency**: Balance between freshness and performance
2. **Alert Thresholds**: Set appropriate thresholds for your environment
3. **Correlation ID Usage**: Always include correlation IDs in logs and service calls
4. **Performance Monitoring**: Monitor key metrics and set up alerts
5. **Trend Analysis**: Regularly review health trends for proactive maintenance

## Integration with Prometheus

The health monitoring system integrates with Prometheus for metrics collection:

```yaml
# Prometheus configuration
scrape_configs:
  - job_name: 'context-memory-store'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

Key metrics exposed:
- `context_memory_health_score` - Health scores by service
- `context_memory_health_checks_total` - Total health checks performed
- `context_memory_health_cache_hits_total` - Cache hit statistics
- `context_memory_request_duration_seconds` - Request duration histogram
- `context_memory_errors_total` - Error counts by type and source