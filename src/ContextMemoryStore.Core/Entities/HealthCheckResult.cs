namespace ContextMemoryStore.Core.Entities;

/// <summary>
/// Result of a health check operation
/// </summary>
public class HealthCheckResult
{
    /// <summary>
    /// Service name
    /// </summary>
    public required string ServiceName { get; set; }

    /// <summary>
    /// Health status
    /// </summary>
    public required HealthStatus Status { get; set; }

    /// <summary>
    /// Response time in milliseconds
    /// </summary>
    public int ResponseTimeMs { get; set; }

    /// <summary>
    /// Timestamp when the health check was performed
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Error message if health check failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Additional service-specific information
    /// </summary>
    public Dictionary<string, object>? AdditionalInfo { get; set; }

    /// <summary>
    /// Health check score (0-100)
    /// </summary>
    public int Score { get; set; }

    /// <summary>
    /// Whether this result came from cache
    /// </summary>
    public bool FromCache { get; set; }
}

/// <summary>
/// Health status enumeration
/// </summary>
public enum HealthStatus
{
    /// <summary>
    /// Service is healthy
    /// </summary>
    Healthy = 0,

    /// <summary>
    /// Service is unhealthy
    /// </summary>
    Unhealthy = 1,

    /// <summary>
    /// Service health check timed out
    /// </summary>
    Timeout = 2,

    /// <summary>
    /// Service health check was cancelled
    /// </summary>
    Cancelled = 3
}

/// <summary>
/// Health check cache statistics
/// </summary>
public class HealthCheckCacheStatistics
{
    /// <summary>
    /// Total number of health check requests
    /// </summary>
    public long TotalRequests { get; set; }

    /// <summary>
    /// Number of cache hits
    /// </summary>
    public long CacheHits { get; set; }

    /// <summary>
    /// Number of cache misses
    /// </summary>
    public long CacheMisses { get; set; }

    /// <summary>
    /// Cache hit ratio (0-1)
    /// </summary>
    public double CacheHitRatio => TotalRequests > 0 ? (double)CacheHits / TotalRequests : 0;

    /// <summary>
    /// Number of cached entries
    /// </summary>
    public int CachedEntries { get; set; }

    /// <summary>
    /// Last cache update timestamp
    /// </summary>
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}