# Diagnostics and Troubleshooting

The Context Memory Store includes comprehensive diagnostic capabilities to help identify, analyze, and resolve system issues quickly and effectively.

## Overview

The diagnostics system provides:

- **System Diagnostics**: Complete system information and configuration
- **Performance Diagnostics**: Performance analysis and bottleneck identification
- **Service Connectivity**: Network and service connection testing
- **Configuration Validation**: Configuration correctness verification
- **Resource Usage**: System resource monitoring and alerting
- **Comprehensive Health Checks**: Multi-dimensional health analysis
- **Troubleshooting Recommendations**: Automated issue resolution guidance

## Diagnostic Endpoints

### System Diagnostics

**GET /api/v1/diagnostics/system**

Provides comprehensive system information including:

- System information (OS, hardware, runtime)
- Runtime details (.NET version, uptime, memory)
- Environment configuration
- Service status overview
- Configuration validation results

**Example Response:**

```json
{
  "systemInfo": {
    "machineName": "dev-server",
    "operatingSystem": "Microsoft Windows NT 10.0.22631.0",
    "processorCount": 12,
    "is64BitOperatingSystem": true,
    "workingSetMemory": 134217728
  },
  "runtimeInfo": {
    "runtimeVersion": "9.0.0",
    "startTime": "2024-01-15T09:00:00Z",
    "uptime": "02:30:45",
    "totalMemoryAllocated": 268435456,
    "threadCount": 25,
    "gen0Collections": 123,
    "gen1Collections": 45,
    "gen2Collections": 6
  },
  "environmentInfo": {
    "environmentName": "Development",
    "applicationName": "ContextMemoryStore.Api",
    "applicationVersion": "1.0.0"
  },
  "serviceStatus": {
    "services": {
      "qdrant": "Healthy",
      "neo4j": "Healthy",
      "ollama": "Healthy"
    },
    "criticalServices": ["qdrant", "neo4j"],
    "healthyServices": ["qdrant", "neo4j", "ollama"],
    "unhealthyServices": []
  }
}
```

### Performance Diagnostics

**GET /api/v1/diagnostics/performance?timeRangeMinutes=30**

Analyzes system performance over a specified time range:

- Performance metrics (response times, throughput)
- Resource utilization analysis
- Performance bottleneck identification
- Optimization recommendations

**Example Response:**

```json
{
  "timeRange": "00:30:00",
  "performance": {
    "averageResponseTime": 245.5,
    "p50ResponseTime": 180.0,
    "p90ResponseTime": 420.0,
    "p95ResponseTime": 650.0,
    "p99ResponseTime": 1200.0,
    "requestsPerSecond": 15.2,
    "successRate": 98.5
  },
  "resourceUtilization": {
    "cpuUtilization": 25.3,
    "memoryUtilization": 45.7,
    "diskUtilization": 12.1,
    "networkUtilization": 8.9,
    "isOverUtilized": false
  },
  "bottlenecks": [
    {
      "area": "Database",
      "description": "Vector search operations showing increased latency",
      "impact": 0.3,
      "suggestedResolution": "Consider optimizing vector index configuration"
    }
  ],
  "recommendations": [
    {
      "title": "Optimize Vector Search",
      "description": "Vector search operations are taking longer than expected",
      "action": "Review vector index configuration and consider reindexing",
      "potentialImpact": 0.4
    }
  ]
}
```

### Service Connectivity Diagnostics

**GET /api/v1/diagnostics/connectivity**

Tests connectivity to all external services:

- Service connection status
- Network connectivity tests
- Connection pool statistics
- Latency measurements

**Example Response:**

```json
{
  "serviceConnections": {
    "qdrant": {
      "status": "Connected",
      "responseTime": 45,
      "lastConnected": "2024-01-15T11:25:30Z",
      "connectionPoolSize": 10,
      "activeConnections": 3
    },
    "neo4j": {
      "status": "Connected",
      "responseTime": 32,
      "lastConnected": "2024-01-15T11:25:28Z",
      "connectionPoolSize": 15,
      "activeConnections": 5
    },
    "ollama": {
      "status": "Connected",
      "responseTime": 156,
      "lastConnected": "2024-01-15T11:25:25Z",
      "availableModels": ["llama3", "mxbai-embed-large"]
    }
  },
  "networkTests": [
    {
      "target": "qdrant:6333",
      "result": "Success",
      "responseTime": 12,
      "testType": "TcpConnect"
    }
  ]
}
```

