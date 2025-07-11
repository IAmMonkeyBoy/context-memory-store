using Microsoft.AspNetCore.Mvc;
using ContextMemoryStore.Core.Interfaces;
using Prometheus;
using static ContextMemoryStore.Core.Interfaces.IMemoryService;

namespace ContextMemoryStore.Api.Controllers;

[ApiController]
[Route("v1/metrics")]
public class MetricsController : ControllerBase
{
    private readonly IMemoryService _memoryService;
    private readonly IVectorStoreService _vectorStoreService;
    private readonly IGraphStoreService _graphStoreService;
    private readonly ILLMService _llmService;
    private readonly ILogger<MetricsController> _logger;

    // Prometheus metrics
    private static readonly Counter RequestsTotal = Metrics
        .CreateCounter("context_memory_requests_total", "Total number of requests", "endpoint", "status");

    private static readonly Histogram RequestDuration = Metrics
        .CreateHistogram("context_memory_request_duration_seconds", "Request duration in seconds", "endpoint");

    private static readonly Gauge DocumentsTotal = Metrics
        .CreateGauge("context_memory_documents_total", "Total number of documents in memory");

    private static readonly Gauge VectorsTotal = Metrics
        .CreateGauge("context_memory_vectors_total", "Total number of vectors stored");

    private static readonly Gauge RelationshipsTotal = Metrics
        .CreateGauge("context_memory_relationships_total", "Total number of relationships stored");

    private static readonly Gauge UptimeSeconds = Metrics
        .CreateGauge("context_memory_uptime_seconds", "System uptime in seconds");

    private static readonly Gauge MemoryUsageBytes = Metrics
        .CreateGauge("context_memory_usage_bytes", "Memory usage in bytes");

    public MetricsController(
        IMemoryService memoryService,
        IVectorStoreService vectorStoreService,
        IGraphStoreService graphStoreService,
        ILLMService llmService,
        ILogger<MetricsController> logger)
    {
        _memoryService = memoryService;
        _vectorStoreService = vectorStoreService;
        _graphStoreService = graphStoreService;
        _llmService = llmService;
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
    public async Task<IActionResult> GetMetrics(CancellationToken cancellationToken = default)
    {
        try
        {
            using var timer = RequestDuration.WithLabels("metrics").NewTimer();
            
            // Update metrics with current values
            await UpdateMetricsAsync(cancellationToken);
            
            // Return prometheus formatted metrics
            using var stream = new MemoryStream();
            await Metrics.DefaultRegistry.CollectAndExportAsTextAsync(stream, cancellationToken);
            var prometheusMetrics = System.Text.Encoding.UTF8.GetString(stream.ToArray());
            
            RequestsTotal.WithLabels("metrics", "success").Inc();
            return Content(prometheusMetrics, "text/plain; version=0.0.4");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting metrics");
            RequestsTotal.WithLabels("metrics", "error").Inc();
            
            var errorMetrics = @"# HELP context_memory_error_total Total number of errors
# TYPE context_memory_error_total counter
context_memory_error_total{type=""metrics_collection""} 1
";
            
            return StatusCode(500, errorMetrics);
        }
    }

    /// <summary>
    /// Updates Prometheus metrics with current system values
    /// </summary>
    private async Task UpdateMetricsAsync(CancellationToken cancellationToken)
    {
        try
        {
            // Get memory statistics
            var stats = await _memoryService.GetStatisticsAsync(cancellationToken);
            
            // Update gauge metrics
            DocumentsTotal.Set(stats.DocumentCount);
            VectorsTotal.Set(stats.VectorCount);
            RelationshipsTotal.Set(stats.RelationshipCount);
            UptimeSeconds.Set(GetUptimeSeconds());
            MemoryUsageBytes.Set(stats.MemoryUsageBytes);
            
            _logger.LogDebug("Updated Prometheus metrics - Documents: {DocumentCount}, Vectors: {VectorCount}, Relationships: {RelationshipCount}",
                stats.DocumentCount, stats.VectorCount, stats.RelationshipCount);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to update some Prometheus metrics");
            // Don't throw - we want to return whatever metrics we can
        }
    }

    /// <summary>
    /// Increments request counter - called by other controllers
    /// </summary>
    public static void IncrementRequestCounter(string endpoint, string status)
    {
        RequestsTotal.WithLabels(endpoint, status).Inc();
    }

    /// <summary>
    /// Creates a timer for request duration - called by other controllers
    /// </summary>
    public static IDisposable StartRequestTimer(string endpoint)
    {
        return RequestDuration.WithLabels(endpoint).NewTimer();
    }

    private long GetUptimeSeconds()
    {
        return (long)(DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime()).TotalSeconds;
    }
}