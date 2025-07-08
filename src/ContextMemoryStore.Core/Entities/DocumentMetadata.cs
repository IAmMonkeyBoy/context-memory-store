namespace ContextMemoryStore.Core.Entities;

/// <summary>
/// Metadata associated with a document
/// </summary>
public class DocumentMetadata
{
    /// <summary>
    /// Title of the document
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// Author of the document
    /// </summary>
    public string? Author { get; set; }

    /// <summary>
    /// Type or category of the document
    /// </summary>
    public string? Type { get; set; }

    /// <summary>
    /// Tags associated with the document
    /// </summary>
    public List<string> Tags { get; set; } = new();

    /// <summary>
    /// Date and time when the document was created
    /// </summary>
    public DateTime? Created { get; set; }

    /// <summary>
    /// Date and time when the document was last modified
    /// </summary>
    public DateTime? Modified { get; set; }
}