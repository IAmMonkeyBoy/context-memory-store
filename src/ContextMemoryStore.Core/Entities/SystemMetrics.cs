namespace ContextMemoryStore.Core.Entities;

/// <summary>
/// Current system metrics
/// </summary>
public class SystemMetrics
{
    /// <summary>
    /// System uptime in seconds
    /// </summary>
    public long UptimeSeconds { get; set; }

    /// <summary>
    /// Total memory usage in bytes
    /// </summary>
    public long MemoryUsageBytes { get; set; }

    /// <summary>
    /// CPU usage percentage
    /// </summary>
    public double CpuUsagePercent { get; set; }

    /// <summary>
    /// Garbage collection metrics
    /// </summary>
    public GarbageCollectionMetrics GarbageCollection { get; set; } = new();

    /// <summary>
    /// Thread pool metrics
    /// </summary>
    public ThreadPoolMetrics ThreadPool { get; set; } = new();

    /// <summary>
    /// Request metrics
    /// </summary>
    public RequestMetrics Requests { get; set; } = new();

    /// <summary>
    /// Database metrics
    /// </summary>
    public DatabaseMetrics Database { get; set; } = new();

    /// <summary>
    /// LLM service metrics
    /// </summary>
    public LLMServiceMetrics LLMService { get; set; } = new();

    /// <summary>
    /// Business metrics
    /// </summary>
    public BusinessMetrics Business { get; set; } = new();

    /// <summary>
    /// Timestamp when metrics were collected
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Performance metrics for a specific time range
/// </summary>
public class PerformanceMetrics
{
    /// <summary>
    /// Time range for these metrics
    /// </summary>
    public TimeSpan TimeRange { get; set; }

    /// <summary>
    /// Average response time in milliseconds
    /// </summary>
    public double AverageResponseTime { get; set; }

    /// <summary>
    /// 50th percentile response time
    /// </summary>
    public double P50ResponseTime { get; set; }

    /// <summary>
    /// 90th percentile response time
    /// </summary>
    public double P90ResponseTime { get; set; }

    /// <summary>
    /// 95th percentile response time
    /// </summary>
    public double P95ResponseTime { get; set; }

    /// <summary>
    /// 99th percentile response time
    /// </summary>
    public double P99ResponseTime { get; set; }

    /// <summary>
    /// Requests per second
    /// </summary>
    public double RequestsPerSecond { get; set; }

    /// <summary>
    /// Success rate percentage
    /// </summary>
    public double SuccessRate { get; set; }

    /// <summary>
    /// Throughput metrics by endpoint
    /// </summary>
    public Dictionary<string, EndpointMetrics> EndpointMetrics { get; set; } = new();

    /// <summary>
    /// Timestamp when metrics were collected
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Error metrics for a specific time range
/// </summary>
public class ErrorMetrics
{
    /// <summary>
    /// Time range for these metrics
    /// </summary>
    public TimeSpan TimeRange { get; set; }

    /// <summary>
    /// Total error count
    /// </summary>
    public long TotalErrors { get; set; }

    /// <summary>
    /// Error rate (errors per second)
    /// </summary>
    public double ErrorRate { get; set; }

    /// <summary>
    /// Errors by type
    /// </summary>
    public Dictionary<string, long> ErrorsByType { get; set; } = new();

    /// <summary>
    /// Errors by source
    /// </summary>
    public Dictionary<string, long> ErrorsBySource { get; set; } = new();

    /// <summary>
    /// Recent error samples
    /// </summary>
    public List<ErrorSample> RecentErrors { get; set; } = new();

    /// <summary>
    /// Timestamp when metrics were collected
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Garbage collection metrics
/// </summary>
public class GarbageCollectionMetrics
{
    /// <summary>
    /// Generation 0 collection count
    /// </summary>
    public long Gen0Collections { get; set; }

    /// <summary>
    /// Generation 1 collection count
    /// </summary>
    public long Gen1Collections { get; set; }

    /// <summary>
    /// Generation 2 collection count
    /// </summary>
    public long Gen2Collections { get; set; }

    /// <summary>
    /// Total allocated memory in bytes
    /// </summary>
    public long TotalAllocatedBytes { get; set; }

    /// <summary>
    /// Time spent in GC as percentage
    /// </summary>
    public double TimeInGCPercent { get; set; }
}

/// <summary>
/// Thread pool metrics
/// </summary>
public class ThreadPoolMetrics
{
    /// <summary>
    /// Available worker threads
    /// </summary>
    public int AvailableWorkerThreads { get; set; }

    /// <summary>
    /// Available completion port threads
    /// </summary>
    public int AvailableCompletionPortThreads { get; set; }

    /// <summary>
    /// Maximum worker threads
    /// </summary>
    public int MaxWorkerThreads { get; set; }

