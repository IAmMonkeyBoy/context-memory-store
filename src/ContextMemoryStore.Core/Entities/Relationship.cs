namespace ContextMemoryStore.Core.Entities;

/// <summary>
/// Represents a relationship between two entities in the graph
/// </summary>
public class Relationship
{
    /// <summary>
    /// Source entity in the relationship
    /// </summary>
    public required string Source { get; set; }

    /// <summary>
    /// Target entity in the relationship
    /// </summary>
    public required string Target { get; set; }

    /// <summary>
    /// Type of relationship (e.g., "REQUIRES", "USES", "EXTENDS")
    /// </summary>
    public required string Type { get; set; }

    /// <summary>
    /// Confidence score for the relationship (0.0 to 1.0)
    /// </summary>
    public double Confidence { get; set; }

    /// <summary>
    /// Document identifier that this relationship was extracted from
    /// </summary>
    public string DocumentId { get; set; } = string.Empty;

    /// <summary>
    /// Additional metadata for the relationship
    /// </summary>
    public Dictionary<string, object> Metadata { get; set; } = new();
}