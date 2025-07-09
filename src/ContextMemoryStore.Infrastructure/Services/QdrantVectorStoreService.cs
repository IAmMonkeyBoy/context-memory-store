using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Core.Exceptions;
using ContextMemoryStore.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Qdrant.Client;
using Qdrant.Client.Grpc;

namespace ContextMemoryStore.Infrastructure.Services;

/// <summary>
/// Qdrant implementation of IVectorStoreService for real vector database operations
/// </summary>
public class QdrantVectorStoreService : IVectorStoreService
{
    private readonly QdrantClient _client;
    private readonly ILLMService _llmService;
    private readonly QdrantOptions _options;
    private readonly ILogger<QdrantVectorStoreService> _logger;

    public QdrantVectorStoreService(
        QdrantClient client,
        ILLMService llmService,
        IOptions<QdrantOptions> options,
        ILogger<QdrantVectorStoreService> logger)
    {
        _client = client ?? throw new ArgumentNullException(nameof(client));
        _llmService = llmService ?? throw new ArgumentNullException(nameof(llmService));
        _options = options.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Stores document embeddings in the Qdrant vector database
    /// </summary>
    public async Task<int> StoreEmbeddingsAsync(string documentId, string content, Dictionary<string, object>? metadata = null, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Storing embeddings for document {DocumentId}", documentId);

            // Ensure collection exists
            await EnsureCollectionExistsAsync(cancellationToken);

            // Generate embeddings for the content
            var embeddings = await _llmService.GenerateEmbeddingAsync(content, cancellationToken);

            // Prepare metadata
            var pointMetadata = new Dictionary<string, Value>
            {
                ["document_id"] = documentId,
                ["content"] = content,
                ["stored_at"] = DateTime.UtcNow.ToString("O")
            };

            if (metadata != null)
            {
                foreach (var kvp in metadata)
                {
                    pointMetadata[kvp.Key] = ConvertToQdrantValue(kvp.Value);
                }
            }

            // Create point for insertion
            var point = new PointStruct
            {
                Id = new PointId { Uuid = Guid.NewGuid().ToString() },
                Vectors = embeddings.Select(e => (float)e).ToArray(),
                Payload = { pointMetadata }
            };

            // Insert point into collection
            var response = await _client.UpsertAsync(_options.CollectionName, new[] { point }, cancellationToken: cancellationToken);

            if (response.Status == UpdateStatus.Completed)
            {
                _logger.LogInformation("Successfully stored embeddings for document {DocumentId}", documentId);
                return 1;
            }
            else
            {
                _logger.LogWarning("Failed to store embeddings for document {DocumentId}. Status: {Status}", documentId, response.Status);
                throw new VectorStoreException($"Failed to store embeddings for document {documentId}. Status: {response.Status}");
            }
        }
        catch (Exception ex) when (!(ex is VectorStoreException))
        {
            _logger.LogError(ex, "Error storing embeddings for document {DocumentId}", documentId);
            throw new VectorStoreException($"Error storing embeddings for document {documentId}: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Performs semantic search across stored embeddings
    /// </summary>
    public async Task<IEnumerable<VectorSearchResult>> SearchAsync(string query, int limit = 10, double threshold = 0.5, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Performing semantic search with query: {Query}, limit: {Limit}, threshold: {Threshold}", query, limit, threshold);

            // Ensure collection exists
            await EnsureCollectionExistsAsync(cancellationToken);

            // Generate embeddings for the query
            var queryEmbeddings = await _llmService.GenerateEmbeddingAsync(query, cancellationToken);

            // Perform search
            var searchResponse = await _client.SearchAsync(_options.CollectionName, queryEmbeddings.Select(e => (float)e).ToArray(), limit: (ulong)limit, scoreThreshold: (float)threshold, cancellationToken: cancellationToken);

            var results = new List<VectorSearchResult>();
            foreach (var point in searchResponse)
            {
                if (point.Payload.TryGetValue("document_id", out var documentIdValue) &&
                    point.Payload.TryGetValue("content", out var contentValue))
                {
                    var metadata = new Dictionary<string, object>();
                    foreach (var kvp in point.Payload)
                    {
                        if (kvp.Key != "document_id" && kvp.Key != "content")
                        {
                            metadata[kvp.Key] = ConvertFromQdrantValue(kvp.Value);
                        }
                    }

                    results.Add(new VectorSearchResult
                    {
                        DocumentId = documentIdValue.StringValue,
                        Content = contentValue.StringValue,
                        Score = point.Score,
                        Metadata = metadata
                    });
                }
            }

            _logger.LogInformation("Found {Count} results for query: {Query}", results.Count, query);
            return results;
        }
        catch (Exception ex) when (!(ex is VectorStoreException))
        {
            _logger.LogError(ex, "Error performing search with query: {Query}", query);
            throw new VectorStoreException($"Error performing search with query '{query}': {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Deletes all embeddings for a document
    /// </summary>
    public async Task<int> DeleteEmbeddingsAsync(string documentId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Deleting embeddings for document {DocumentId}", documentId);

            // Ensure collection exists
            await EnsureCollectionExistsAsync(cancellationToken);

            // Search for points with the document ID
            var filter = new Filter
            {
                Must = {
                    new Condition
                    {
                        Field = new FieldCondition
                        {
                            Key = "document_id",
                            Match = new Match { Text = documentId }
                        }
                    }
                }
            };

            var scrollResponse = await _client.ScrollAsync(_options.CollectionName, filter, limit: 1000, cancellationToken: cancellationToken);

            if (scrollResponse.Result.Count == 0)
            {
                _logger.LogInformation("No embeddings found for document {DocumentId}", documentId);
                return 0;
            }

            // Delete points
            var pointIds = scrollResponse.Result.Select(p => new PointId { Uuid = p.Id.Uuid }).ToList();
            var deleteResponse = await _client.DeleteAsync(_options.CollectionName, pointIds, cancellationToken: cancellationToken);

            if (deleteResponse.Status == UpdateStatus.Completed)
            {
                var deletedCount = pointIds.Count;
                _logger.LogInformation("Successfully deleted {Count} embeddings for document {DocumentId}", deletedCount, documentId);
                return deletedCount;
            }
            else
            {
                _logger.LogWarning("Failed to delete embeddings for document {DocumentId}. Status: {Status}", documentId, deleteResponse.Status);
                throw new VectorStoreException($"Failed to delete embeddings for document {documentId}. Status: {deleteResponse.Status}");
            }
        }
        catch (Exception ex) when (!(ex is VectorStoreException))
        {
            _logger.LogError(ex, "Error deleting embeddings for document {DocumentId}", documentId);
            throw new VectorStoreException($"Error deleting embeddings for document {documentId}: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Gets the total number of vectors in the store
    /// </summary>
    public async Task<long> GetVectorCountAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting vector count");

            // Ensure collection exists
            await EnsureCollectionExistsAsync(cancellationToken);

            var collectionInfo = await _client.GetCollectionInfoAsync(_options.CollectionName, cancellationToken: cancellationToken);
            var vectorCount = (long)collectionInfo.VectorsCount;

            _logger.LogDebug("Vector count: {Count}", vectorCount);
            return vectorCount;
        }
        catch (Exception ex) when (!(ex is VectorStoreException))
        {
            _logger.LogError(ex, "Error getting vector count");
            throw new VectorStoreException($"Error getting vector count: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Checks if the vector store service is healthy
    /// </summary>
    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Checking Qdrant health");

            // Try to get collection info to verify connectivity
            var collections = await _client.ListCollectionsAsync(cancellationToken: cancellationToken);
            
            _logger.LogDebug("Qdrant health check successful. Collections: {Count}", collections.Count);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Qdrant health check failed");
            return false;
        }
    }

    /// <summary>
    /// Gets the number of collections in the vector store
    /// </summary>
    public async Task<int> GetCollectionCountAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting collection count");

            var collections = await _client.ListCollectionsAsync(cancellationToken: cancellationToken);
            var collectionCount = collections.Count;

            _logger.LogDebug("Collection count: {Count}", collectionCount);
            return collectionCount;
        }
        catch (Exception ex) when (!(ex is VectorStoreException))
        {
            _logger.LogError(ex, "Error getting collection count");
            throw new VectorStoreException($"Error getting collection count: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Ensures the collection exists, creating it if necessary
    /// </summary>
    private async Task EnsureCollectionExistsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var collections = await _client.ListCollectionsAsync(cancellationToken: cancellationToken);
            var collectionExists = collections.Any(c => c == _options.CollectionName);

            if (!collectionExists)
            {
                _logger.LogInformation("Creating collection {CollectionName}", _options.CollectionName);

                var vectorParams = new VectorParams
                {
                    Size = (ulong)_options.VectorSize,
                    Distance = _options.Distance.ToLowerInvariant() switch
                    {
                        "cosine" => Distance.Cosine,
                        "euclidean" => Distance.Euclid,
                        "dot" => Distance.Dot,
                        _ => Distance.Cosine
                    }
                };

                await _client.CreateCollectionAsync(_options.CollectionName, vectorParams, cancellationToken: cancellationToken);
                _logger.LogInformation("Successfully created collection {CollectionName}", _options.CollectionName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ensuring collection {CollectionName} exists", _options.CollectionName);
            throw new VectorStoreException($"Error ensuring collection {_options.CollectionName} exists: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Converts a .NET object to a Qdrant Value
    /// </summary>
    private static Value ConvertToQdrantValue(object value)
    {
        return value switch
        {
            string s => s,
            int i => i,
            long l => l,
            double d => d,
            float f => f,
            bool b => b,
            DateTime dt => dt.ToString("O"),
            _ => value.ToString() ?? string.Empty
        };
    }

    /// <summary>
    /// Converts a Qdrant Value to a .NET object
    /// </summary>
    private static object ConvertFromQdrantValue(Value value)
    {
        return value.KindCase switch
        {
            Value.KindOneofCase.StringValue => value.StringValue,
            Value.KindOneofCase.IntegerValue => value.IntegerValue,
            Value.KindOneofCase.DoubleValue => value.DoubleValue,
            Value.KindOneofCase.BoolValue => value.BoolValue,
            _ => value.ToString()
        };
    }
}