using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Core.Exceptions;
using ContextMemoryStore.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using static ContextMemoryStore.Core.Interfaces.IMemoryService;

namespace ContextMemoryStore.Infrastructure.Services;

/// <summary>
/// Real implementation of IMemoryService that orchestrates all memory operations
/// </summary>
public class MemoryService : IMemoryService
{
    private readonly IVectorStoreService _vectorStoreService;
    private readonly IGraphStoreService _graphStoreService;
    private readonly ILLMService _llmService;
    private readonly IDocumentRepository _documentRepository;
    private readonly MemoryOptions _memoryOptions;
    private readonly ProcessingOptions _processingOptions;
    private readonly FeaturesOptions _featuresOptions;
    private readonly ILogger<MemoryService> _logger;

    public MemoryService(
        IVectorStoreService vectorStoreService,
        IGraphStoreService graphStoreService,
        ILLMService llmService,
        IDocumentRepository documentRepository,
        IOptions<MemoryOptions> memoryOptions,
        IOptions<ProcessingOptions> processingOptions,
        IOptions<FeaturesOptions> featuresOptions,
        ILogger<MemoryService> logger)
    {
        _vectorStoreService = vectorStoreService ?? throw new ArgumentNullException(nameof(vectorStoreService));
        _graphStoreService = graphStoreService ?? throw new ArgumentNullException(nameof(graphStoreService));
        _llmService = llmService ?? throw new ArgumentNullException(nameof(llmService));
        _documentRepository = documentRepository ?? throw new ArgumentNullException(nameof(documentRepository));
        _memoryOptions = memoryOptions.Value ?? throw new ArgumentNullException(nameof(memoryOptions));
        _processingOptions = processingOptions.Value ?? throw new ArgumentNullException(nameof(processingOptions));
        _featuresOptions = featuresOptions.Value ?? throw new ArgumentNullException(nameof(featuresOptions));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Ingests a new document into the memory system
    /// </summary>
    public async Task<IngestionResult> IngestDocumentAsync(Document document, IngestionOptions? options = null, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Ingesting document: {DocumentId}", document.Id);
            var stopwatch = Stopwatch.StartNew();

            options ??= new IngestionOptions();
            var result = new IngestionResult
            {
                DocumentId = document.Id,
                Status = "processing"
            };

            // Store document in repository
            await _documentRepository.SaveAsync(document, cancellationToken);

            // Process document in chunks
            var chunks = CreateTextChunks(document.Content, options.ChunkSize, options.ChunkOverlap);
            result.ChunksCreated = chunks.Count;

            // Store embeddings for each chunk
            var vectorTasks = chunks.Select(async (chunk, index) =>
            {
                var chunkId = $"{document.Id}_{index}";
                var metadata = new Dictionary<string, object>
                {
                    ["chunk_index"] = index,
                    ["chunk_id"] = chunkId,
                    ["source"] = document.Source,
                    ["created_at"] = document.CreatedAt.ToString("O")
                };

                // Add document metadata
                foreach (var kvp in document.Metadata)
                {
                    metadata[$"doc_{kvp.Key}"] = kvp.Value;
                }

                return await _vectorStoreService.StoreEmbeddingsAsync(document.Id, chunk, metadata, cancellationToken);
            });

            await Task.WhenAll(vectorTasks);

            // Extract relationships if enabled
            if (options.ExtractRelationships && _featuresOptions.RelationshipExtraction)
            {
                try
                {
                    var relationships = await _llmService.ExtractRelationshipsAsync(document.Content, cancellationToken);
                    var relationshipEntities = relationships.Select(r => new Relationship
                    {
                        Source = r.Source,
                        Target = r.Target,
                        Type = r.Type,
                        Confidence = r.Confidence,
                        DocumentId = document.Id,
                        Metadata = new Dictionary<string, object>
                        {
                            ["context"] = r.Context ?? string.Empty,
                            ["extracted_at"] = DateTime.UtcNow.ToString("O")
                        }
                    });

                    var relationshipCount = await _graphStoreService.StoreRelationshipsAsync(relationshipEntities, cancellationToken);
                    result.RelationshipsExtracted = relationshipCount;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to extract relationships for document {DocumentId}", document.Id);
                }
            }

            // Generate summary if enabled
            if (options.AutoSummarize && _featuresOptions.ContextualSummarization)
            {
                try
                {
                    result.Summary = await _llmService.GenerateSummaryAsync(document.Content, 500, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to generate summary for document {DocumentId}", document.Id);
                }
            }

            stopwatch.Stop();
            result.ProcessingTimeMs = (int)stopwatch.ElapsedMilliseconds;
            result.Status = "completed";

            _logger.LogInformation("Successfully ingested document {DocumentId} in {ElapsedMs}ms", 
                document.Id, result.ProcessingTimeMs);

            return result;
        }
        catch (Exception ex) when (!(ex is MemoryStoreException))
        {
            _logger.LogError(ex, "Error ingesting document {DocumentId}", document.Id);
            throw new MemoryStoreException("INGESTION_ERROR", $"Error ingesting document {document.Id}: {ex.Message}", innerException: ex);
        }
    }

    /// <summary>
    /// Ingests multiple documents in batch
    /// </summary>
    public async Task<BatchIngestionResult> IngestDocumentsAsync(IEnumerable<Document> documents, IngestionOptions? options = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var documentList = documents.ToList();
            _logger.LogInformation("Batch ingesting {Count} documents", documentList.Count);
            
            var stopwatch = Stopwatch.StartNew();
            var result = new BatchIngestionResult
            {
                TotalDocuments = documentList.Count,
                Results = new List<IngestionResult>()
            };

            // Process documents in parallel with limited concurrency
            var semaphore = new SemaphoreSlim(_processingOptions.MaxConcurrentDocuments);
            var tasks = documentList.Select(async document =>
            {
                await semaphore.WaitAsync(cancellationToken);
                try
                {
                    return await IngestDocumentAsync(document, options, cancellationToken);
                }
                finally
                {
                    semaphore.Release();
                }
            });

            var results = await Task.WhenAll(tasks);
            result.Results.AddRange(results);

            result.SuccessfulDocuments = results.Count(r => r.Status == "completed");
            result.FailedDocuments = result.TotalDocuments - result.SuccessfulDocuments;

            stopwatch.Stop();
            result.TotalProcessingTimeMs = (int)stopwatch.ElapsedMilliseconds;

            _logger.LogInformation("Batch ingestion completed: {Success}/{Total} documents successful in {ElapsedMs}ms",
                result.SuccessfulDocuments, result.TotalDocuments, result.TotalProcessingTimeMs);

            return result;
        }
        catch (Exception ex) when (!(ex is MemoryStoreException))
        {
            _logger.LogError(ex, "Error in batch document ingestion");
            throw new MemoryStoreException("BATCH_INGESTION_ERROR", $"Error in batch document ingestion: {ex.Message}", innerException: ex);
        }
    }

