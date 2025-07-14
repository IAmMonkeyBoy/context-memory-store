using ContextMemoryStore.Core.Interfaces;
using System.Diagnostics;

namespace ContextMemoryStore.Api.Middleware;

/// <summary>
/// Middleware for performance monitoring and metrics collection
/// </summary>
public class PerformanceMonitoringMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PerformanceMonitoringMiddleware> _logger;
    private readonly IMetricsCollectionService _metricsCollectionService;

    public PerformanceMonitoringMiddleware(
        RequestDelegate next, 
        ILogger<PerformanceMonitoringMiddleware> logger,
        IMetricsCollectionService metricsCollectionService)
    {
        _next = next;
        _logger = logger;
        _metricsCollectionService = metricsCollectionService;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        
        // Resolve scoped service from request scope
        var correlationIdService = context.RequestServices.GetRequiredService<ICorrelationIdService>();
        var correlationId = correlationIdService.GetCorrelationId();
        
        var endpoint = GetEndpointName(context);
        var method = context.Request.Method;
        
        // Start performance timer
        using var timer = _metricsCollectionService.StartTimer($"request_{endpoint}_{method}");
        
        try
        {
            _logger.LogDebug("Starting request monitoring for {Method} {Endpoint} with correlation ID: {CorrelationId}", 
                method, endpoint, correlationId);
            
            await _next(context);
            
            // Record successful request
            stopwatch.Stop();
            var responseTime = stopwatch.ElapsedMilliseconds;
            var statusCode = context.Response.StatusCode;
            
            _metricsCollectionService.RecordRequest(endpoint, method, statusCode, responseTime, correlationId);
            
            // Log slow requests
            if (responseTime > 5000) // 5 seconds threshold
            {
                _logger.LogWarning("Slow request detected: {Method} {Endpoint} took {ResponseTime}ms with status {StatusCode} (Correlation ID: {CorrelationId})", 
                    method, endpoint, responseTime, statusCode, correlationId);
            }
            else
            {
                _logger.LogDebug("Request completed: {Method} {Endpoint} in {ResponseTime}ms with status {StatusCode} (Correlation ID: {CorrelationId})", 
                    method, endpoint, responseTime, statusCode, correlationId);
            }
        }
        catch (Exception ex)
        {
            // Record failed request
            stopwatch.Stop();
            var responseTime = stopwatch.ElapsedMilliseconds;
            var statusCode = context.Response.StatusCode != 200 ? context.Response.StatusCode : 500;
            
            _metricsCollectionService.RecordRequest(endpoint, method, statusCode, responseTime, correlationId);
            _metricsCollectionService.RecordError("request_exception", endpoint, ex.Message, correlationId);
            
            _logger.LogError(ex, "Request failed: {Method} {Endpoint} after {ResponseTime}ms with status {StatusCode} (Correlation ID: {CorrelationId})", 
                method, endpoint, responseTime, statusCode, correlationId);
            
            throw;
        }
    }

    private string GetEndpointName(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        if (endpoint != null)
        {
            var routeEndpoint = endpoint as RouteEndpoint;
            if (routeEndpoint?.RoutePattern?.RawText != null)
            {
                return routeEndpoint.RoutePattern.RawText;
            }
        }
        
        // Fallback to path
        var path = context.Request.Path.Value ?? "/";
        
        // Clean up path for metrics (remove IDs, etc.)
        return CleanupPath(path);
    }

    private string CleanupPath(string path)
    {
        // Replace common ID patterns with placeholders for better metrics grouping
        var cleanPath = path;
        
        // Replace GUIDs with {id}
        cleanPath = System.Text.RegularExpressions.Regex.Replace(cleanPath, 
            @"/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", 
            "/{id}");
        
        // Replace numeric IDs with {id}
        cleanPath = System.Text.RegularExpressions.Regex.Replace(cleanPath, 
            @"/\d+(?=/|$)", 
            "/{id}");
        
        // Remove query parameters
        var queryIndex = cleanPath.IndexOf('?');
        if (queryIndex >= 0)
        {
            cleanPath = cleanPath.Substring(0, queryIndex);
        }
        
        return cleanPath;
    }
}

/// <summary>
/// Extension methods for performance monitoring middleware
/// </summary>
public static class PerformanceMonitoringMiddlewareExtensions
{
    /// <summary>
    /// Adds performance monitoring middleware to the pipeline
    /// </summary>
    public static IApplicationBuilder UsePerformanceMonitoring(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<PerformanceMonitoringMiddleware>();
    }
}