### Configuration Diagnostics

**GET /api/v1/diagnostics/configuration**

Validates system configuration:

- Configuration validation results
- Environment-specific settings
- Configuration source information
- Missing or invalid configuration detection

**Example Response:**

```json
{
  "validationResults": [
    {
      "section": "QdrantOptions",
      "isValid": true,
      "validationErrors": [],
      "validationWarnings": []
    },
    {
      "section": "Neo4jOptions",
      "isValid": true,
      "validationErrors": [],
      "validationWarnings": ["Password is using default value"]
    }
  ],
  "environmentConfiguration": {
    "ASPNETCORE_ENVIRONMENT": "Development",
    "ASPNETCORE_URLS": "http://+:8080"
  },
  "configurationSources": [
    {
      "source": "appsettings.json",
      "priority": 1,
      "loaded": true
    },
    {
      "source": "appsettings.Development.json",
      "priority": 2,
      "loaded": true
    }
  ]
}
```

### Resource Usage Diagnostics

**GET /api/v1/diagnostics/resources**

Monitors system resource usage:

- Memory usage details
- CPU usage patterns
- Disk usage information
- Network usage statistics
- Resource alerts and warnings

**Example Response:**

```json
{
  "memoryUsage": {
    "workingSet": 134217728,
    "privateMemory": 156734464,
    "gcMemory": 98765432,
    "memoryUtilization": 45.7,
    "availableMemory": 8589934592
  },
  "cpuUsage": {
    "currentUsage": 25.3,
    "averageUsage": 18.7,
    "peakUsage": 67.2,
    "cpuTime": "00:15:32"
  },
  "diskUsage": {
    "totalSpace": 1099511627776,
    "usedSpace": 549755813888,
    "availableSpace": 549755813888,
    "diskUtilization": 50.0
  },
  "resourceAlerts": [
    {
      "type": "Memory",
      "severity": "Warning",
      "message": "Memory usage is approaching 50% of available memory",
      "threshold": 0.5,
      "currentValue": 0.457
    }
  ]
}
```

### Comprehensive Health Check

**GET /api/v1/diagnostics/health-check**

Performs a comprehensive health check across all system components:

- Service health status
- System health scoring
- Critical issue identification
- Health trend analysis

**Example Response:**

```json
{
  "overallStatus": "Healthy",
  "serviceHealthChecks": {
    "qdrant": {
      "serviceName": "qdrant",
      "status": "Healthy",
      "responseTimeMs": 45,
      "score": 95,
      "additionalInfo": {
        "collections": 2,
        "vectors": 1500
      }
    },
    "neo4j": {
      "serviceName": "neo4j",
      "status": "Healthy",
      "responseTimeMs": 32,
      "score": 98,
      "additionalInfo": {
        "nodes": 450,
        "relationships": 890
      }
    }
  },
  "systemHealthScore": {
    "overallScore": 96,
    "serviceScores": {
      "qdrant": 95,
      "neo4j": 98,
      "ollama": 92
    },
    "systemStatus": "Healthy",
    "systemTrend": "Stable",
    "criticalIssues": []
  },
  "criticalIssues": [],
  "warnings": [],
  "healthTrends": {
    "qdrant": "Stable",
    "neo4j": "Improving",
    "ollama": "Stable"
  }
}
```

### Troubleshooting Recommendations

**GET /api/v1/diagnostics/recommendations**

Provides automated troubleshooting recommendations:

- Issue identification and prioritization
- Recommended actions
- Implementation guidance
- Documentation links

**Example Response:**

```json
[
  {
    "priority": "Medium",
    "category": "Performance",
    "issue": "Vector search operations showing increased latency",
    "recommendedAction": "Review vector index configuration and consider reindexing",
    "details": "Vector search operations are taking an average of 450ms, which is above the optimal threshold of 200ms",
    "documentationLinks": [
      "https://docs.qdrant.tech/guides/optimization/"
    ],
    "estimatedTimeToResolve": "00:30:00"
  },
  {
    "priority": "Low",
    "category": "Configuration",
    "issue": "Default password being used for Neo4j",
    "recommendedAction": "Update Neo4j configuration to use a secure password",
    "details": "The Neo4j service is using the default password, which poses a security risk",
    "documentationLinks": [
      "https://neo4j.com/docs/operations-manual/current/authentication-authorization/"
    ],
    "estimatedTimeToResolve": "00:15:00"
  }
]
```

### Diagnostic Report Generation

