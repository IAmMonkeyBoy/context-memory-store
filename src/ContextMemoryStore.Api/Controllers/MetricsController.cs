using Microsoft.AspNetCore.Mvc;
using ContextMemoryStore.Core.Interfaces;
using static ContextMemoryStore.Core.Interfaces.IMemoryService;

namespace ContextMemoryStore.Api.Controllers;

[ApiController]
[Route("metrics")]
public class MetricsController : ControllerBase
{
    private readonly IMemoryService _memoryService;
    private readonly ILogger<MetricsController> _logger;

    public MetricsController(IMemoryService memoryService, ILogger<MetricsController> logger)
    {
        _memoryService = memoryService;
        _logger = logger;
    }

    /// <summary>
    /// Prometheus metrics endpoint
    /// </summary>
    /// <returns>Prometheus format metrics</returns>
    [HttpGet("")]
    [Produces("text/plain")]
    [ProducesResponseType(typeof(string), 200)]
    [ProducesResponseType(typeof(string), 500)]
    public async Task<IActionResult> GetMetrics()
    {
        try
        {
            var stats = await _memoryService.GetStatisticsAsync();
            
            var prometheusMetrics = FormatPrometheusMetrics(stats);
            
            return Content(prometheusMetrics, "text/plain");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting metrics");
            
            var errorMetrics = @"# HELP context_memory_error_total Total number of errors
# TYPE context_memory_error_total counter
context_memory_error_total{type=""metrics_collection""} 1
";
            
            return StatusCode(500, errorMetrics);
        }
    }

    private string FormatPrometheusMetrics(MemoryStatistics stats)
    {
        // This is a simplified implementation
        // In a real implementation, you would use a proper metrics library like prometheus-net
        
        return $@"# HELP context_memory_documents_total Total number of documents in memory
# TYPE context_memory_documents_total counter
context_memory_documents_total {stats.DocumentCount}

# HELP context_memory_vectors_total Total number of vectors stored
# TYPE context_memory_vectors_total counter
context_memory_vectors_total {stats.VectorCount}

# HELP context_memory_relationships_total Total number of relationships stored
# TYPE context_memory_relationships_total counter
context_memory_relationships_total {stats.RelationshipCount}

# HELP context_memory_search_requests_total Total number of search requests
# TYPE context_memory_search_requests_total counter
context_memory_search_requests_total{{status=""success""}} 0
context_memory_search_requests_total{{status=""error""}} 0

# HELP context_memory_ingest_requests_total Total number of ingest requests
# TYPE context_memory_ingest_requests_total counter
context_memory_ingest_requests_total{{status=""success""}} 0
context_memory_ingest_requests_total{{status=""error""}} 0

# HELP context_memory_uptime_seconds System uptime in seconds
# TYPE context_memory_uptime_seconds gauge
context_memory_uptime_seconds {GetUptimeSeconds()}

# HELP context_memory_usage_bytes Memory usage in bytes
# TYPE context_memory_usage_bytes gauge
context_memory_usage_bytes {stats.MemoryUsageBytes}
";
    }

    private long GetUptimeSeconds()
    {
        return (long)(DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime()).TotalSeconds;
    }
}