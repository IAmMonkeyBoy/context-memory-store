namespace ContextMemoryStore.Core.Entities;

/// <summary>
/// Comprehensive system diagnostic information
/// </summary>
public class SystemDiagnostics
{
    /// <summary>
    /// System information
    /// </summary>
    public SystemInfo SystemInfo { get; set; } = new();

    /// <summary>
    /// Runtime information
    /// </summary>
    public RuntimeInfo RuntimeInfo { get; set; } = new();

    /// <summary>
    /// Environment information
    /// </summary>
    public EnvironmentInfo EnvironmentInfo { get; set; } = new();

    /// <summary>
    /// Service status information
    /// </summary>
    public ServiceStatusInfo ServiceStatus { get; set; } = new();

    /// <summary>
    /// Configuration status
    /// </summary>
    public ConfigurationStatus ConfigurationStatus { get; set; } = new();

    /// <summary>
    /// Timestamp when diagnostics were collected
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Performance diagnostic information
/// </summary>
public class PerformanceDiagnostics
{
    /// <summary>
    /// Time range for these diagnostics
    /// </summary>
    public TimeSpan TimeRange { get; set; }

    /// <summary>
    /// Performance metrics
    /// </summary>
    public PerformanceMetrics Performance { get; set; } = new();

    /// <summary>
    /// Resource utilization
    /// </summary>
    public ResourceUtilization ResourceUtilization { get; set; } = new();

    /// <summary>
    /// Performance bottlenecks
    /// </summary>
    public List<PerformanceBottleneck> Bottlenecks { get; set; } = new();

    /// <summary>
    /// Performance recommendations
    /// </summary>
    public List<PerformanceRecommendation> Recommendations { get; set; } = new();

    /// <summary>
    /// Timestamp when diagnostics were collected
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Service connectivity diagnostic information
/// </summary>
public class ServiceConnectivityDiagnostics
{
    /// <summary>
    /// Service connection statuses
    /// </summary>
    public Dictionary<string, ServiceConnectionStatus> ServiceConnections { get; set; } = new();

    /// <summary>
    /// Network connectivity tests
    /// </summary>
    public List<NetworkConnectivityTest> NetworkTests { get; set; } = new();

    /// <summary>
    /// Connection pool statistics
    /// </summary>
    public Dictionary<string, ConnectionPoolStats> ConnectionPools { get; set; } = new();

    /// <summary>
    /// Timestamp when diagnostics were collected
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Configuration diagnostic information
/// </summary>
public class ConfigurationDiagnostics
{
    /// <summary>
    /// Configuration validation results
    /// </summary>
    public List<ConfigurationValidationResult> ValidationResults { get; set; } = new();

    /// <summary>
    /// Environment-specific configuration
    /// </summary>
    public Dictionary<string, string> EnvironmentConfiguration { get; set; } = new();

    /// <summary>
    /// Configuration sources
    /// </summary>
    public List<ConfigurationSource> ConfigurationSources { get; set; } = new();

    /// <summary>
    /// Timestamp when diagnostics were collected
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Resource usage diagnostic information
/// </summary>
public class ResourceUsageDiagnostics
{
    /// <summary>
    /// Memory usage details
    /// </summary>
    public MemoryUsageDetails MemoryUsage { get; set; } = new();

    /// <summary>
    /// CPU usage details
    /// </summary>
    public CpuUsageDetails CpuUsage { get; set; } = new();

    /// <summary>
    /// Disk usage details
    /// </summary>
    public DiskUsageDetails DiskUsage { get; set; } = new();

    /// <summary>
    /// Network usage details
    /// </summary>
    public NetworkUsageDetails NetworkUsage { get; set; } = new();

    /// <summary>
    /// Resource alerts
    /// </summary>
    public List<ResourceAlert> ResourceAlerts { get; set; } = new();

    /// <summary>
    /// Timestamp when diagnostics were collected
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Comprehensive health check results
/// </summary>
public class ComprehensiveHealthCheck
{
    /// <summary>
    /// Overall health status
    /// </summary>
    public HealthStatus OverallStatus { get; set; }

    /// <summary>
    /// Health check results by service
    /// </summary>
    public Dictionary<string, HealthCheckResult> ServiceHealthChecks { get; set; } = new();

    /// <summary>
    /// System health score
    /// </summary>
    public SystemHealthScore SystemHealthScore { get; set; } = new();

    /// <summary>
    /// Critical issues found
    /// </summary>
    public List<CriticalIssue> CriticalIssues { get; set; } = new();

    /// <summary>
    /// Warnings found
    /// </summary>
    public List<HealthWarning> Warnings { get; set; } = new();

    /// <summary>
    /// Health trends
    /// </summary>
    public Dictionary<string, HealthTrend> HealthTrends { get; set; } = new();

