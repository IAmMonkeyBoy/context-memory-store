using Microsoft.AspNetCore.Mvc;
using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Api.Validation;
using FluentValidation;
using System.Text.Json.Serialization;
using static ContextMemoryStore.Core.Interfaces.IMemoryService;

namespace ContextMemoryStore.Api.Controllers;

[ApiController]
[Route("v1/memory")]
[Produces("application/json")]
public class MemoryController : ControllerBase
{
    private readonly IMemoryService _memoryService;
    private readonly IValidator<IngestDocumentsRequest> _ingestValidator;
    private readonly IValidator<ContextQueryRequest> _contextValidator;
    private readonly IValidator<SearchQueryRequest> _searchValidator;
    private readonly ILogger<MemoryController> _logger;

    public MemoryController(
        IMemoryService memoryService,
        IValidator<IngestDocumentsRequest> ingestValidator,
        IValidator<ContextQueryRequest> contextValidator,
        IValidator<SearchQueryRequest> searchValidator,
        ILogger<MemoryController> logger)
    {
        _memoryService = memoryService;
        _ingestValidator = ingestValidator;
        _contextValidator = contextValidator;
        _searchValidator = searchValidator;
        _logger = logger;
    }

    /// <summary>
    /// Add new documents to memory
    /// </summary>
    /// <param name="request">Document ingestion request</param>
    /// <returns>Ingestion results</returns>
    [HttpPost("ingest")]
    [ProducesResponseType(typeof(StandardResponse<object>), 200)]
    [ProducesResponseType(typeof(StandardResponse<object>), 400)]
    [ProducesResponseType(typeof(StandardResponse<object>), 500)]
    public async Task<IActionResult> IngestDocuments([FromBody] IngestDocumentsRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            // Debug logging to see actual request structure
            _logger.LogInformation("Received ingest request with {DocumentCount} documents", request.Documents?.Count ?? 0);
            if (request.Documents?.Any() == true)
            {
                var firstDoc = request.Documents.First();
                _logger.LogInformation("First document - ID: {Id}, Content length: {ContentLength}, Metadata title: {Title}, Metadata type: {Type}, Source type: {SourceType}, Source path: {SourcePath}", 
                    firstDoc.Id, 
                    firstDoc.Content?.Length ?? 0,
                    firstDoc.Metadata?.Title ?? "null",
                    firstDoc.Metadata?.Type ?? "null",
                    firstDoc.Source?.Type ?? "null",
                    firstDoc.Source?.Path ?? "null");
                _logger.LogInformation("Metadata dictionary contents: {@MetadataDict}", firstDoc.Metadata);
                _logger.LogInformation("Using system-defined chunk size: 1000 characters");
            }
            
            // Validate request
            var validationResult = await _ingestValidator.ValidateAsync(request, cancellationToken);
            if (!validationResult.IsValid)
            {
                // Create a proper dictionary for validation errors
                var errorDetails = new Dictionary<string, object>
                {
                    ["validation_errors"] = validationResult.Errors.Select(e => new Dictionary<string, object>
                    {
                        ["field"] = e.PropertyName,
                        ["error"] = e.ErrorMessage,
                        ["attempted_value"] = e.AttemptedValue?.ToString() ?? "null"
                    }).ToList(),
                    ["error_count"] = validationResult.Errors.Count
                };

                var validationResponse = StandardResponse<object>.CreateError(
                    "VALIDATION_ERROR",
                    "Request validation failed",
                    errorDetails
                );
                
                _logger.LogWarning("Validation failed for ingest request. Errors: {@ValidationErrors}", 
                    validationResult.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }));
                
