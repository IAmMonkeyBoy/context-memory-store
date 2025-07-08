namespace ContextMemoryStore.Infrastructure.Configuration;

/// <summary>
/// Configuration options for memory management settings
/// </summary>
public class MemoryOptions
{
    public const string SectionName = "Memory";

    /// <summary>
    /// Maximum number of documents to keep in memory (default: 10000)
    /// </summary>
    public int MaxDocuments { get; set; } = 10000;

    /// <summary>
    /// Maximum age of documents in days (0 = unlimited) (default: 0)
    /// </summary>
    public int MaxAgeDays { get; set; } = 0;

    /// <summary>
    /// Automatic cleanup interval in hours (default: 24)
    /// </summary>
    public int CleanupIntervalHours { get; set; } = 24;

    /// <summary>
    /// Memory summary update interval in minutes (default: 60)
    /// </summary>
    public int SummaryIntervalMinutes { get; set; } = 60;
}