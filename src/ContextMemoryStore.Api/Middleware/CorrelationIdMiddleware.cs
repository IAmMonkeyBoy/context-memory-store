using Microsoft.Extensions.Primitives;
using Serilog.Context;

namespace ContextMemoryStore.Api.Middleware;

/// <summary>
/// Middleware to handle correlation IDs for request tracing
/// </summary>
public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;
    private const string CorrelationIdHeader = "X-Correlation-ID";

    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = GetOrCreateCorrelationId(context);
        
        // Add correlation ID to response headers
        context.Response.Headers.Add(CorrelationIdHeader, correlationId);
        
        // Add correlation ID to HttpContext for easy access
        context.Items[CorrelationIdHeader] = correlationId;
        
        // Add correlation ID to Serilog context for structured logging
        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            _logger.LogDebug("Processing request with correlation ID: {CorrelationId}", correlationId);
            
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception in request with correlation ID: {CorrelationId}", correlationId);
                throw;
            }
        }
    }

    private string GetOrCreateCorrelationId(HttpContext context)
    {
        // Check if correlation ID is provided in request headers
        if (context.Request.Headers.TryGetValue(CorrelationIdHeader, out StringValues correlationId) &&
            !string.IsNullOrWhiteSpace(correlationId))
        {
            return correlationId.ToString();
        }

        // Check if correlation ID is provided in query parameters
        if (context.Request.Query.TryGetValue("correlationId", out StringValues queryCorrelationId) &&
            !string.IsNullOrWhiteSpace(queryCorrelationId))
        {
            return queryCorrelationId.ToString();
        }

        // Generate a new correlation ID if not provided
        return Guid.NewGuid().ToString();
    }
}

/// <summary>
/// Extension methods for correlation ID middleware
/// </summary>
public static class CorrelationIdMiddlewareExtensions
{
    /// <summary>
    /// Adds correlation ID middleware to the pipeline
    /// </summary>
    public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<CorrelationIdMiddleware>();
    }
}

/// <summary>
/// Service for accessing correlation ID in other parts of the application
/// </summary>
public interface ICorrelationIdService
{
    /// <summary>
    /// Gets the current correlation ID
    /// </summary>
    string? GetCorrelationId();
}

/// <summary>
/// Implementation of correlation ID service
/// </summary>
public class CorrelationIdService : ICorrelationIdService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private const string CorrelationIdHeader = "X-Correlation-ID";

    public CorrelationIdService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Gets the current correlation ID
    /// </summary>
    public string? GetCorrelationId()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context?.Items.TryGetValue(CorrelationIdHeader, out var correlationId) == true)
        {
            return correlationId?.ToString();
        }
        
        return null;
    }
}