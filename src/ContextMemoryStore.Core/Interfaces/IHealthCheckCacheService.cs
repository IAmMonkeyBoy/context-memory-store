using ContextMemoryStore.Core.Entities;

namespace ContextMemoryStore.Core.Interfaces;

/// <summary>
/// Service for caching health check results to reduce external service calls
/// </summary>
public interface IHealthCheckCacheService
{
    /// <summary>
    /// Gets cached health check result for a service
    /// </summary>
    /// <param name="serviceName">Name of the service</param>
    /// <returns>Cached health check result or null if not cached</returns>
    Task<HealthCheckResult?> GetCachedHealthCheckAsync(string serviceName);

    /// <summary>
    /// Sets cached health check result for a service
    /// </summary>
    /// <param name="serviceName">Name of the service</param>
    /// <param name="result">Health check result to cache</param>
    /// <param name="cacheDuration">Duration to cache the result</param>
    Task SetCachedHealthCheckAsync(string serviceName, HealthCheckResult result, TimeSpan cacheDuration);

    /// <summary>
    /// Invalidates cached health check result for a service
    /// </summary>
    /// <param name="serviceName">Name of the service</param>
    Task InvalidateCachedHealthCheckAsync(string serviceName);

    /// <summary>
    /// Clears all cached health check results
    /// </summary>
    Task ClearAllCachedHealthChecksAsync();

    /// <summary>
    /// Gets health check statistics including cache hit/miss ratios
    /// </summary>
    /// <returns>Health check cache statistics</returns>
    Task<HealthCheckCacheStatistics> GetCacheStatisticsAsync();
}