**GET /api/v1/diagnostics/report**

Generates a comprehensive diagnostic report for support purposes:

- Complete system snapshot
- All diagnostic information
- Recent log entries
- Configuration details
- Performance metrics

**Example Response:**

```json
{
  "reportId": "diag-2024-01-15-11-30-45-abc123",
  "generatedAt": "2024-01-15T11:30:45Z",
  "systemDiagnostics": {
    // Complete system diagnostic information
  },
  "performanceDiagnostics": {
    // Performance analysis data
  },
  "serviceConnectivityDiagnostics": {
    // Service connectivity information
  },
  "configurationDiagnostics": {
    // Configuration validation results
  },
  "resourceUsageDiagnostics": {
    // Resource usage information
  },
  "comprehensiveHealthCheck": {
    // Complete health check results
  },
  "troubleshootingRecommendations": [
    // Automated recommendations
  ],
  "recentLogs": [
    // Recent log entries
  ]
}
```

## Correlation ID Support

All diagnostic endpoints support correlation ID tracking for request tracing:

- **Header**: `X-Correlation-ID: your-correlation-id`
- **Query Parameter**: `?correlationId=your-correlation-id`
- **Auto-generated**: If not provided, automatically generated

## Usage Examples

### Basic Health Check

```bash
curl -H "X-Correlation-ID: health-check-123" \
  http://localhost:8080/api/v1/diagnostics/health-check
```

### Performance Analysis

```bash
curl -H "X-Correlation-ID: perf-analysis-456" \
  "http://localhost:8080/api/v1/diagnostics/performance?timeRangeMinutes=60"
```

### Connectivity Testing

```bash
curl -H "X-Correlation-ID: connectivity-test-789" \
  http://localhost:8080/api/v1/diagnostics/connectivity
```

### Full Diagnostic Report

```bash
curl -H "X-Correlation-ID: full-report-101112" \
  http://localhost:8080/api/v1/diagnostics/report > diagnostic-report.json
```

## Integration with Monitoring Systems

### Grafana Integration

Create dashboard panels for diagnostic metrics:

```json
{
  "targets": [
    {
      "expr": "context_memory_health_score",
      "legendFormat": "Health Score - {{service}}"
    }
  ],
  "title": "Service Health Scores",
  "type": "stat"
}
```

### Prometheus Alerting

Set up alerts based on diagnostic thresholds:

```yaml
- alert: ServiceHealthDegraded
  expr: context_memory_health_score < 70
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Service health degraded"
    description: "Service {{ $labels.service }} health score is {{ $value }}"
```

### Log Aggregation

Correlation IDs enable log correlation across services:

```json
{
  "timestamp": "2024-01-15T11:30:45Z",
  "level": "INFO",
  "message": "Diagnostic report generated",
  "correlationId": "full-report-101112",
  "reportId": "diag-2024-01-15-11-30-45-abc123"
}
```

## Automation and Scripting

### Health Check Automation

```bash
#!/bin/bash
# health-check.sh

CORRELATION_ID="automated-health-$(date +%s)"
RESPONSE=$(curl -s -H "X-Correlation-ID: $CORRELATION_ID" \
  http://localhost:8080/api/v1/diagnostics/health-check)

OVERALL_STATUS=$(echo "$RESPONSE" | jq -r '.overallStatus')

if [ "$OVERALL_STATUS" != "Healthy" ]; then
  echo "Health check failed: $OVERALL_STATUS"
  echo "$RESPONSE" | jq '.criticalIssues'
  exit 1
fi

echo "Health check passed"
```

### Performance Monitoring

```bash
#!/bin/bash
# performance-monitor.sh

CORRELATION_ID="perf-monitor-$(date +%s)"
RESPONSE=$(curl -s -H "X-Correlation-ID: $CORRELATION_ID" \
  "http://localhost:8080/api/v1/diagnostics/performance?timeRangeMinutes=15")

P95_RESPONSE_TIME=$(echo "$RESPONSE" | jq -r '.performance.p95ResponseTime')

if (( $(echo "$P95_RESPONSE_TIME > 1000" | bc -l) )); then
  echo "Performance degraded: P95 response time is ${P95_RESPONSE_TIME}ms"
  echo "$RESPONSE" | jq '.recommendations'
  exit 1
fi

echo "Performance is within acceptable limits"
```

### Configuration Validation