    /// <summary>
    /// Timestamp when health check was performed
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Troubleshooting recommendation
/// </summary>
public class TroubleshootingRecommendation
{
    /// <summary>
    /// Recommendation priority
    /// </summary>
    public RecommendationPriority Priority { get; set; }

    /// <summary>
    /// Category of the recommendation
    /// </summary>
    public required string Category { get; set; }

    /// <summary>
    /// Issue description
    /// </summary>
    public required string Issue { get; set; }

    /// <summary>
    /// Recommended action
    /// </summary>
    public required string RecommendedAction { get; set; }

    /// <summary>
    /// Detailed explanation
    /// </summary>
    public string? Details { get; set; }

    /// <summary>
    /// Links to relevant documentation
    /// </summary>
    public List<string> DocumentationLinks { get; set; } = new();

    /// <summary>
    /// Estimated time to resolve
    /// </summary>
    public TimeSpan? EstimatedTimeToResolve { get; set; }

    /// <summary>
    /// Timestamp when recommendation was generated
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Diagnostic report for support
/// </summary>
public class DiagnosticReport
{
    /// <summary>
    /// Report ID
    /// </summary>
    public string ReportId { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// System diagnostics
    /// </summary>
    public SystemDiagnostics SystemDiagnostics { get; set; } = new();

    /// <summary>
    /// Performance diagnostics
    /// </summary>
    public PerformanceDiagnostics PerformanceDiagnostics { get; set; } = new();

    /// <summary>
    /// Service connectivity diagnostics
    /// </summary>
    public ServiceConnectivityDiagnostics ServiceConnectivityDiagnostics { get; set; } = new();

    /// <summary>
    /// Configuration diagnostics
    /// </summary>
    public ConfigurationDiagnostics ConfigurationDiagnostics { get; set; } = new();

    /// <summary>
    /// Resource usage diagnostics
    /// </summary>
    public ResourceUsageDiagnostics ResourceUsageDiagnostics { get; set; } = new();

    /// <summary>
    /// Comprehensive health check
    /// </summary>
    public ComprehensiveHealthCheck ComprehensiveHealthCheck { get; set; } = new();

    /// <summary>
    /// Troubleshooting recommendations
    /// </summary>
    public List<TroubleshootingRecommendation> TroubleshootingRecommendations { get; set; } = new();

    /// <summary>
    /// Recent logs
    /// </summary>
    public List<LogEntry> RecentLogs { get; set; } = new();

    /// <summary>
    /// Report generation timestamp
    /// </summary>
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

// Supporting classes

/// <summary>
/// System information
/// </summary>
public class SystemInfo
{
    public string MachineName { get; set; } = Environment.MachineName;
    public string OperatingSystem { get; set; } = Environment.OSVersion.ToString();
    public int ProcessorCount { get; set; } = Environment.ProcessorCount;
    public bool Is64BitOperatingSystem { get; set; } = Environment.Is64BitOperatingSystem;
    public bool Is64BitProcess { get; set; } = Environment.Is64BitProcess;
    public string UserName { get; set; } = Environment.UserName;
    public string WorkingDirectory { get; set; } = Environment.CurrentDirectory;
    public long WorkingSetMemory { get; set; } = Environment.WorkingSet;
}

/// <summary>
/// Runtime information
/// </summary>
public class RuntimeInfo
{
    public string RuntimeVersion { get; set; } = Environment.Version.ToString();
    public string RuntimeFramework { get; set; } = ".NET";
    public DateTime StartTime { get; set; }
    public TimeSpan Uptime { get; set; }
    public long TotalMemoryAllocated { get; set; }
    public int ThreadCount { get; set; }
    public long Gen0Collections { get; set; }
    public long Gen1Collections { get; set; }
    public long Gen2Collections { get; set; }
}

/// <summary>
/// Environment information
/// </summary>
public class EnvironmentInfo
{
    public string EnvironmentName { get; set; } = string.Empty;
    public Dictionary<string, string> EnvironmentVariables { get; set; } = new();
    public string ApplicationName { get; set; } = string.Empty;
    public string ApplicationVersion { get; set; } = string.Empty;
    public string ContentRoot { get; set; } = string.Empty;
    public string WebRoot { get; set; } = string.Empty;
}

/// <summary>
/// Service status information
/// </summary>
public class ServiceStatusInfo
{
    public Dictionary<string, ServiceStatus> Services { get; set; } = new();
    public List<string> CriticalServices { get; set; } = new();
    public List<string> HealthyServices { get; set; } = new();
    public List<string> UnhealthyServices { get; set; } = new();
}

/// <summary>
/// Configuration status
/// </summary>
public class ConfigurationStatus
{
    public bool IsValid { get; set; }
    public List<string> ValidationErrors { get; set; } = new();
    public List<string> ValidationWarnings { get; set; } = new();
    public Dictionary<string, string> KeySettings { get; set; } = new();
}

/// <summary>
/// Service status
/// </summary>
public enum ServiceStatus
{
    Healthy,
    Unhealthy,
    Unknown,
    Degraded
}

/// <summary>
/// Recommendation priority
/// </summary>
public enum RecommendationPriority
{
    Low,
    Medium,
    High,
    Critical
}

/// <summary>
/// Performance bottleneck
/// </summary>
public class PerformanceBottleneck
{
    public required string Area { get; set; }
    public required string Description { get; set; }
    public double Impact { get; set; }
    public string? SuggestedResolution { get; set; }
}

/// <summary>
/// Performance recommendation
/// </summary>
public class PerformanceRecommendation
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Action { get; set; }
    public double PotentialImpact { get; set; }
    public string? Implementation { get; set; }
}

/// <summary>
/// Resource utilization
/// </summary>
public class ResourceUtilization
{
    public double CpuUtilization { get; set; }
    public double MemoryUtilization { get; set; }
    public double DiskUtilization { get; set; }
    public double NetworkUtilization { get; set; }
    public bool IsOverUtilized { get; set; }
}

/// <summary>
/// Critical issue
/// </summary>
public class CriticalIssue
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Impact { get; set; }
    public required string RecommendedAction { get; set; }
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Health warning
/// </summary>
public class HealthWarning
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public string? RecommendedAction { get; set; }
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Log entry
/// </summary>
public class LogEntry
{
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Exception { get; set; }
    public string? CorrelationId { get; set; }
    public Dictionary<string, object>? Properties { get; set; }
}

/// <summary>
/// Service connection status
/// </summary>
public class ServiceConnectionStatus
{
    public string Status { get; set; } = string.Empty;
    public int ResponseTime { get; set; }
    public DateTime LastConnected { get; set; }
    public int ConnectionPoolSize { get; set; }
    public int ActiveConnections { get; set; }
    public Dictionary<string, object> AdditionalInfo { get; set; } = new();
}

/// <summary>
/// Network connectivity test result
/// </summary>
public class NetworkConnectivityTest
{
    public required string Target { get; set; }
    public required string Result { get; set; }
    public int ResponseTime { get; set; }
    public required string TestType { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Connection pool statistics
/// </summary>
public class ConnectionPoolStats
{
    public int TotalConnections { get; set; }
    public int ActiveConnections { get; set; }
    public int IdleConnections { get; set; }
    public int MaxConnections { get; set; }
    public int ConnectionsCreated { get; set; }
    public int ConnectionsDestroyed { get; set; }
    public TimeSpan AverageConnectionLifetime { get; set; }
}

/// <summary>
/// Configuration validation result
/// </summary>
public class ConfigurationValidationResult
{
    public required string Section { get; set; }
    public bool IsValid { get; set; }
    public List<string> ValidationErrors { get; set; } = new();
    public List<string> ValidationWarnings { get; set; } = new();
    public Dictionary<string, string> Settings { get; set; } = new();
}

/// <summary>
/// Configuration source information
/// </summary>
public class ConfigurationSource
{
    public required string Source { get; set; }
    public int Priority { get; set; }
    public bool Loaded { get; set; }
    public string? FilePath { get; set; }
    public Dictionary<string, string> Settings { get; set; } = new();
}

/// <summary>
/// Memory usage details
/// </summary>
public class MemoryUsageDetails
{
    public long WorkingSet { get; set; }
    public long PrivateMemory { get; set; }
    public long GcMemory { get; set; }
    public double MemoryUtilization { get; set; }
    public long AvailableMemory { get; set; }
    public long TotalMemory { get; set; }
    public long Gen0Collections { get; set; }
    public long Gen1Collections { get; set; }
    public long Gen2Collections { get; set; }
}

/// <summary>
/// CPU usage details
/// </summary>
public class CpuUsageDetails
{
    public double CurrentUsage { get; set; }
    public double AverageUsage { get; set; }
    public double PeakUsage { get; set; }
    public TimeSpan CpuTime { get; set; }
    public int ProcessorCount { get; set; }
    public double SystemCpuUsage { get; set; }
}

/// <summary>
/// Disk usage details
/// </summary>
public class DiskUsageDetails
{
    public long TotalSpace { get; set; }
    public long UsedSpace { get; set; }
    public long AvailableSpace { get; set; }
    public double DiskUtilization { get; set; }
    public Dictionary<string, long> DirectorySizes { get; set; } = new();
}

/// <summary>
/// Network usage details
/// </summary>
public class NetworkUsageDetails
{
    public long BytesSent { get; set; }
    public long BytesReceived { get; set; }
    public double NetworkUtilization { get; set; }
    public int ActiveConnections { get; set; }
    public Dictionary<string, long> ConnectionsByType { get; set; } = new();
}

/// <summary>
/// Resource alert
/// </summary>
public class ResourceAlert
{
    public required string Type { get; set; }
    public AlertSeverity Severity { get; set; }
    public required string Message { get; set; }
    public double Threshold { get; set; }
    public double CurrentValue { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}