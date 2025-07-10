using ContextMemoryStore.Core.Interfaces;
using Microsoft.AspNetCore.Http;

namespace ContextMemoryStore.Infrastructure.Services;

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