namespace ContextMemoryStore.Core.Entities;

/// <summary>
/// Processing information and status for a document
/// </summary>
public class DocumentProcessing
{
    /// <summary>
    /// Current processing status
    /// </summary>
    public string Status { get; set; } = "pending";

    /// <summary>
    /// Number of chunks the document was split into
    /// </summary>
    public int Chunks { get; set; }

    /// <summary>
    /// Number of relationships extracted from the document
    /// </summary>
    public int Relationships { get; set; }

    /// <summary>
    /// Auto-generated summary of the document
    /// </summary>
    public string? Summary { get; set; }
}