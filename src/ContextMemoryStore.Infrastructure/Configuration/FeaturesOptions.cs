namespace ContextMemoryStore.Infrastructure.Configuration;

/// <summary>
/// Configuration options for feature flags
/// </summary>
public class FeaturesOptions
{
    public const string SectionName = "Features";

    /// <summary>
    /// Enable MCP protocol support (default: true)
    /// </summary>
    public bool McpEnabled { get; set; } = true;

    /// <summary>
    /// Enable automatic relationship extraction (default: true)
    /// </summary>
    public bool RelationshipExtraction { get; set; } = true;

    /// <summary>
    /// Enable context-aware summarization (default: true)
    /// </summary>
    public bool ContextualSummarization { get; set; } = true;

    /// <summary>
    /// Enable semantic search (default: true)
    /// </summary>
    public bool SemanticSearch { get; set; } = true;
}