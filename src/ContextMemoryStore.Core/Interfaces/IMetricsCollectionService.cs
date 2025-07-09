using ContextMemoryStore.Core.Entities;

namespace ContextMemoryStore.Core.Interfaces;

/// <summary>
/// Service for collecting and managing comprehensive system metrics
/// </summary>
public interface IMetricsCollectionService
{
    /// <summary>
    /// Records a request metric
    /// </summary>
    /// <param name="endpoint">API endpoint</param>
    /// <param name="method">HTTP method</param>
    /// <param name="statusCode">HTTP status code</param>
    /// <param name="responseTime">Response time in milliseconds</param>
    /// <param name="correlationId">Request correlation ID</param>
    void RecordRequest(string endpoint, string method, int statusCode, long responseTime, string? correlationId = null);

    /// <summary>
    /// Records a database operation metric
    /// </summary>
    /// <param name="operation">Database operation type</param>
    /// <param name="duration">Operation duration in milliseconds</param>
    /// <param name="success">Whether the operation was successful</param>
    /// <param name="recordCount">Number of records affected</param>
    void RecordDatabaseOperation(string operation, long duration, bool success, int recordCount = 0);

    /// <summary>
    /// Records an LLM service operation metric
    /// </summary>
    /// <param name="operation">LLM operation type</param>
    /// <param name="model">Model name</param>
    /// <param name="duration">Operation duration in milliseconds</param>
    /// <param name="success">Whether the operation was successful</param>
    /// <param name="tokenCount">Number of tokens processed</param>
    void RecordLLMOperation(string operation, string model, long duration, bool success, int tokenCount = 0);

    /// <summary>
    /// Records a business metric
    /// </summary>
    /// <param name="metric">Metric name</param>
    /// <param name="value">Metric value</param>
    /// <param name="tags">Optional tags</param>
    void RecordBusinessMetric(string metric, double value, Dictionary<string, string>? tags = null);

    /// <summary>
    /// Records an error metric
    /// </summary>
    /// <param name="errorType">Type of error</param>
    /// <param name="source">Error source</param>
    /// <param name="message">Error message</param>
    /// <param name="correlationId">Request correlation ID</param>
    void RecordError(string errorType, string source, string message, string? correlationId = null);

    /// <summary>
    /// Gets current system metrics
    /// </summary>
    /// <returns>Current system metrics</returns>
    Task<SystemMetrics> GetSystemMetricsAsync();

    /// <summary>
    /// Gets performance metrics for a specific time range
    /// </summary>
    /// <param name="timeRange">Time range for metrics</param>
    /// <returns>Performance metrics</returns>
    Task<PerformanceMetrics> GetPerformanceMetricsAsync(TimeSpan timeRange);

    /// <summary>
    /// Gets error metrics for a specific time range
    /// </summary>
    /// <param name="timeRange">Time range for metrics</param>
    /// <returns>Error metrics</returns>
    Task<ErrorMetrics> GetErrorMetricsAsync(TimeSpan timeRange);

    /// <summary>
    /// Starts a performance timer for an operation
    /// </summary>
    /// <param name="operationName">Name of the operation</param>
    /// <returns>Disposable timer</returns>
    IDisposable StartTimer(string operationName);

    /// <summary>
    /// Increments a counter metric
    /// </summary>
    /// <param name="counterName">Name of the counter</param>
    /// <param name="increment">Amount to increment</param>
    /// <param name="tags">Optional tags</param>
    void IncrementCounter(string counterName, long increment = 1, Dictionary<string, string>? tags = null);

    /// <summary>
    /// Sets a gauge metric value
    /// </summary>
    /// <param name="gaugeName">Name of the gauge</param>
    /// <param name="value">Gauge value</param>
    /// <param name="tags">Optional tags</param>
    void SetGauge(string gaugeName, double value, Dictionary<string, string>? tags = null);
}