    /// <summary>
    /// Retrieves relevant context for a query
    /// </summary>
    public async Task<ContextResponse> GetContextAsync(string query, ContextOptions? options = null, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Retrieving context for query: {Query}", query);
            var stopwatch = Stopwatch.StartNew();

            options ??= new ContextOptions();
            var context = new ContextData
            {
                Documents = new List<Document>(),
                Relationships = new List<Relationship>()
            };

            // Perform semantic search
            var vectorResults = await _vectorStoreService.SearchAsync(query, options.MaxDocuments, options.MinScore, cancellationToken);
            var documentIds = vectorResults.Select(r => r.DocumentId).Distinct().ToList();

            // Get documents from repository
            var documents = new List<Document>();
            foreach (var documentId in documentIds)
            {
                var document = await _documentRepository.GetByIdAsync(documentId, cancellationToken);
                if (document != null)
                {
                    documents.Add(document);
                }
            }

            context.Documents = documents;

            // Get relationships if enabled
            if (options.IncludeRelationships && _featuresOptions.RelationshipExtraction)
            {
                var relationshipTasks = documentIds.Select(async docId =>
                {
                    return await _graphStoreService.FindRelationshipsAsync(docId, RelationshipDirection.Both, cancellationToken);
                });

                var relationshipResults = await Task.WhenAll(relationshipTasks);
                context.Relationships = relationshipResults.SelectMany(r => r).ToList();
            }

            // Generate summary if enabled
            if (options.GenerateSummary && _featuresOptions.ContextualSummarization && documents.Any())
            {
                try
                {
                    var combinedContent = string.Join("\n\n", documents.Select(d => d.Content));
                    context.Summary = await _llmService.GenerateSummaryAsync(combinedContent, 1000, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to generate context summary");
                    context.Summary = "Summary generation failed";
                }
            }

            stopwatch.Stop();
            var response = new ContextResponse
            {
                Query = query,
                Context = context,
                TotalResults = documents.Count,
                ProcessingTimeMs = (int)stopwatch.ElapsedMilliseconds
            };

            _logger.LogInformation("Retrieved context for query in {ElapsedMs}ms: {ResultCount} documents", 
                response.ProcessingTimeMs, response.TotalResults);

            return response;
        }
        catch (Exception ex) when (!(ex is MemoryStoreException))
        {
            _logger.LogError(ex, "Error retrieving context for query: {Query}", query);
            throw new MemoryStoreException("CONTEXT_RETRIEVAL_ERROR", $"Error retrieving context for query '{query}': {ex.Message}", innerException: ex);
        }
    }

