namespace ContextMemoryStore.Core.Interfaces;

/// <summary>
/// Service interface for managing system lifecycle operations
/// </summary>
public interface ILifecycleService
{
    /// <summary>
    /// Initializes the memory system for a project
    /// </summary>
    /// <param name="projectId">Project identifier</param>
    /// <param name="config">Optional configuration overrides</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Initialization result</returns>
    Task<LifecycleResult> StartEngineAsync(string projectId, Dictionary<string, object>? config = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Stops the memory system and persists data
    /// </summary>
    /// <param name="projectId">Project identifier</param>
    /// <param name="commitMessage">Optional commit message for persistence</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Shutdown result</returns>
    Task<LifecycleResult> StopEngineAsync(string projectId, string? commitMessage = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the current system status
    /// </summary>
    /// <param name="projectId">Project identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>System status</returns>
    Task<SystemStatus> GetStatusAsync(string projectId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Result from lifecycle operations
/// </summary>
public class LifecycleResult
{
    /// <summary>
    /// Whether the operation was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Project identifier
    /// </summary>
    public required string ProjectId { get; set; }

    /// <summary>
    /// Session or snapshot identifier
    /// </summary>
    public string? SessionId { get; set; }

    /// <summary>
    /// Operation timestamp
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Files that were persisted (for stop operations)
    /// </summary>
    public List<string> FilesPersisted { get; set; } = new();

    /// <summary>
    /// Git commit hash (for stop operations)
    /// </summary>
    public string? CommitHash { get; set; }

    /// <summary>
    /// Error message if operation failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Additional metadata about the operation
    /// </summary>
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// Current system status
/// </summary>
public class SystemStatus
{
    /// <summary>
    /// Project identifier
    /// </summary>
    public required string ProjectId { get; set; }

    /// <summary>
    /// Current system state
    /// </summary>
    public string State { get; set; } = "unknown";

    /// <summary>
    /// System uptime in seconds
    /// </summary>
    public long UptimeSeconds { get; set; }

    /// <summary>
    /// Memory usage statistics
    /// </summary>
    public MemoryUsage MemoryUsage { get; set; } = new();

    /// <summary>
    /// Last activity timestamp
    /// </summary>
    public DateTime? LastActivity { get; set; }

    /// <summary>
    /// Service health status
    /// </summary>
    public Dictionary<string, bool> ServiceHealth { get; set; } = new();
}

/// <summary>
/// Memory usage statistics
/// </summary>
public class MemoryUsage
{
    /// <summary>
    /// Number of documents in memory
    /// </summary>
    public long Documents { get; set; }

    /// <summary>
    /// Number of vectors stored
    /// </summary>
    public long Vectors { get; set; }

    /// <summary>
    /// Number of relationships stored
    /// </summary>
    public long Relationships { get; set; }
}