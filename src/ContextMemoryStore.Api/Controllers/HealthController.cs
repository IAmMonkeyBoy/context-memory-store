using Microsoft.AspNetCore.Mvc;
using ContextMemoryStore.Core.Interfaces;

namespace ContextMemoryStore.Api.Controllers;

[ApiController]
[Route("health")]
[Produces("application/json")]
public class HealthController : ControllerBase
{
    private readonly IVectorStoreService _vectorStoreService;
    private readonly IGraphStoreService _graphStoreService;
    private readonly ILLMService _llmService;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        IVectorStoreService vectorStoreService,
        IGraphStoreService graphStoreService,
        ILLMService llmService,
        ILogger<HealthController> logger)
    {
        _vectorStoreService = vectorStoreService;
        _graphStoreService = graphStoreService;
        _llmService = llmService;
        _logger = logger;
    }

    /// <summary>
    /// Basic health check endpoint
    /// </summary>
    /// <returns>Basic health status</returns>
    [HttpGet("")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(typeof(object), 503)]
    public async Task<IActionResult> GetHealth(CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;
        
        try
        {
            _logger.LogDebug("Starting basic health check");
            
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(30)); // 30 second timeout
            
            // Check individual services
            var healthChecks = await CheckAllServicesHealthAsync(timeoutCts.Token);
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            var allHealthy = healthChecks.Values.All(h => h);
            var checksPassedCount = healthChecks.Values.Count(h => h);
            var totalChecks = healthChecks.Count;
            
            var response = new
            {
                status = allHealthy ? "healthy" : "unhealthy",
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                version = "1.0.0",
                uptime_seconds = GetUptimeSeconds(),
                response_time_ms = (int)responseTime,
                checks_passed = checksPassedCount,
                checks_total = totalChecks
            };

            _logger.LogInformation("Health check completed with status {Status} in {ResponseTime}ms. Passed: {Passed}/{Total}", 
                allHealthy ? "healthy" : "unhealthy", responseTime, checksPassedCount, totalChecks);

            return allHealthy 
                ? Ok(response) 
                : StatusCode(503, response);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogWarning("Health check cancelled after {ResponseTime}ms", responseTime);
            
            var cancelledResponse = new
            {
                status = "cancelled",
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                version = "1.0.0",
                error = "Health check was cancelled",
                response_time_ms = (int)responseTime
            };

            return StatusCode(408, cancelledResponse);
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogError(ex, "Health check failed after {ResponseTime}ms", responseTime);
            
            var errorResponse = new
            {
                status = "unhealthy",
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                version = "1.0.0",
                error = "Health check failed",
                error_detail = ex.Message,
                response_time_ms = (int)responseTime
            };

            return StatusCode(503, errorResponse);
        }
    }

    /// <summary>
    /// Detailed health check with dependency status
    /// </summary>
    /// <returns>Detailed health status including dependencies</returns>
    [HttpGet("detailed")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(typeof(object), 503)]
    public async Task<IActionResult> GetDetailedHealth(CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;
        
        try
        {
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(45)); // 45 second timeout for detailed checks
            
            // Check individual dependencies in parallel
            var healthCheckTasks = new[]
            {
                CheckQdrantHealth(timeoutCts.Token),
                CheckNeo4jHealth(timeoutCts.Token),
                CheckOllamaHealth(timeoutCts.Token)
            };
            
            var healthResults = await Task.WhenAll(healthCheckTasks);
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            var qdrantHealth = healthResults[0];
            var neo4jHealth = healthResults[1];
            var ollamaHealth = healthResults[2];
            
            // Determine overall system health
            var allServicesHealthy = 
                GetServiceStatus(qdrantHealth) &&
                GetServiceStatus(neo4jHealth) &&
                GetServiceStatus(ollamaHealth);

            var response = new
            {
                status = allServicesHealthy ? "healthy" : "unhealthy",
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                version = "1.0.0",
                uptime_seconds = GetUptimeSeconds(),
                response_time_ms = (int)responseTime,
                dependencies = new
                {
                    qdrant = qdrantHealth,
                    neo4j = neo4jHealth,
                    ollama = ollamaHealth
                },
                system_info = new
                {
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                    machine_name = Environment.MachineName,
                    processor_count = Environment.ProcessorCount,
                    working_set_mb = Environment.WorkingSet / 1024 / 1024
                }
            };

            _logger.LogInformation("Detailed health check completed in {ResponseTime}ms. Overall status: {Status}", 
                responseTime, response.status);

            return allServicesHealthy ? Ok(response) : StatusCode(503, response);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogWarning("Detailed health check cancelled after {ResponseTime}ms", responseTime);
            
            var cancelledResponse = new
            {
                status = "cancelled",
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                version = "1.0.0",
                error = "Detailed health check was cancelled",
                response_time_ms = (int)responseTime
            };

            return StatusCode(408, cancelledResponse);
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogError(ex, "Error checking detailed health after {ResponseTime}ms", responseTime);
            
            var errorResponse = new
            {
                status = "unhealthy",
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                version = "1.0.0",
                error = "Detailed health check failed",
                error_detail = ex.Message,
                response_time_ms = (int)responseTime
            };

            return StatusCode(503, errorResponse);
        }
    }

    private async Task<Dictionary<string, bool>> CheckAllServicesHealthAsync(CancellationToken cancellationToken)
    {
        var healthChecks = new Dictionary<string, bool>();

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

    private async Task<object> CheckQdrantHealth(CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;
        
        try
        {
            using var healthTimeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            healthTimeout.CancelAfter(TimeSpan.FromSeconds(10));
            
            var isHealthy = await _vectorStoreService.IsHealthyAsync(healthTimeout.Token);
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            var collectionCount = 0;
            var vectorCount = 0L;
            var additionalInfo = new Dictionary<string, object>();
            
            if (isHealthy)
            {
                try
                {
                    collectionCount = await _vectorStoreService.GetCollectionCountAsync(healthTimeout.Token);
                    vectorCount = await _vectorStoreService.GetVectorCountAsync(healthTimeout.Token);
                    additionalInfo["last_check"] = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Failed to get additional Qdrant metrics during health check");
                    additionalInfo["metrics_error"] = "Failed to retrieve additional metrics";
                }
            }

            return new
            {
                status = isHealthy ? "healthy" : "unhealthy",
                response_time_ms = (int)responseTime,
                collections = collectionCount,
                vectors = vectorCount,
                additional_info = additionalInfo
            };
        }
        catch (OperationCanceledException)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogWarning("Qdrant health check timed out after {ResponseTime}ms", responseTime);
            return new
            {
                status = "timeout",
                response_time_ms = (int)responseTime,
                collections = 0,
                vectors = 0L,
                error = "Health check timed out"
            };
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogWarning(ex, "Qdrant health check failed after {ResponseTime}ms", responseTime);
            return new
            {
                status = "unhealthy",
                response_time_ms = (int)responseTime,
                collections = 0,
                vectors = 0L,
                error = ex.Message
            };
        }
    }

    private async Task<object> CheckNeo4jHealth(CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;
        
        try
        {
            using var healthTimeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            healthTimeout.CancelAfter(TimeSpan.FromSeconds(10));
            
            var isHealthy = await _graphStoreService.IsHealthyAsync(healthTimeout.Token);
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            var nodeCount = 0;
            var relationshipCount = 0;
            var additionalInfo = new Dictionary<string, object>();
            
            if (isHealthy)
            {
                try
                {
                    var stats = await _graphStoreService.GetStatsAsync(healthTimeout.Token);
                    nodeCount = stats.NodeCount;
                    relationshipCount = stats.RelationshipCount;
                    additionalInfo["last_check"] = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Failed to get additional Neo4j metrics during health check");
                    additionalInfo["metrics_error"] = "Failed to retrieve additional metrics";
                }
            }

            return new
            {
                status = isHealthy ? "healthy" : "unhealthy",
                response_time_ms = (int)responseTime,
                nodes = nodeCount,
                relationships = relationshipCount,
                additional_info = additionalInfo
            };
        }
        catch (OperationCanceledException)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogWarning("Neo4j health check timed out after {ResponseTime}ms", responseTime);
            return new
            {
                status = "timeout",
                response_time_ms = (int)responseTime,
                nodes = 0,
                relationships = 0,
                error = "Health check timed out"
            };
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogWarning(ex, "Neo4j health check failed after {ResponseTime}ms", responseTime);
            return new
            {
                status = "unhealthy",
                response_time_ms = (int)responseTime,
                nodes = 0,
                relationships = 0,
                error = ex.Message
            };
        }
    }

    private async Task<object> CheckOllamaHealth(CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;
        
        try
        {
            using var healthTimeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            healthTimeout.CancelAfter(TimeSpan.FromSeconds(15)); // Longer timeout for LLM service
            
            var isHealthy = await _llmService.IsHealthyAsync(healthTimeout.Token);
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            var models = new List<string>();
            var additionalInfo = new Dictionary<string, object>();
            
            if (isHealthy)
            {
                try
                {
                    models = await _llmService.GetAvailableModelsAsync(healthTimeout.Token);
                    additionalInfo["last_check"] = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
                    additionalInfo["model_count"] = models.Count;
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Failed to get available models during health check");
                    additionalInfo["models_error"] = "Failed to retrieve model list";
                }
            }

            return new
            {
                status = isHealthy ? "healthy" : "unhealthy",
                response_time_ms = (int)responseTime,
                models = models.ToArray(),
                additional_info = additionalInfo
            };
        }
        catch (OperationCanceledException)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogWarning("Ollama health check timed out after {ResponseTime}ms", responseTime);
            return new
            {
                status = "timeout",
                response_time_ms = (int)responseTime,
                models = new string[0],
                error = "Health check timed out"
            };
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogWarning(ex, "Ollama health check failed after {ResponseTime}ms", responseTime);
            return new
            {
                status = "unhealthy",
                response_time_ms = (int)responseTime,
                models = new string[0],
                error = ex.Message
            };
        }
    }

    private long GetUptimeSeconds()
    {
        return (long)(DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime()).TotalSeconds;
    }

    private static bool GetServiceStatus(object serviceHealth)
    {
        // Use reflection to check the status property
        var statusProperty = serviceHealth.GetType().GetProperty("status");
        if (statusProperty != null)
        {
            var statusValue = statusProperty.GetValue(serviceHealth);
            return statusValue?.ToString()?.ToLowerInvariant() == "healthy";
        }
        return false;
    }
}