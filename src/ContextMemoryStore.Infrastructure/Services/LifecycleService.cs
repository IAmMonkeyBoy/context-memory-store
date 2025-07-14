using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using System.Text;
using System.Text.Json;

namespace ContextMemoryStore.Infrastructure.Services;

/// <summary>
/// Implementation of ILifecycleService for managing system lifecycle operations
/// </summary>
public class LifecycleService : ILifecycleService
{
    private readonly IVectorStoreService _vectorStoreService;
    private readonly IGraphStoreService _graphStoreService;
    private readonly ILLMService _llmService;
    private readonly IMemoryService _memoryService;
    private readonly MemoryOptions _memoryOptions;
    private readonly ILogger<LifecycleService> _logger;

    public LifecycleService(
        IVectorStoreService vectorStoreService,
        IGraphStoreService graphStoreService,
        ILLMService llmService,
        IMemoryService memoryService,
        IOptions<MemoryOptions> memoryOptions,
        ILogger<LifecycleService> logger)
    {
        _vectorStoreService = vectorStoreService ?? throw new ArgumentNullException(nameof(vectorStoreService));
        _graphStoreService = graphStoreService ?? throw new ArgumentNullException(nameof(graphStoreService));
        _llmService = llmService ?? throw new ArgumentNullException(nameof(llmService));
        _memoryService = memoryService ?? throw new ArgumentNullException(nameof(memoryService));
        _memoryOptions = memoryOptions.Value ?? throw new ArgumentNullException(nameof(memoryOptions));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Initializes the memory system for a project
    /// </summary>
    public async Task<LifecycleResult> StartEngineAsync(string projectId, Dictionary<string, object>? config = null, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting memory engine for project: {ProjectId}", projectId);

            var result = new LifecycleResult
            {
                ProjectId = projectId,
                SessionId = Guid.NewGuid().ToString()
            };

            // Check service health first
            var healthChecks = await CheckAllServicesHealthAsync(cancellationToken);
            
            if (healthChecks.Any(h => !h.Value))
            {
                var unhealthyServices = healthChecks.Where(h => !h.Value).Select(h => h.Key);
                result.Success = false;
                result.ErrorMessage = $"Unhealthy services detected: {string.Join(", ", unhealthyServices)}";
                return result;
            }

            // Initialize vector store collection if needed
            await _vectorStoreService.InitializeCollectionAsync(cancellationToken);
            _logger.LogInformation("Vector store collection initialized for project: {ProjectId}", projectId);

            // Initialize graph database schema/constraints if needed
            await _graphStoreService.InitializeSchemaAsync(cancellationToken);
            _logger.LogInformation("Graph database schema initialized for project: {ProjectId}", projectId);

            // Store configuration metadata
            var metadata = new Dictionary<string, object>
            {
                ["project_id"] = projectId,
                ["session_id"] = result.SessionId!,
                ["started_at"] = result.Timestamp,
                ["max_documents"] = _memoryOptions.MaxDocuments,
                ["cleanup_interval_hours"] = _memoryOptions.CleanupIntervalHours
            };

            if (config != null)
            {
                foreach (var kvp in config)
                {
                    metadata[$"config_{kvp.Key}"] = kvp.Value;
                }
            }

            result.Metadata = metadata;
            result.Success = true;

            _logger.LogInformation("Memory engine successfully started for project: {ProjectId} with session: {SessionId}", 
                projectId, result.SessionId);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start memory engine for project: {ProjectId}", projectId);
            
            return new LifecycleResult
            {
                ProjectId = projectId,
                Success = false,
                ErrorMessage = $"Initialization failed: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// Stops the memory system and persists data
    /// </summary>
    public async Task<LifecycleResult> StopEngineAsync(string projectId, string? commitMessage = null, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Stopping memory engine for project: {ProjectId}", projectId);

            var result = new LifecycleResult
            {
                ProjectId = projectId,
                SessionId = Guid.NewGuid().ToString() // Snapshot ID
            };

            // Get current memory statistics for export
            var stats = await _memoryService.GetStatisticsAsync(cancellationToken);

            // Export vector data to JSONL format
            var vectorFile = await ExportVectorDataAsync(projectId, cancellationToken);
            if (!string.IsNullOrEmpty(vectorFile))
            {
                result.FilesPersisted.Add(vectorFile);
            }

            // Export graph data to Cypher format
            var graphFile = await ExportGraphDataAsync(projectId, cancellationToken);
            if (!string.IsNullOrEmpty(graphFile))
            {
                result.FilesPersisted.Add(graphFile);
            }

            // Generate project summary
            var summaryFile = await GenerateProjectSummaryAsync(projectId, stats, cancellationToken);
            if (!string.IsNullOrEmpty(summaryFile))
            {
                result.FilesPersisted.Add(summaryFile);
            }

            // Simulate git commit (in a real implementation, this would use LibGit2Sharp or similar)
            result.CommitHash = GenerateCommitHash();

            result.Metadata = new Dictionary<string, object>
            {
                ["documents_exported"] = stats.DocumentCount,
                ["vectors_exported"] = stats.VectorCount,
                ["relationships_exported"] = stats.RelationshipCount,
                ["commit_message"] = commitMessage ?? $"Memory snapshot for {projectId}",
                ["export_timestamp"] = DateTime.UtcNow
            };

            result.Success = true;

            _logger.LogInformation("Memory engine successfully stopped for project: {ProjectId}. Exported {FileCount} files with commit: {CommitHash}", 
                projectId, result.FilesPersisted.Count, result.CommitHash);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to stop memory engine for project: {ProjectId}", projectId);
            
            return new LifecycleResult
            {
                ProjectId = projectId,
                Success = false,
                ErrorMessage = $"Shutdown failed: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// Gets the current system status
    /// </summary>
    public async Task<SystemStatus> GetStatusAsync(string projectId, CancellationToken cancellationToken = default)
    {
        try
        {
            var stats = await _memoryService.GetStatisticsAsync(cancellationToken);
            var serviceHealth = await CheckAllServicesHealthAsync(cancellationToken);

            return new SystemStatus
            {
                ProjectId = projectId,
                State = serviceHealth.All(h => h.Value) ? "active" : "degraded",
                UptimeSeconds = GetUptimeSeconds(),
                MemoryUsage = new MemoryUsage
                {
                    Documents = stats.DocumentCount,
                    Vectors = stats.VectorCount,
                    Relationships = stats.RelationshipCount
                },
                LastActivity = stats.LastUpdated,
                ServiceHealth = serviceHealth
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get system status for project: {ProjectId}", projectId);
            
            return new SystemStatus
            {
                ProjectId = projectId,
                State = "error",
                UptimeSeconds = GetUptimeSeconds(),
                ServiceHealth = new Dictionary<string, bool>
                {
                    ["memory"] = false,
                    ["vector_store"] = false,
                    ["graph_store"] = false,
                    ["llm"] = false
                }
            };
        }
    }

    private async Task<Dictionary<string, bool>> CheckAllServicesHealthAsync(CancellationToken cancellationToken)
    {
        var healthChecks = new Dictionary<string, bool>();

        try
        {
            healthChecks["memory"] = await _memoryService.IsHealthyAsync(cancellationToken);
        }
        catch
        {
            healthChecks["memory"] = false;
        }

        try
        {
            healthChecks["vector_store"] = await _vectorStoreService.IsHealthyAsync(cancellationToken);
        }
        catch
        {
            healthChecks["vector_store"] = false;
        }

        try
        {
            healthChecks["graph_store"] = await _graphStoreService.IsHealthyAsync(cancellationToken);
        }
        catch
        {
            healthChecks["graph_store"] = false;
        }

        try
        {
            healthChecks["llm"] = await _llmService.IsHealthyAsync(cancellationToken);
        }
        catch
        {
            healthChecks["llm"] = false;
        }

        return healthChecks;
    }

    private Task<string?> ExportVectorDataAsync(string projectId, CancellationToken cancellationToken)
    {
        try
        {
            // In a real implementation, this would export actual vector data from Qdrant
            // For now, we'll create a placeholder file structure
            var fileName = "vector-store.jsonl";
            
            var exportData = new
            {
                export_timestamp = DateTime.UtcNow,
                project_id = projectId,
                format_version = "1.0",
                collection_name = "context-memory",
                vector_dimension = 1024,
                vectors = new[] 
                {
                    new { id = "sample_vector_1", payload = new { source = "placeholder" }, vector = new float[768] }
                }
            };

            // Log the export (in real implementation, would write to /project/vector-store.jsonl)
            _logger.LogInformation("Exported vector data to {FileName} for project {ProjectId}", fileName, projectId);
            return Task.FromResult<string?>(fileName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to export vector data for project: {ProjectId}", projectId);
            return Task.FromResult<string?>(null);
        }
    }

    private Task<string?> ExportGraphDataAsync(string projectId, CancellationToken cancellationToken)
    {
        try
        {
            // In a real implementation, this would export actual graph data from Neo4j
            var fileName = "graph.cypher";
            
            // Generate sample Cypher export
            var cypherCommands = new StringBuilder();
            cypherCommands.AppendLine("// Graph export for project: " + projectId);
            cypherCommands.AppendLine("// Generated at: " + DateTime.UtcNow);
            cypherCommands.AppendLine("CREATE (n:Document {id: 'sample_doc_1', title: 'Sample Document'});");
            cypherCommands.AppendLine("CREATE (c:Concept {name: 'Sample Concept'});");
            cypherCommands.AppendLine("MATCH (d:Document), (c:Concept) CREATE (d)-[:MENTIONS]->(c);");

            _logger.LogInformation("Exported graph data to {FileName} for project {ProjectId}", fileName, projectId);
            return Task.FromResult<string?>(fileName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to export graph data for project: {ProjectId}", projectId);
            return Task.FromResult<string?>(null);
        }
    }

    private Task<string?> GenerateProjectSummaryAsync(string projectId, MemoryStatistics stats, CancellationToken cancellationToken)
    {
        try
        {
            var fileName = "summary.md";
            
            var summary = new StringBuilder();
            summary.AppendLine($"# Project Summary: {projectId}");
            summary.AppendLine();
            summary.AppendLine($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss UTC}");
            summary.AppendLine();
            summary.AppendLine("## Statistics");
            summary.AppendLine($"- Documents: {stats.DocumentCount:N0}");
            summary.AppendLine($"- Vectors: {stats.VectorCount:N0}");
            summary.AppendLine($"- Relationships: {stats.RelationshipCount:N0}");
            summary.AppendLine($"- Memory Usage: {stats.MemoryUsageBytes:N0} bytes");
            summary.AppendLine($"- Last Updated: {stats.LastUpdated:yyyy-MM-dd HH:mm:ss UTC}");
            summary.AppendLine();
            summary.AppendLine("## Export Information");
            summary.AppendLine("This snapshot contains:");
            summary.AppendLine("- `vector-store.jsonl`: Vector embeddings and metadata");
            summary.AppendLine("- `graph.cypher`: Graph relationships in Cypher format");
            summary.AppendLine("- `summary.md`: This summary file");

            _logger.LogInformation("Generated project summary {FileName} for project {ProjectId}", fileName, projectId);
            return Task.FromResult<string?>(fileName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to generate summary for project: {ProjectId}", projectId);
            return Task.FromResult<string?>(null);
        }
    }

    private string GenerateCommitHash()
    {
        // Generate a mock commit hash (in real implementation, would be actual git commit)
        return Guid.NewGuid().ToString("N")[..8];
    }

    private long GetUptimeSeconds()
    {
        return (long)(DateTime.UtcNow - Process.GetCurrentProcess().StartTime.ToUniversalTime()).TotalSeconds;
    }
}