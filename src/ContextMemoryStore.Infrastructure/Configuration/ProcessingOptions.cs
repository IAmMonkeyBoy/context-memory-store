namespace ContextMemoryStore.Infrastructure.Configuration;

/// <summary>
/// Configuration options for document processing settings
/// </summary>
public class ProcessingOptions
{
    public const string SectionName = "Processing";

    /// <summary>
    /// Supported file types for ingestion
    /// </summary>
    public string[] SupportedFormats { get; set; } = ["txt", "md", "json", "yaml", "py", "js", "ts", "cs", "go", "rs"];

    /// <summary>
    /// Maximum file size in MB (default: 50)
    /// </summary>
    public int MaxFileSizeMb { get; set; } = 50;

    /// <summary>
    /// Text chunking size (default: 1000)
    /// </summary>
    public int ChunkSize { get; set; } = 1000;

    /// <summary>
    /// Text chunking overlap (default: 200)
    /// </summary>
    public int ChunkOverlap { get; set; } = 200;

    /// <summary>
    /// Enable automatic summarization (default: true)
    /// </summary>
    public bool AutoSummarize { get; set; } = true;

    /// <summary>
    /// Minimum document length for processing (default: 100)
    /// </summary>
    public int MinDocumentLength { get; set; } = 100;
}