    /// <summary>
    /// Maximum completion port threads
    /// </summary>
    public int MaxCompletionPortThreads { get; set; }

    /// <summary>
    /// Queued work items
    /// </summary>
    public long QueuedWorkItems { get; set; }
}

/// <summary>
/// Request metrics
/// </summary>
public class RequestMetrics
{
    /// <summary>
    /// Total requests
    /// </summary>
    public long TotalRequests { get; set; }

    /// <summary>
    /// Successful requests
    /// </summary>
    public long SuccessfulRequests { get; set; }

    /// <summary>
    /// Failed requests
    /// </summary>
    public long FailedRequests { get; set; }

    /// <summary>
    /// Requests per second
    /// </summary>
    public double RequestsPerSecond { get; set; }

    /// <summary>
    /// Average response time in milliseconds
    /// </summary>
    public double AverageResponseTime { get; set; }

    /// <summary>
    /// Active requests
    /// </summary>
    public int ActiveRequests { get; set; }
}

/// <summary>
/// Database metrics
/// </summary>
public class DatabaseMetrics
{
    /// <summary>
    /// Total database operations
    /// </summary>
    public long TotalOperations { get; set; }

    /// <summary>
    /// Successful operations
    /// </summary>
    public long SuccessfulOperations { get; set; }

    /// <summary>
    /// Failed operations
    /// </summary>
    public long FailedOperations { get; set; }

    /// <summary>
    /// Average operation duration in milliseconds
    /// </summary>
    public double AverageOperationDuration { get; set; }

    /// <summary>
    /// Active connections
    /// </summary>
    public int ActiveConnections { get; set; }

    /// <summary>
    /// Records processed
    /// </summary>
    public long RecordsProcessed { get; set; }
}

/// <summary>
/// LLM service metrics
/// </summary>
public class LLMServiceMetrics
{
    /// <summary>
    /// Total LLM operations
    /// </summary>
    public long TotalOperations { get; set; }

    /// <summary>
    /// Successful operations
    /// </summary>
    public long SuccessfulOperations { get; set; }

    /// <summary>
    /// Failed operations
    /// </summary>
    public long FailedOperations { get; set; }

    /// <summary>
    /// Average operation duration in milliseconds
    /// </summary>
    public double AverageOperationDuration { get; set; }

    /// <summary>
    /// Total tokens processed
    /// </summary>
    public long TotalTokens { get; set; }

    /// <summary>
    /// Tokens per second
    /// </summary>
    public double TokensPerSecond { get; set; }

    /// <summary>
    /// Operations by model
    /// </summary>
    public Dictionary<string, long> OperationsByModel { get; set; } = new();
}

/// <summary>
/// Business metrics
/// </summary>
public class BusinessMetrics
{
    /// <summary>
    /// Documents ingested
    /// </summary>
    public long DocumentsIngested { get; set; }

    /// <summary>
    /// Context requests
    /// </summary>
    public long ContextRequests { get; set; }

    /// <summary>
    /// Search requests
    /// </summary>
    public long SearchRequests { get; set; }

    /// <summary>
    /// Average documents per context request
    /// </summary>
    public double AverageDocumentsPerContext { get; set; }

    /// <summary>
    /// Memory usage by document count
    /// </summary>
    public double MemoryUsagePerDocument { get; set; }

    /// <summary>
    /// Custom business metrics
    /// </summary>
    public Dictionary<string, double> CustomMetrics { get; set; } = new();
}

/// <summary>
/// Metrics for a specific endpoint
/// </summary>
public class EndpointMetrics
{
    /// <summary>
    /// Endpoint name
    /// </summary>
    public required string Endpoint { get; set; }

    /// <summary>
    /// Total requests
    /// </summary>
    public long TotalRequests { get; set; }

    /// <summary>
    /// Successful requests
    /// </summary>
    public long SuccessfulRequests { get; set; }

    /// <summary>
    /// Failed requests
    /// </summary>
    public long FailedRequests { get; set; }

    /// <summary>
    /// Average response time in milliseconds
    /// </summary>
    public double AverageResponseTime { get; set; }

    /// <summary>
    /// 95th percentile response time
    /// </summary>
    public double P95ResponseTime { get; set; }

    /// <summary>
    /// Requests per second
    /// </summary>
    public double RequestsPerSecond { get; set; }
}

/// <summary>
/// Error sample for recent errors
/// </summary>
public class ErrorSample
{
    /// <summary>
    /// Error type
    /// </summary>
    public required string ErrorType { get; set; }

    /// <summary>
    /// Error source
    /// </summary>
    public required string Source { get; set; }

    /// <summary>
    /// Error message
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Correlation ID
    /// </summary>
    public string? CorrelationId { get; set; }

    /// <summary>
    /// Error timestamp
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}