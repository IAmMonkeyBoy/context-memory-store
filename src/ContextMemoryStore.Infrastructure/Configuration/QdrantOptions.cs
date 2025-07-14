namespace ContextMemoryStore.Infrastructure.Configuration;

/// <summary>
/// Configuration options for Qdrant vector database
/// </summary>
public class QdrantOptions
{
    public const string SectionName = "Qdrant";

    /// <summary>
    /// Qdrant server host (default: localhost)
    /// </summary>
    public string Host { get; set; } = "localhost";

    /// <summary>
    /// Qdrant server port (default: 6333 for HTTP API)
    /// </summary>
    public int Port { get; set; } = 6333;

    /// <summary>
    /// Whether to use HTTPS (default: false for local development)
    /// </summary>
    public bool UseHttps { get; set; } = false;

    /// <summary>
    /// API key for authentication (optional for local development)
    /// </summary>
    public string? ApiKey { get; set; }

    /// <summary>
    /// Collection name for storing document embeddings
    /// </summary>
    public string CollectionName { get; set; } = "documents";

    /// <summary>
    /// Vector size for embeddings (default: 1024 for mxbai-embed-large)
    /// </summary>
    public int VectorSize { get; set; } = 1024;

    /// <summary>
    /// Distance metric for similarity search (default: Cosine)
    /// </summary>
    public string Distance { get; set; } = "Cosine";
}