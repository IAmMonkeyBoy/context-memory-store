namespace ContextMemoryStore.Core.Entities;

/// <summary>
/// Response containing relevant context for a query
/// </summary>
public class ContextResponse
{
    /// <summary>
    /// The original query that was processed
    /// </summary>
    public required string Query { get; set; }

    /// <summary>
    /// The context information retrieved
    /// </summary>
    public ContextData Context { get; set; } = new();

    /// <summary>
    /// Total number of results found
    /// </summary>
    public int TotalResults { get; set; }

    /// <summary>
    /// Time taken to process the query in milliseconds
    /// </summary>
    public int ProcessingTimeMs { get; set; }
}

/// <summary>
/// Context data containing documents, relationships, and summary
/// </summary>
public class ContextData
{
    /// <summary>
    /// Relevant documents for the query
    /// </summary>
    public List<Document> Documents { get; set; } = new();

    /// <summary>
    /// Relevant relationships for the query
    /// </summary>
    public List<Relationship> Relationships { get; set; } = new();

    /// <summary>
    /// Summary of the context
    /// </summary>
    public string? Summary { get; set; }
}