```bash
#!/bin/bash
# config-check.sh

CORRELATION_ID="config-check-$(date +%s)"
RESPONSE=$(curl -s -H "X-Correlation-ID: $CORRELATION_ID" \
  http://localhost:8080/api/v1/diagnostics/configuration)

VALIDATION_ERRORS=$(echo "$RESPONSE" | jq -r '.validationResults[] | select(.isValid == false)')

if [ -n "$VALIDATION_ERRORS" ]; then
  echo "Configuration validation failed"
  echo "$VALIDATION_ERRORS" | jq '.validationErrors'
  exit 1
fi

echo "Configuration is valid"
```

## Best Practices

### Diagnostic Data Collection

1. **Regular Health Checks**: Schedule automated health checks
2. **Performance Baselines**: Establish performance baselines for comparison
3. **Correlation IDs**: Always use correlation IDs for request tracing
4. **Data Retention**: Configure appropriate retention for diagnostic data
5. **Alert Thresholds**: Set meaningful alert thresholds based on system capacity

### Troubleshooting Workflow

1. **Start with Overall Health**: Check comprehensive health status
2. **Identify Problem Areas**: Use performance diagnostics to identify bottlenecks
3. **Check Connectivity**: Verify service connectivity if issues are detected
4. **Validate Configuration**: Ensure configuration is correct and complete
5. **Monitor Resources**: Check resource usage for capacity issues
6. **Follow Recommendations**: Implement automated recommendations
7. **Generate Reports**: Create diagnostic reports for complex issues

### Security Considerations

1. **Sensitive Data**: Diagnostic endpoints may contain sensitive information
2. **Access Control**: Implement appropriate access controls for diagnostic endpoints
3. **Audit Logging**: Log access to diagnostic endpoints
4. **Data Sanitization**: Sanitize diagnostic data before sharing

## Troubleshooting Common Issues

### Service Connectivity Problems

```bash
# Check service connectivity
curl http://localhost:8080/api/v1/diagnostics/connectivity

# Test specific service
curl -X GET "http://localhost:6333/collections" # Qdrant
curl -X GET "http://localhost:7474/db/data" # Neo4j
curl -X GET "http://localhost:11434/api/tags" # Ollama
```

### Performance Issues

```bash
# Get performance metrics
curl "http://localhost:8080/api/v1/diagnostics/performance?timeRangeMinutes=30"

# Check current metrics
curl http://localhost:8080/api/v1/diagnostics/metrics

# Get recommendations
curl http://localhost:8080/api/v1/diagnostics/recommendations
```

### Configuration Issues

```bash
# Validate configuration
curl http://localhost:8080/api/v1/diagnostics/configuration

# Check system info
curl http://localhost:8080/api/v1/diagnostics/system
```

### Resource Issues

```bash
# Check resource usage
curl http://localhost:8080/api/v1/diagnostics/resources

# Monitor memory usage
curl http://localhost:8080/api/v1/diagnostics/metrics | grep memory
```

## Advanced Diagnostics

### Custom Diagnostic Endpoints

Extend the diagnostic system with custom endpoints:

```csharp
[HttpGet("custom")]
public async Task<IActionResult> CustomDiagnostic()
{
    // Custom diagnostic logic
    var customData = await GatherCustomDiagnosticData();
    return Ok(customData);
}
```

### Diagnostic Data Export

Export diagnostic data for analysis:

```bash
# Export diagnostic report
curl http://localhost:8080/api/v1/diagnostics/report > diagnostic-report.json

# Export performance data
curl "http://localhost:8080/api/v1/diagnostics/performance?timeRangeMinutes=60" > performance-data.json

# Export health check data
curl http://localhost:8080/api/v1/diagnostics/health-check > health-check-data.json
```

### Integration with External Tools

Integrate diagnostic data with external monitoring and analysis tools:

```python
# Python example for automated diagnostics
import requests
import json

def get_diagnostic_data():
    headers = {'X-Correlation-ID': 'automated-diagnostics'}
    response = requests.get('http://localhost:8080/api/v1/diagnostics/report', headers=headers)
    return response.json()

def analyze_performance(data):
    # Custom analysis logic
    performance = data['performanceDiagnostics']
    if performance['performance']['p95ResponseTime'] > 1000:
        return "Performance issue detected"
    return "Performance is normal"

# Run diagnostic analysis
data = get_diagnostic_data()
result = analyze_performance(data)
print(result)
```

This comprehensive diagnostic system provides the tools needed to maintain, monitor, and troubleshoot the Context Memory Store effectively.