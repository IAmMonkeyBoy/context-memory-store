namespace ContextMemoryStore.Core.Entities;

/// <summary>
/// Health trend data for a service
/// </summary>
public class HealthTrendData
{
    /// <summary>
    /// Service name
    /// </summary>
    public required string ServiceName { get; set; }

    /// <summary>
    /// Time range for the trend data
    /// </summary>
    public required TimeSpan TimeRange { get; set; }

    /// <summary>
    /// Health check results within the time range
    /// </summary>
    public List<HealthCheckResult> Results { get; set; } = new();

    /// <summary>
    /// Average health score
    /// </summary>
    public double AverageScore { get; set; }

    /// <summary>
    /// Minimum health score
    /// </summary>
    public int MinScore { get; set; }

    /// <summary>
    /// Maximum health score
    /// </summary>
    public int MaxScore { get; set; }

    /// <summary>
    /// Current health score
    /// </summary>
    public int CurrentScore { get; set; }

    /// <summary>
    /// Uptime percentage
    /// </summary>
    public double UptimePercentage { get; set; }

    /// <summary>
    /// Average response time in milliseconds
    /// </summary>
    public double AverageResponseTime { get; set; }

    /// <summary>
    /// Health trend direction
    /// </summary>
    public HealthTrend Trend { get; set; }

    /// <summary>
    /// Total number of health checks
    /// </summary>
    public int TotalChecks { get; set; }

    /// <summary>
    /// Number of failed health checks
    /// </summary>
    public int FailedChecks { get; set; }

    /// <summary>
    /// Last updated timestamp
    /// </summary>
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Health trend direction
/// </summary>
public enum HealthTrend
{
    /// <summary>
    /// Health is improving
    /// </summary>
    Improving = 0,

    /// <summary>
    /// Health is stable
    /// </summary>
    Stable = 1,

    /// <summary>
    /// Health is degrading
    /// </summary>
    Degrading = 2,

    /// <summary>
    /// Insufficient data for trend analysis
    /// </summary>
    Unknown = 3
}

/// <summary>
/// Overall system health score
/// </summary>
public class SystemHealthScore
{
    /// <summary>
    /// Overall system health score (0-100)
    /// </summary>
    public int OverallScore { get; set; }

    /// <summary>
    /// Individual service health scores
    /// </summary>
    public Dictionary<string, int> ServiceScores { get; set; } = new();

    /// <summary>
    /// Service weights used in calculation
    /// </summary>
    public Dictionary<string, double> ServiceWeights { get; set; } = new();

    /// <summary>
    /// System health status
    /// </summary>
    public HealthStatus SystemStatus { get; set; }

    /// <summary>
    /// System health trend
    /// </summary>
    public HealthTrend SystemTrend { get; set; }

    /// <summary>
    /// Critical services that are unhealthy
    /// </summary>
    public List<string> CriticalIssues { get; set; } = new();

    /// <summary>
    /// Timestamp when score was calculated
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Health alert recommendation
/// </summary>
public class HealthAlert
{
    /// <summary>
    /// Alert severity level
    /// </summary>
    public AlertSeverity Severity { get; set; }

    /// <summary>
    /// Service name that triggered the alert
    /// </summary>
    public required string ServiceName { get; set; }

    /// <summary>
    /// Alert title
    /// </summary>
    public required string Title { get; set; }

    /// <summary>
    /// Alert message
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Recommended action
    /// </summary>
    public string? RecommendedAction { get; set; }

    /// <summary>
    /// Alert timestamp
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Alert threshold values
    /// </summary>
    public Dictionary<string, object>? ThresholdValues { get; set; }
}

/// <summary>
/// Alert severity levels
/// </summary>
public enum AlertSeverity
{
    /// <summary>
    /// Informational alert
    /// </summary>
    Info = 0,

    /// <summary>
    /// Warning alert
    /// </summary>
    Warning = 1,

    /// <summary>
    /// Error alert
    /// </summary>
    Error = 2,

    /// <summary>
    /// Critical alert
    /// </summary>
    Critical = 3
}