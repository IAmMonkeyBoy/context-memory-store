using Microsoft.AspNetCore.Mvc;
using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Core.Entities;

namespace ContextMemoryStore.Api.Controllers;

/// <summary>
/// Controller for system diagnostics and troubleshooting
/// </summary>
[ApiController]
[Route("api/v1/diagnostics")]
[Produces("application/json")]
public class DiagnosticsController : ControllerBase
{
    private readonly IDiagnosticsService _diagnosticsService;
    private readonly IMetricsCollectionService _metricsCollectionService;
    private readonly ICorrelationIdService _correlationIdService;
    private readonly ILogger<DiagnosticsController> _logger;

    public DiagnosticsController(
        IDiagnosticsService diagnosticsService,
        IMetricsCollectionService metricsCollectionService,
        ICorrelationIdService correlationIdService,
        ILogger<DiagnosticsController> logger)
    {
        _diagnosticsService = diagnosticsService;
        _metricsCollectionService = metricsCollectionService;
        _correlationIdService = correlationIdService;
        _logger = logger;
    }

    /// <summary>
    /// Gets comprehensive system diagnostic information
    /// </summary>
    /// <returns>System diagnostic information</returns>
    [HttpGet("system")]
    [ProducesResponseType(typeof(SystemDiagnostics), 200)]
    [ProducesResponseType(typeof(object), 500)]
    public async Task<IActionResult> GetSystemDiagnostics()
    {
        var correlationId = _correlationIdService.GetCorrelationId();
        var startTime = DateTime.UtcNow;
        
        try
        {
            using var timer = _metricsCollectionService.StartTimer("diagnostics_system");
            
            _logger.LogInformation("Starting system diagnostics collection with correlation ID: {CorrelationId}", correlationId);
            
            var diagnostics = await _diagnosticsService.GetSystemDiagnosticsAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/system", "GET", 200, (long)responseTime, correlationId);
            
            _logger.LogInformation("System diagnostics collected successfully in {ResponseTime}ms", responseTime);
            
            return Ok(diagnostics);
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/system", "GET", 500, (long)responseTime, correlationId);
            _metricsCollectionService.RecordError("system_diagnostics_error", "DiagnosticsController", ex.Message, correlationId);
            
            _logger.LogError(ex, "Error collecting system diagnostics");
            
            return StatusCode(500, new { error = "Failed to collect system diagnostics", correlation_id = correlationId });
        }
    }

    /// <summary>
    /// Gets performance diagnostics for a specific time range
    /// </summary>
    /// <param name="timeRangeMinutes">Time range in minutes (default: 15)</param>
    /// <returns>Performance diagnostic information</returns>
    [HttpGet("performance")]
    [ProducesResponseType(typeof(PerformanceDiagnostics), 200)]
    [ProducesResponseType(typeof(object), 400)]
    [ProducesResponseType(typeof(object), 500)]
    public async Task<IActionResult> GetPerformanceDiagnostics([FromQuery] int timeRangeMinutes = 15)
    {
        var correlationId = _correlationIdService.GetCorrelationId();
        var startTime = DateTime.UtcNow;
        
        try
        {
            if (timeRangeMinutes <= 0 || timeRangeMinutes > 1440) // Max 24 hours
            {
                return BadRequest(new { error = "Time range must be between 1 and 1440 minutes", correlation_id = correlationId });
            }
            
            using var timer = _metricsCollectionService.StartTimer("diagnostics_performance");
            
            _logger.LogInformation("Starting performance diagnostics collection for {TimeRange} minutes with correlation ID: {CorrelationId}", 
                timeRangeMinutes, correlationId);
            
            var timeRange = TimeSpan.FromMinutes(timeRangeMinutes);
            var diagnostics = await _diagnosticsService.GetPerformanceDiagnosticsAsync(timeRange);
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/performance", "GET", 200, (long)responseTime, correlationId);
            
            _logger.LogInformation("Performance diagnostics collected successfully in {ResponseTime}ms", responseTime);
            
            return Ok(diagnostics);
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/performance", "GET", 500, (long)responseTime, correlationId);
            _metricsCollectionService.RecordError("performance_diagnostics_error", "DiagnosticsController", ex.Message, correlationId);
            
            _logger.LogError(ex, "Error collecting performance diagnostics");
            
            return StatusCode(500, new { error = "Failed to collect performance diagnostics", correlation_id = correlationId });
        }
    }