                return BadRequest(validationResponse);
            }

            _logger.LogInformation("Ingesting {Count} documents", request.Documents?.Count ?? 0);
            
            var ingestionOptions = new IngestionOptions
            {
                AutoSummarize = request.Options?.AutoSummarize ?? true,
                ExtractRelationships = request.Options?.ExtractRelationships ?? true,
                ChunkSize = 1000 // System-defined chunk size for optimal embedding performance
            };
            
            var result = await _memoryService.IngestDocumentsAsync(request.Documents!, ingestionOptions, cancellationToken);
            
            var response = StandardResponse<object>.Success(new
            {
                ingested_documents = result.SuccessfulDocuments,
                created_vectors = result.Results.Sum(r => r.ChunksCreated),
                extracted_relationships = result.Results.Sum(r => r.RelationshipsExtracted),
                processing_time_ms = result.TotalProcessingTimeMs,
                documents = result.Results.Select(r => new
                {
                    id = r.DocumentId,
                    status = r.Status,
                    chunks = r.ChunksCreated,
                    relationships = r.RelationshipsExtracted,
                    summary = r.Summary
                })
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ingesting documents");
            
            var errorResponse = StandardResponse<object>.CreateError(
                "PROCESSING_ERROR",
                "Failed to ingest documents",
                new { document_count = request.Documents?.Count ?? 0 }
            );

            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Retrieve relevant context for a query
    /// </summary>
    /// <param name="q">Search query</param>
    /// <param name="limit">Maximum results</param>
    /// <param name="includeRelationships">Include graph relationships</param>
    /// <param name="minScore">Minimum relevance score</param>
    /// <returns>Context response</returns>
    [HttpGet("context")]
    [ProducesResponseType(typeof(StandardResponse<ContextResponse>), 200)]
    [ProducesResponseType(typeof(StandardResponse<object>), 400)]
    [ProducesResponseType(typeof(StandardResponse<object>), 500)]
    public async Task<IActionResult> GetContext(
        [FromQuery] string q,
        [FromQuery] int limit = 10,
        [FromQuery] bool includeRelationships = false,
        [FromQuery] double minScore = 0.5,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Create request object for validation
            var queryRequest = new ContextQueryRequest
            {
                Query = q ?? string.Empty,
                Limit = limit,
                IncludeRelationships = includeRelationships,
                MinScore = minScore
            };

            // Validate request
            var validationResult = await _contextValidator.ValidateAsync(queryRequest, cancellationToken);
            if (!validationResult.IsValid)
            {
                var validationResponse = StandardResponse<object>.CreateError(
                    "VALIDATION_ERROR",
                    "Request validation failed",
                    validationResult.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage })
                );
                return BadRequest(validationResponse);
            }

            _logger.LogInformation("Getting context for query: {Query}", q);
            
            var contextOptions = new ContextOptions
            {
                MaxDocuments = limit,
                IncludeRelationships = includeRelationships,
                MinScore = minScore
            };
            
            var context = await _memoryService.GetContextAsync(q ?? string.Empty, contextOptions, cancellationToken);
            
            var response = StandardResponse<ContextResponse>.Success(context);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting context for query: {Query}", q);
            
            var errorResponse = StandardResponse<object>.CreateError(
                "INTERNAL_ERROR",
                "Failed to retrieve context",
                new { query = q }
            );

            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// Streaming context analysis with real-time insights
    /// </summary>
    /// <param name="q">Analysis query</param>
    /// <param name="limit">Maximum context documents</param>
    /// <param name="includeRelationships">Include graph relationships</param>
    /// <returns>Server-sent events stream of analysis insights</returns>
    [HttpGet("analyze-stream")]
    [ProducesResponseType(typeof(string), 200)]
    [ProducesResponseType(typeof(StandardResponse<object>), 400)]
    [ProducesResponseType(typeof(StandardResponse<object>), 500)]
    public async Task AnalyzeContextStream(
        [FromQuery] string q,
        [FromQuery] int limit = 5,
        [FromQuery] bool includeRelationships = true,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            Response.StatusCode = 400;
            await Response.WriteAsync("{\"error\": \"Query parameter 'q' is required\"}", cancellationToken);
            return;
        }

        try
        {
            _logger.LogInformation("Starting streaming context analysis for query: {Query}", q);

            // Set up Server-Sent Events
            Response.ContentType = "text/event-stream";
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");

            // Initial status event
            await WriteStreamEvent("status", "Starting context retrieval...", cancellationToken);

            // Get relevant context
            var contextOptions = new ContextOptions
            {
                MaxDocuments = limit,
                IncludeRelationships = includeRelationships,
                MinScore = 0.6
            };

            var context = await _memoryService.GetContextAsync(q, contextOptions, cancellationToken);
            
            await WriteStreamEvent("status", $"Found {context.TotalResults} relevant documents", cancellationToken);

            if (context.Context.Documents.Any())
            {
                // Prepare analysis prompt
                var analysisContext = string.Join("\n\n", context.Context.Documents.Select(d => $"Document: {d.Metadata.Title}\nContent: {d.Content}"));
                var relationshipsContext = includeRelationships && context.Context.Relationships.Any()
                    ? "\n\nRelationships:\n" + string.Join("\n", context.Context.Relationships.Select(r => $"- {r.Source} {r.Type} {r.Target}"))
                    : "";

                var analysisPrompt = $"Analyze the following context to answer the query: '{q}'\n\nContext:\n{analysisContext}{relationshipsContext}\n\nProvide insights, connections, and a comprehensive analysis:";

                var messages = new List<ContextMemoryStore.Core.Interfaces.ChatMessage>
                {
                    new() { Role = "system", Content = "You are an expert context analyst. Provide streaming insights as you analyze the given context. Break your analysis into digestible chunks." },
                    new() { Role = "user", Content = analysisPrompt }
                };

                await WriteStreamEvent("status", "Generating analysis...", cancellationToken);

                // Stream the analysis using our enhanced LLM service
                var analysisChunks = new List<string>();
                await foreach (var chunk in _memoryService.StreamContextAnalysisAsync(messages, cancellationToken))
                {
                    if (!string.IsNullOrWhiteSpace(chunk))
                    {
                        analysisChunks.Add(chunk);
                        await WriteStreamEvent("analysis", chunk, cancellationToken);
                        await Response.Body.FlushAsync(cancellationToken);
                    }
                }

                await WriteStreamEvent("status", "Analysis complete", cancellationToken);
                await WriteStreamEvent("metadata", System.Text.Json.JsonSerializer.Serialize(new
                {
                    documents_analyzed = context.TotalResults,
                    relationships_found = context.Context.Relationships.Count,
                    processing_time_ms = context.ProcessingTimeMs,
                    total_analysis_chunks = analysisChunks.Count
                }), cancellationToken);
            }
            else
            {
                await WriteStreamEvent("analysis", "No relevant context found for the given query.", cancellationToken);
            }

            await WriteStreamEvent("done", "Analysis stream completed", cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in streaming context analysis for query: {Query}", q);
            await WriteStreamEvent("error", $"Analysis failed: {ex.Message}", cancellationToken);
        }
    }

    private async Task WriteStreamEvent(string eventType, string data, CancellationToken cancellationToken)
    {
        var eventData = $"event: {eventType}\ndata: {data}\n\n";
        await Response.WriteAsync(eventData, cancellationToken);
    }

    /// <summary>
    /// Semantic search across all memory
    /// </summary>
    /// <param name="q">Search query</param>
    /// <param name="limit">Maximum results</param>
    /// <param name="offset">Pagination offset</param>
    /// <param name="filter">Metadata filter (JSON)</param>
    /// <param name="sort">Sort order (relevance, date, title)</param>
    /// <returns>Search results</returns>
    [HttpGet("search")]
    [ProducesResponseType(typeof(StandardResponse<object>), 200)]
    [ProducesResponseType(typeof(StandardResponse<object>), 400)]
    [ProducesResponseType(typeof(StandardResponse<object>), 500)]
    public async Task<IActionResult> Search(
        [FromQuery] string q,
        [FromQuery] int limit = 10,
        [FromQuery] int offset = 0,
        [FromQuery] string? filter = null,
        [FromQuery] string sort = "relevance",
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Create request object for validation
            var searchRequest = new SearchQueryRequest
            {
                Query = q ?? string.Empty,
                Limit = limit,
                Offset = offset,
                Filter = filter,
                Sort = sort
            };

            // Validate request
            var validationResult = await _searchValidator.ValidateAsync(searchRequest, cancellationToken);
            if (!validationResult.IsValid)
            {
                var validationResponse = StandardResponse<object>.CreateError(
                    "VALIDATION_ERROR",
                    "Request validation failed",
                    validationResult.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage })
                );
                return BadRequest(validationResponse);
            }

            _logger.LogInformation("Searching for: {Query}", q);
            
            var searchOptions = new SearchOptions
            {
                Limit = limit,
                Offset = offset,
                SortBy = sort
            };
            
            // Parse filter JSON if provided
            if (!string.IsNullOrWhiteSpace(filter))
            {
                try
                {
                    var filterDict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(filter);
                    searchOptions.Filters = filterDict;
                }
                catch
                {
                    var filterErrorResponse = StandardResponse<object>.CreateError(
                        "INVALID_FILTER",
                        "Invalid filter JSON format",
                        new { filter = filter }
                    );
                    return BadRequest(filterErrorResponse);
                }
            }
            
            var results = await _memoryService.SearchAsync(q ?? string.Empty, searchOptions, cancellationToken);
            
            var response = StandardResponse<object>.Success(new
            {
                query = q,
                results = results.Documents.Select(r => new
                {
                    id = r.Id,
                    title = r.Metadata.Title,
                    content = r.Content,
                    score = 0.0, // TODO: Add score to Document entity in future enhancement
                    metadata = new
                    {
                        type = r.Metadata.Type,
                        tags = r.Metadata.Tags
                    },
                    source = new
                    {
                        type = r.Source.Type,
                        path = r.Source.Path
                    }
                }),
                pagination = new
                {
                    total = results.TotalResults,
                    limit = limit,
                    offset = offset,
                    has_more = results.TotalResults > (offset + limit)
                },
                processing_time_ms = results.ProcessingTimeMs
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching for: {Query}", q);
            
            var errorResponse = StandardResponse<object>.CreateError(
                "INTERNAL_ERROR",
                "Failed to perform search",
                new { query = q }
            );

            return StatusCode(500, errorResponse);
        }
    }

    public class IngestDocumentsRequest
    {
        public List<Document>? Documents { get; set; }
        public IngestOptions? Options { get; set; }
    }

    public class IngestOptions
    {
        /// <summary>
        /// Whether to automatically generate document summaries
        /// </summary>
        [JsonPropertyName("autoSummarize")]
        public bool AutoSummarize { get; set; } = true;
        
        /// <summary>
        /// Whether to extract relationships between entities
        /// </summary>
        [JsonPropertyName("extractRelationships")]
        public bool ExtractRelationships { get; set; } = true;
    }
}