    /// <summary>
    /// Performs semantic search across all memory
    /// </summary>
    public async Task<SearchResult> SearchAsync(string query, SearchOptions? options = null, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Performing search for query: {Query}", query);
            var stopwatch = Stopwatch.StartNew();

            options ??= new SearchOptions();

            // Perform semantic search
            var vectorResults = await _vectorStoreService.SearchAsync(query, options.Limit, options.MinScore, cancellationToken);
            var documentIds = vectorResults.Select(r => r.DocumentId).Distinct().Skip(options.Offset).Take(options.Limit).ToList();

            // Get documents from repository
            var documents = new List<Document>();
            foreach (var documentId in documentIds)
            {
                var document = await _documentRepository.GetByIdAsync(documentId, cancellationToken);
                if (document != null)
                {
                    documents.Add(document);
                }
            }

            // Apply metadata filters if specified
            if (options.Filters?.Any() == true)
            {
                documents = documents.Where(d => MatchesFilters(d, options.Filters)).ToList();
            }

            stopwatch.Stop();
            var result = new SearchResult
            {
                Query = query,
                Documents = documents,
                TotalResults = documents.Count,
                ProcessingTimeMs = (int)stopwatch.ElapsedMilliseconds
            };

            _logger.LogInformation("Search completed in {ElapsedMs}ms: {ResultCount} documents found", 
                result.ProcessingTimeMs, result.TotalResults);

            return result;
        }
        catch (Exception ex) when (!(ex is MemoryStoreException))
        {
            _logger.LogError(ex, "Error performing search for query: {Query}", query);
            throw new MemoryStoreException("SEARCH_ERROR", $"Error performing search for query '{query}': {ex.Message}", innerException: ex);
        }
    }

    /// <summary>
    /// Deletes a document and all associated data
    /// </summary>
    public async Task<bool> DeleteDocumentAsync(string documentId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Deleting document: {DocumentId}", documentId);

            // Check if document exists
            var document = await _documentRepository.GetByIdAsync(documentId, cancellationToken);
            if (document == null)
            {
                _logger.LogWarning("Document not found: {DocumentId}", documentId);
                return false;
            }

            // Delete from all stores
            await Task.WhenAll(
                _vectorStoreService.DeleteEmbeddingsAsync(documentId, cancellationToken),
                _graphStoreService.DeleteRelationshipsAsync(documentId, cancellationToken),
                _documentRepository.DeleteAsync(documentId, cancellationToken)
            );

            _logger.LogInformation("Successfully deleted document: {DocumentId}", documentId);
            return true;
        }
        catch (Exception ex) when (!(ex is MemoryStoreException))
        {
            _logger.LogError(ex, "Error deleting document: {DocumentId}", documentId);
            throw new MemoryStoreException("DOCUMENT_DELETE_ERROR", $"Error deleting document {documentId}: {ex.Message}", innerException: ex);
        }
    }

    /// <summary>
    /// Gets memory statistics
    /// </summary>
    public async Task<MemoryStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting memory statistics");

            var documentCountTask = _documentRepository.GetCountAsync(cancellationToken);
            var vectorCountTask = _vectorStoreService.GetVectorCountAsync(cancellationToken);
            var relationshipCountTask = _graphStoreService.GetRelationshipCountAsync(cancellationToken);

            var results = await Task.WhenAll(documentCountTask, vectorCountTask, relationshipCountTask);

            var stats = new MemoryStatistics
            {
                DocumentCount = results[0],
                VectorCount = results[1],
                RelationshipCount = results[2],
                MemoryUsageBytes = EstimateMemoryUsage(results[0], results[1], results[2]),
                LastUpdated = DateTime.UtcNow
            };

            _logger.LogDebug("Memory statistics: {DocumentCount} docs, {VectorCount} vectors, {RelationshipCount} relationships",
                stats.DocumentCount, stats.VectorCount, stats.RelationshipCount);

            return stats;
        }
        catch (Exception ex) when (!(ex is MemoryStoreException))
        {
            _logger.LogError(ex, "Error getting memory statistics");
            throw new MemoryStoreException("STATISTICS_ERROR", $"Error getting memory statistics: {ex.Message}", innerException: ex);
        }
    }

    /// <summary>
    /// Checks if the memory service is healthy
    /// </summary>
    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Checking memory service health");

            // Check all dependent services
            var healthChecks = await Task.WhenAll(
                _vectorStoreService.IsHealthyAsync(cancellationToken),
                _graphStoreService.IsHealthyAsync(cancellationToken),
                _llmService.IsHealthyAsync(cancellationToken)
            );

            var isHealthy = healthChecks.All(h => h);
            _logger.LogDebug("Memory service health check result: {IsHealthy}", isHealthy);

            return isHealthy;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Memory service health check failed");
            return false;
        }
    }

    /// <summary>
    /// Creates text chunks from document content
    /// </summary>
    private static List<string> CreateTextChunks(string content, int chunkSize, int chunkOverlap)
    {
        var chunks = new List<string>();
        var words = content.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        
        for (int i = 0; i < words.Length; i += chunkSize - chunkOverlap)
        {
            var chunk = string.Join(" ", words.Skip(i).Take(chunkSize));
            if (!string.IsNullOrWhiteSpace(chunk))
            {
                chunks.Add(chunk);
            }
        }

        return chunks;
    }

    /// <summary>
    /// Checks if a document matches the specified filters
    /// </summary>
    private static bool MatchesFilters(Document document, Dictionary<string, object> filters)
    {
        foreach (var filter in filters)
        {
            if (document.Metadata.TryGetValue(filter.Key, out var value))
            {
                if (!value.Equals(filter.Value))
                {
                    return false;
                }
            }
            else
            {
                return false;
            }
        }

        return true;
    }

    /// <summary>
    /// Estimates memory usage based on counts
    /// </summary>
    private static long EstimateMemoryUsage(long documentCount, long vectorCount, long relationshipCount)
    {
        // Rough estimates:
        // - Documents: ~10KB each (including metadata)
        // - Vectors: ~3KB each (768 dimensions * 4 bytes)
        // - Relationships: ~500 bytes each
        return (documentCount * 10_000) + (vectorCount * 3_000) + (relationshipCount * 500);
    }
}