    /// <summary>
    /// Gets service connectivity diagnostics
    /// </summary>
    /// <returns>Service connectivity diagnostic information</returns>
    [HttpGet("connectivity")]
    [ProducesResponseType(typeof(ServiceConnectivityDiagnostics), 200)]
    [ProducesResponseType(typeof(object), 500)]
    public async Task<IActionResult> GetServiceConnectivityDiagnostics()
    {
        var correlationId = _correlationIdService.GetCorrelationId();
        var startTime = DateTime.UtcNow;
        
        try
        {
            using var timer = _metricsCollectionService.StartTimer("diagnostics_connectivity");
            
            _logger.LogInformation("Starting connectivity diagnostics collection with correlation ID: {CorrelationId}", correlationId);
            
            var diagnostics = await _diagnosticsService.GetServiceConnectivityDiagnosticsAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/connectivity", "GET", 200, (long)responseTime, correlationId);
            
            _logger.LogInformation("Connectivity diagnostics collected successfully in {ResponseTime}ms", responseTime);
            
            return Ok(diagnostics);
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/connectivity", "GET", 500, (long)responseTime, correlationId);
            _metricsCollectionService.RecordError("connectivity_diagnostics_error", "DiagnosticsController", ex.Message, correlationId);
            
            _logger.LogError(ex, "Error collecting connectivity diagnostics");
            
            return StatusCode(500, new { error = "Failed to collect connectivity diagnostics", correlation_id = correlationId });
        }
    }

    /// <summary>
    /// Gets configuration diagnostics
    /// </summary>
    /// <returns>Configuration diagnostic information</returns>
    [HttpGet("configuration")]
    [ProducesResponseType(typeof(ConfigurationDiagnostics), 200)]
    [ProducesResponseType(typeof(object), 500)]
    public async Task<IActionResult> GetConfigurationDiagnostics()
    {
        var correlationId = _correlationIdService.GetCorrelationId();
        var startTime = DateTime.UtcNow;
        
        try
        {
            using var timer = _metricsCollectionService.StartTimer("diagnostics_configuration");
            
            _logger.LogInformation("Starting configuration diagnostics collection with correlation ID: {CorrelationId}", correlationId);
            
            var diagnostics = await _diagnosticsService.GetConfigurationDiagnosticsAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/configuration", "GET", 200, (long)responseTime, correlationId);
            
            _logger.LogInformation("Configuration diagnostics collected successfully in {ResponseTime}ms", responseTime);
            
            return Ok(diagnostics);
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/configuration", "GET", 500, (long)responseTime, correlationId);
            _metricsCollectionService.RecordError("configuration_diagnostics_error", "DiagnosticsController", ex.Message, correlationId);
            
            _logger.LogError(ex, "Error collecting configuration diagnostics");
            
            return StatusCode(500, new { error = "Failed to collect configuration diagnostics", correlation_id = correlationId });
        }
    }

    /// <summary>
    /// Gets resource usage diagnostics
    /// </summary>
    /// <returns>Resource usage diagnostic information</returns>
    [HttpGet("resources")]
    [ProducesResponseType(typeof(ResourceUsageDiagnostics), 200)]
    [ProducesResponseType(typeof(object), 500)]
    public async Task<IActionResult> GetResourceUsageDiagnostics()
    {
        var correlationId = _correlationIdService.GetCorrelationId();
        var startTime = DateTime.UtcNow;
        
        try
        {
            using var timer = _metricsCollectionService.StartTimer("diagnostics_resources");
            
            _logger.LogInformation("Starting resource usage diagnostics collection with correlation ID: {CorrelationId}", correlationId);
            
            var diagnostics = await _diagnosticsService.GetResourceUsageDiagnosticsAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/resources", "GET", 200, (long)responseTime, correlationId);
            
            _logger.LogInformation("Resource usage diagnostics collected successfully in {ResponseTime}ms", responseTime);
            
            return Ok(diagnostics);
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/resources", "GET", 500, (long)responseTime, correlationId);
            _metricsCollectionService.RecordError("resource_diagnostics_error", "DiagnosticsController", ex.Message, correlationId);
            
            _logger.LogError(ex, "Error collecting resource usage diagnostics");
            
            return StatusCode(500, new { error = "Failed to collect resource usage diagnostics", correlation_id = correlationId });
        }
    }

    /// <summary>
    /// Runs a comprehensive system health check
    /// </summary>
    /// <returns>Comprehensive health check results</returns>
    [HttpGet("health-check")]
    [ProducesResponseType(typeof(ComprehensiveHealthCheck), 200)]
    [ProducesResponseType(typeof(object), 500)]
    public async Task<IActionResult> RunComprehensiveHealthCheck()
    {
        var correlationId = _correlationIdService.GetCorrelationId();
        var startTime = DateTime.UtcNow;
        
        try
        {
            using var timer = _metricsCollectionService.StartTimer("diagnostics_health_check");
            
            _logger.LogInformation("Starting comprehensive health check with correlation ID: {CorrelationId}", correlationId);
            
            var healthCheck = await _diagnosticsService.RunComprehensiveHealthCheckAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/health-check", "GET", 200, (long)responseTime, correlationId);
            
            _logger.LogInformation("Comprehensive health check completed in {ResponseTime}ms with status: {Status}", 
                responseTime, healthCheck.OverallStatus);
            
            return Ok(healthCheck);
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/health-check", "GET", 500, (long)responseTime, correlationId);
            _metricsCollectionService.RecordError("health_check_error", "DiagnosticsController", ex.Message, correlationId);
            
            _logger.LogError(ex, "Error running comprehensive health check");
            
            return StatusCode(500, new { error = "Failed to run comprehensive health check", correlation_id = correlationId });
        }
    }

