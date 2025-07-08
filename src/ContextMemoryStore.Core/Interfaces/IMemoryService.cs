using ContextMemoryStore.Core.Entities;

namespace ContextMemoryStore.Core.Interfaces;

/// <summary>
/// High-level service interface for memory management operations
/// </summary>
public interface IMemoryService
{
    /// <summary>
    /// Ingests a new document into the memory system
    /// </summary>
    /// <param name="document">Document to ingest</param>
    /// <param name="options">Ingestion options</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Ingestion result</returns>
    Task<IngestionResult> IngestDocumentAsync(Document document, IngestionOptions? options = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ingests multiple documents in batch
    /// </summary>
    /// <param name="documents">Documents to ingest</param>
    /// <param name="options">Ingestion options</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Batch ingestion result</returns>
    Task<BatchIngestionResult> IngestDocumentsAsync(IEnumerable<Document> documents, IngestionOptions? options = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves relevant context for a query
    /// </summary>
    /// <param name="query">Search query</param>
    /// <param name="options">Context retrieval options</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Context response</returns>
    Task<ContextResponse> GetContextAsync(string query, ContextOptions? options = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Performs semantic search across all memory
    /// </summary>
    /// <param name="query">Search query</param>
    /// <param name="options">Search options</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Search results</returns>
    Task<SearchResult> SearchAsync(string query, SearchOptions? options = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a document and all associated data
    /// </summary>
    /// <param name="documentId">Document identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> DeleteDocumentAsync(string documentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets memory statistics
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Memory statistics</returns>
    Task<MemoryStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if the memory service is healthy
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if healthy, false otherwise</returns>
    Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Options for document ingestion
/// </summary>
public class IngestionOptions
{
    /// <summary>
    /// Whether to automatically summarize the document
    /// </summary>
    public bool AutoSummarize { get; set; } = true;

    /// <summary>
    /// Whether to extract relationships from the document
    /// </summary>
    public bool ExtractRelationships { get; set; } = true;

    /// <summary>
    /// Chunk size for text splitting
    /// </summary>
    public int ChunkSize { get; set; } = 1000;

    /// <summary>
    /// Chunk overlap for text splitting
    /// </summary>
    public int ChunkOverlap { get; set; } = 200;
}

/// <summary>
/// Options for context retrieval
/// </summary>
public class ContextOptions
{
    /// <summary>
    /// Maximum number of documents to return
    /// </summary>
    public int MaxDocuments { get; set; } = 10;

    /// <summary>
    /// Whether to include relationships in the context
    /// </summary>
    public bool IncludeRelationships { get; set; } = true;

    /// <summary>
    /// Minimum relevance score threshold
    /// </summary>
    public double MinScore { get; set; } = 0.5;

    /// <summary>
    /// Whether to generate a summary of the context
    /// </summary>
    public bool GenerateSummary { get; set; } = true;
}

/// <summary>
/// Options for search operations
/// </summary>
public class SearchOptions
{
    /// <summary>
    /// Maximum number of results to return
    /// </summary>
    public int Limit { get; set; } = 10;

    /// <summary>
    /// Offset for pagination
    /// </summary>
    public int Offset { get; set; } = 0;

    /// <summary>
    /// Minimum relevance score threshold
    /// </summary>
    public double MinScore { get; set; } = 0.5;

    /// <summary>
    /// Metadata filters to apply
    /// </summary>
    public Dictionary<string, object>? Filters { get; set; }

    /// <summary>
    /// Sort order for results
    /// </summary>
    public string SortBy { get; set; } = "relevance";
}

/// <summary>
/// Result from document ingestion
/// </summary>
public class IngestionResult
{
    /// <summary>
    /// Document identifier
    /// </summary>
    public required string DocumentId { get; set; }

    /// <summary>
    /// Processing status
    /// </summary>
    public required string Status { get; set; }

    /// <summary>
    /// Number of chunks created
    /// </summary>
    public int ChunksCreated { get; set; }

    /// <summary>
    /// Number of relationships extracted
    /// </summary>
    public int RelationshipsExtracted { get; set; }

    /// <summary>
    /// Processing time in milliseconds
    /// </summary>
    public int ProcessingTimeMs { get; set; }

    /// <summary>
    /// Generated summary
    /// </summary>
    public string? Summary { get; set; }
}

/// <summary>
/// Result from batch document ingestion
/// </summary>
public class BatchIngestionResult
{
    /// <summary>
    /// Total number of documents processed
    /// </summary>
    public int TotalDocuments { get; set; }

    /// <summary>
    /// Number of successfully processed documents
    /// </summary>
    public int SuccessfulDocuments { get; set; }

    /// <summary>
    /// Number of failed documents
    /// </summary>
    public int FailedDocuments { get; set; }

    /// <summary>
    /// Individual ingestion results
    /// </summary>
    public List<IngestionResult> Results { get; set; } = new();

    /// <summary>
    /// Total processing time in milliseconds
    /// </summary>
    public int TotalProcessingTimeMs { get; set; }
}

/// <summary>
/// Result from search operations
/// </summary>
public class SearchResult
{
    /// <summary>
    /// Search query
    /// </summary>
    public required string Query { get; set; }

    /// <summary>
    /// Found documents
    /// </summary>
    public List<Document> Documents { get; set; } = new();

    /// <summary>
    /// Total number of results (for pagination)
    /// </summary>
    public int TotalResults { get; set; }

    /// <summary>
    /// Processing time in milliseconds
    /// </summary>
    public int ProcessingTimeMs { get; set; }
}

/// <summary>
/// Memory system statistics
/// </summary>
public class MemoryStatistics
{
    /// <summary>
    /// Total number of documents
    /// </summary>
    public long DocumentCount { get; set; }

    /// <summary>
    /// Total number of vectors
    /// </summary>
    public long VectorCount { get; set; }

    /// <summary>
    /// Total number of relationships
    /// </summary>
    public long RelationshipCount { get; set; }

    /// <summary>
    /// Total memory usage in bytes
    /// </summary>
    public long MemoryUsageBytes { get; set; }

    /// <summary>
    /// Last update timestamp
    /// </summary>
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}