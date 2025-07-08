using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using ContextMemoryStore.Core.Interfaces;

namespace ContextMemoryStore.Api.Controllers;

[ApiController]
[Route("health")]
[Produces("application/json")]
public class HealthController : ControllerBase
{
    private readonly HealthCheckService _healthCheckService;
    private readonly IVectorStoreService _vectorStoreService;
    private readonly IGraphStoreService _graphStoreService;
    private readonly ILLMService _llmService;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        HealthCheckService healthCheckService,
        IVectorStoreService vectorStoreService,
        IGraphStoreService graphStoreService,
        ILLMService llmService,
        ILogger<HealthController> logger)
    {
        _healthCheckService = healthCheckService;
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
    public async Task<IActionResult> GetHealth()
    {
        var startTime = DateTime.UtcNow;
        
        try
        {
            _logger.LogDebug("Starting basic health check");
            
            var healthReport = await _healthCheckService.CheckHealthAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            var response = new
            {
                status = healthReport.Status == HealthStatus.Healthy ? "healthy" : "unhealthy",
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                version = "1.0.0",
                uptime_seconds = GetUptimeSeconds()
            };

            _logger.LogInformation("Health check completed with status {Status} in {ResponseTime}ms", 
                healthReport.Status, responseTime);

            return healthReport.Status == HealthStatus.Healthy 
                ? Ok(response) 
                : StatusCode(503, response);
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
                error = "Health check failed"
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
    public async Task<IActionResult> GetDetailedHealth()
    {
        try
        {
            var healthReport = await _healthCheckService.CheckHealthAsync();
            
            // Check individual dependencies
            var qdrantHealth = await CheckQdrantHealth();
            var neo4jHealth = await CheckNeo4jHealth();
            var ollamaHealth = await CheckOllamaHealth();

            var response = new
            {
                status = healthReport.Status == HealthStatus.Healthy ? "healthy" : "unhealthy",
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                version = "1.0.0",
                uptime_seconds = GetUptimeSeconds(),
                dependencies = new
                {
                    qdrant = qdrantHealth,
                    neo4j = neo4jHealth,
                    ollama = ollamaHealth
                }
            };

            return healthReport.Status == HealthStatus.Healthy 
                ? Ok(response) 
                : StatusCode(503, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking detailed health");
            
            var errorResponse = new
            {
                status = "unhealthy",
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                version = "1.0.0",
                error = "Detailed health check failed"
            };

            return StatusCode(503, errorResponse);
        }
    }

    private async Task<object> CheckQdrantHealth()
    {
        try
        {
            var startTime = DateTime.UtcNow;
            var isHealthy = await _vectorStoreService.IsHealthyAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            var collectionCount = 0;
            if (isHealthy)
            {
                try
                {
                    collectionCount = await _vectorStoreService.GetCollectionCountAsync();
                }
                catch
                {
                    // Ignore collection count errors for health check
                }
            }

            return new
            {
                status = isHealthy ? "healthy" : "unhealthy",
                response_time_ms = (int)responseTime,
                collections = collectionCount
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Qdrant health check failed");
            return new
            {
                status = "unhealthy",
                response_time_ms = -1,
                collections = 0,
                error = "Connection failed"
            };
        }
    }

    private async Task<object> CheckNeo4jHealth()
    {
        try
        {
            var startTime = DateTime.UtcNow;
            var isHealthy = await _graphStoreService.IsHealthyAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            var nodeCount = 0;
            var relationshipCount = 0;
            if (isHealthy)
            {
                try
                {
                    var stats = await _graphStoreService.GetStatsAsync();
                    nodeCount = stats.NodeCount;
                    relationshipCount = stats.RelationshipCount;
                }
                catch
                {
                    // Ignore stats errors for health check
                }
            }

            return new
            {
                status = isHealthy ? "healthy" : "unhealthy",
                response_time_ms = (int)responseTime,
                nodes = nodeCount,
                relationships = relationshipCount
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Neo4j health check failed");
            return new
            {
                status = "unhealthy",
                response_time_ms = -1,
                nodes = 0,
                relationships = 0,
                error = "Connection failed"
            };
        }
    }

    private async Task<object> CheckOllamaHealth()
    {
        try
        {
            var startTime = DateTime.UtcNow;
            var isHealthy = await _llmService.IsHealthyAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            var models = new List<string>();
            if (isHealthy)
            {
                try
                {
                    models = await _llmService.GetAvailableModelsAsync();
                }
                catch
                {
                    // Ignore model list errors for health check
                }
            }

            return new
            {
                status = isHealthy ? "healthy" : "unhealthy",
                response_time_ms = (int)responseTime,
                models = models.ToArray()
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Ollama health check failed");
            return new
            {
                status = "unhealthy",
                response_time_ms = -1,
                models = new string[0],
                error = "Connection failed"
            };
        }
    }

    private long GetUptimeSeconds()
    {
        return (long)(DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime()).TotalSeconds;
    }
}