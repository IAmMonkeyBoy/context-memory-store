namespace ContextMemoryStore.Infrastructure.Configuration;

/// <summary>
/// Configuration options for project information
/// </summary>
public class ProjectOptions
{
    public const string SectionName = "Project";

    /// <summary>
    /// Project name (default: context-memory-store-api)
    /// </summary>
    public string Name { get; set; } = "context-memory-store-api";

    /// <summary>
    /// Project description
    /// </summary>
    public string Description { get; set; } = "Context Memory Store API for AI Coding Agents";

    /// <summary>
    /// Project version (default: 1.0.0)
    /// </summary>
    public string Version { get; set; } = "1.0.0";
}