    /// <summary>
    /// Gets troubleshooting recommendations based on current system state
    /// </summary>
    /// <returns>List of troubleshooting recommendations</returns>
    [HttpGet("recommendations")]
    [ProducesResponseType(typeof(List<TroubleshootingRecommendation>), 200)]
    [ProducesResponseType(typeof(object), 500)]
    public async Task<IActionResult> GetTroubleshootingRecommendations()
    {
        var correlationId = _correlationIdService.GetCorrelationId();
        var startTime = DateTime.UtcNow;
        
        try
        {
            using var timer = _metricsCollectionService.StartTimer("diagnostics_recommendations");
            
            _logger.LogInformation("Starting troubleshooting recommendations collection with correlation ID: {CorrelationId}", correlationId);
            
            var recommendations = await _diagnosticsService.GetTroubleshootingRecommendationsAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/recommendations", "GET", 200, (long)responseTime, correlationId);
            
            _logger.LogInformation("Troubleshooting recommendations collected successfully in {ResponseTime}ms. Found {Count} recommendations", 
                responseTime, recommendations.Count);
            
            return Ok(recommendations);
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/recommendations", "GET", 500, (long)responseTime, correlationId);
            _metricsCollectionService.RecordError("recommendations_error", "DiagnosticsController", ex.Message, correlationId);
            
            _logger.LogError(ex, "Error collecting troubleshooting recommendations");
            
            return StatusCode(500, new { error = "Failed to collect troubleshooting recommendations", correlation_id = correlationId });
        }
    }

    /// <summary>
    /// Generates a comprehensive diagnostic report for support
    /// </summary>
    /// <returns>Diagnostic report</returns>
    [HttpGet("report")]
    [ProducesResponseType(typeof(DiagnosticReport), 200)]
    [ProducesResponseType(typeof(object), 500)]
    public async Task<IActionResult> GenerateDiagnosticReport()
    {
        var correlationId = _correlationIdService.GetCorrelationId();
        var startTime = DateTime.UtcNow;
        
        try
        {
            using var timer = _metricsCollectionService.StartTimer("diagnostics_report");
            
            _logger.LogInformation("Starting diagnostic report generation with correlation ID: {CorrelationId}", correlationId);
            
            var report = await _diagnosticsService.GenerateDiagnosticReportAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/report", "GET", 200, (long)responseTime, correlationId);
            
            _logger.LogInformation("Diagnostic report generated successfully in {ResponseTime}ms. Report ID: {ReportId}", 
                responseTime, report.ReportId);
            
            return Ok(report);
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/report", "GET", 500, (long)responseTime, correlationId);
            _metricsCollectionService.RecordError("diagnostic_report_error", "DiagnosticsController", ex.Message, correlationId);
            
            _logger.LogError(ex, "Error generating diagnostic report");
            
            return StatusCode(500, new { error = "Failed to generate diagnostic report", correlation_id = correlationId });
        }
    }

    /// <summary>
    /// Gets current system metrics
    /// </summary>
    /// <returns>Current system metrics</returns>
    [HttpGet("metrics")]
    [ProducesResponseType(typeof(SystemMetrics), 200)]
    [ProducesResponseType(typeof(object), 500)]
    public async Task<IActionResult> GetSystemMetrics()
    {
        var correlationId = _correlationIdService.GetCorrelationId();
        var startTime = DateTime.UtcNow;
        
        try
        {
            using var timer = _metricsCollectionService.StartTimer("diagnostics_metrics");
            
            _logger.LogInformation("Starting system metrics collection with correlation ID: {CorrelationId}", correlationId);
            
            var metrics = await _metricsCollectionService.GetSystemMetricsAsync();
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/metrics", "GET", 200, (long)responseTime, correlationId);
            
            _logger.LogInformation("System metrics collected successfully in {ResponseTime}ms", responseTime);
            
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            _metricsCollectionService.RecordRequest("diagnostics/metrics", "GET", 500, (long)responseTime, correlationId);
            _metricsCollectionService.RecordError("system_metrics_error", "DiagnosticsController", ex.Message, correlationId);
            
            _logger.LogError(ex, "Error collecting system metrics");
            
            return StatusCode(500, new { error = "Failed to collect system metrics", correlation_id = correlationId });
        }
    }
}