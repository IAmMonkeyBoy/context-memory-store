namespace ContextMemoryStore.Core.Entities;

/// <summary>
/// Metadata associated with a document
/// </summary>
public class DocumentMetadata : Dictionary<string, object>
{
    /// <summary>
    /// Title of the document
    /// </summary>
    public string? Title
    {
        get => TryGetValue("title", out var value) ? value as string : null;
        set => this["title"] = value ?? string.Empty;
    }

    /// <summary>
    /// Author of the document
    /// </summary>
    public string? Author
    {
        get => TryGetValue("author", out var value) ? value as string : null;
        set => this["author"] = value ?? string.Empty;
    }

    /// <summary>
    /// Type or category of the document
    /// </summary>
    public string? Type
    {
        get => TryGetValue("type", out var value) ? value as string : null;
        set => this["type"] = value ?? string.Empty;
    }

    /// <summary>
    /// Tags associated with the document
    /// </summary>
    public List<string> Tags
    {
        get => TryGetValue("tags", out var value) ? value as List<string> ?? new List<string>() : new List<string>();
        set => this["tags"] = value;
    }

    /// <summary>
    /// Date and time when the document was created
    /// </summary>
    public DateTime? Created
    {
        get => TryGetValue("created", out var value) ? value as DateTime? : null;
        set => this["created"] = value ?? DateTime.UtcNow;
    }

    /// <summary>
    /// Date and time when the document was last modified
    /// </summary>
    public DateTime? Modified
    {
        get => TryGetValue("modified", out var value) ? value as DateTime? : null;
        set => this["modified"] = value ?? DateTime.UtcNow;
    }
}