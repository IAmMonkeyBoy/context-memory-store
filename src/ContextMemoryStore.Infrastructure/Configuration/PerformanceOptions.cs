namespace ContextMemoryStore.Infrastructure.Configuration;

/// <summary>
/// Configuration options for performance tuning
/// </summary>
public class PerformanceOptions
{
    public const string SectionName = "Performance";

    /// <summary>
    /// Number of worker threads for processing (default: 4)
    /// </summary>
    public int WorkerThreads { get; set; } = 4;

    /// <summary>
    /// Batch size for bulk operations (default: 100)
    /// </summary>
    public int BatchSize { get; set; } = 100;

    /// <summary>
    /// Connection pool size (default: 10)
    /// </summary>
    public int ConnectionPoolSize { get; set; } = 10;

    /// <summary>
    /// Cache size for frequently accessed data (default: 1000)
    /// </summary>
    public int CacheSize { get; set; } = 1000;
}