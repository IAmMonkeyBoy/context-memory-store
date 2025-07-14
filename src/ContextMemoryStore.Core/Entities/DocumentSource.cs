using System.Text.Json.Serialization;

namespace ContextMemoryStore.Core.Entities;

/// <summary>
/// Source information for a document
/// </summary>
public class DocumentSource
{
    /// <summary>
    /// Type of the source (e.g., "file", "url", "api")
    /// </summary>
    [JsonPropertyName("type")]
    public string? Type { get; set; }

    /// <summary>
    /// Path or location of the source
    /// </summary>
    [JsonPropertyName("path")]
    public string? Path { get; set; }

    /// <summary>
    /// Date and time when the source was last modified
    /// </summary>
    public DateTime? Modified { get; set; }
}