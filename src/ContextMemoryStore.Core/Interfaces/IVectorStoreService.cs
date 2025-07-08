using ContextMemoryStore.Core.Entities;

namespace ContextMemoryStore.Core.Interfaces;

/// <summary>
/// Service interface for vector database operations
/// </summary>
public interface IVectorStoreService
{
    /// <summary>
    /// Stores document embeddings in the vector database
    /// </summary>
    /// <param name="documentId">Document identifier</param>
    /// <param name="content">Content to embed</param>
    /// <param name="metadata">Optional metadata</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Number of vectors stored</returns>
    Task<int> StoreEmbeddingsAsync(string documentId, string content, Dictionary<string, object>? metadata = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Performs semantic search across stored embeddings
    /// </summary>
    /// <param name="query">Search query</param>
    /// <param name="limit">Maximum number of results</param>
    /// <param name="threshold">Minimum similarity threshold</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Search results with similarity scores</returns>
    Task<IEnumerable<VectorSearchResult>> SearchAsync(string query, int limit = 10, double threshold = 0.5, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes all embeddings for a document
    /// </summary>
    /// <param name="documentId">Document identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Number of vectors deleted</returns>
    Task<int> DeleteEmbeddingsAsync(string documentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the total number of vectors in the store
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Total vector count</returns>
    Task<long> GetVectorCountAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Result from a vector search operation
/// </summary>
public class VectorSearchResult
{
    /// <summary>
    /// Document identifier
    /// </summary>
    public required string DocumentId { get; set; }

    /// <summary>
    /// Content that matched the search
    /// </summary>
    public required string Content { get; set; }

    /// <summary>
    /// Similarity score (0.0 to 1.0)
    /// </summary>
    public double Score { get; set; }

    /// <summary>
    /// Additional metadata
    /// </summary>
    public Dictionary<string, object> Metadata { get; set; } = new();
}