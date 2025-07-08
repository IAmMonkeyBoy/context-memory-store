namespace ContextMemoryStore.Infrastructure.Configuration;

/// <summary>
/// Configuration options for Neo4j graph database
/// </summary>
public class Neo4jOptions
{
    public const string SectionName = "Neo4j";

    /// <summary>
    /// Neo4j connection URI (default: bolt://localhost:7687)
    /// </summary>
    public string Uri { get; set; } = "bolt://localhost:7687";

    /// <summary>
    /// Username for authentication (default: neo4j)
    /// </summary>
    public string Username { get; set; } = "neo4j";

    /// <summary>
    /// Password for authentication (default: contextmemory for local dev)
    /// </summary>
    public string Password { get; set; } = "contextmemory";

    /// <summary>
    /// Database name (optional, uses default if not specified)
    /// </summary>
    public string? Database { get; set; }

    /// <summary>
    /// Connection timeout in seconds (default: 30)
    /// </summary>
    public int ConnectionTimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Maximum number of concurrent connections (default: 100)
    /// </summary>
    public int MaxConnectionPoolSize { get; set; } = 100;
}