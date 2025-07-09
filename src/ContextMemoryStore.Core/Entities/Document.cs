namespace ContextMemoryStore.Core.Entities;

/// <summary>
/// Represents a document stored in the Context Memory Store system
/// </summary>
public class Document
{
    /// <summary>
    /// Unique identifier for the document
    /// </summary>
    public required string Id { get; set; }

    /// <summary>
    /// The content of the document
    /// </summary>
    public required string Content { get; set; }

    /// <summary>
    /// Metadata associated with the document
    /// </summary>
    public DocumentMetadata Metadata { get; set; } = new();

    /// <summary>
    /// Source information for the document
    /// </summary>
    public DocumentSource Source { get; set; } = new();

    /// <summary>
    /// Processing information and status
    /// </summary>
    public DocumentProcessing Processing { get; set; } = new();

    /// <summary>
    /// Date and time when the document was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}