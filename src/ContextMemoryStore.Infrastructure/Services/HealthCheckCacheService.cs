using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Core.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace ContextMemoryStore.Infrastructure.Services;

/// <summary>
/// In-memory cache service for health check results
/// </summary>
public class HealthCheckCacheService : IHealthCheckCacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<HealthCheckCacheService> _logger;
    private readonly ConcurrentDictionary<string, DateTime> _cacheTimestamps = new();
    private long _totalRequests;
    private long _cacheHits;
    private long _cacheMisses;

    public HealthCheckCacheService(IMemoryCache cache, ILogger<HealthCheckCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Gets cached health check result for a service
    /// </summary>
    public async Task<HealthCheckResult?> GetCachedHealthCheckAsync(string serviceName)
    {
        Interlocked.Increment(ref _totalRequests);

        var cacheKey = GetCacheKey(serviceName);
        
        if (_cache.TryGetValue(cacheKey, out HealthCheckResult? cachedResult))
        {
            Interlocked.Increment(ref _cacheHits);
            
            if (cachedResult != null)
            {
                cachedResult.FromCache = true;
                _logger.LogDebug("Health check cache hit for service {ServiceName}", serviceName);
            }
            
            return cachedResult;
        }

        Interlocked.Increment(ref _cacheMisses);
        _logger.LogDebug("Health check cache miss for service {ServiceName}", serviceName);
        
        return null;
    }

    /// <summary>
    /// Sets cached health check result for a service
    /// </summary>
    public async Task SetCachedHealthCheckAsync(string serviceName, HealthCheckResult result, TimeSpan cacheDuration)
    {
        var cacheKey = GetCacheKey(serviceName);
        
        var cacheOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = cacheDuration,
            Priority = CacheItemPriority.Normal,
            Size = 1 // Each health check result counts as 1 unit
        };

        // Set a callback to log when cache entries are evicted
        cacheOptions.PostEvictionCallbacks.Add(new PostEvictionCallbackRegistration
        {
            EvictionCallback = OnCacheEviction,
            State = serviceName
        });

        _cache.Set(cacheKey, result, cacheOptions);
        _cacheTimestamps[serviceName] = DateTime.UtcNow;
        
        _logger.LogDebug("Health check result cached for service {ServiceName} with duration {Duration}", 
            serviceName, cacheDuration);
    }

    /// <summary>
    /// Invalidates cached health check result for a service
    /// </summary>
    public async Task InvalidateCachedHealthCheckAsync(string serviceName)
    {
        var cacheKey = GetCacheKey(serviceName);
        _cache.Remove(cacheKey);
        _cacheTimestamps.TryRemove(serviceName, out _);
        
        _logger.LogDebug("Health check cache invalidated for service {ServiceName}", serviceName);
    }

    /// <summary>
    /// Clears all cached health check results
    /// </summary>
    public async Task ClearAllCachedHealthChecksAsync()
    {
        // Memory cache doesn't have a clear all method, so we'll track keys and remove them
        var keysToRemove = _cacheTimestamps.Keys.ToList();
        
        foreach (var serviceName in keysToRemove)
        {
            await InvalidateCachedHealthCheckAsync(serviceName);
        }
        
        _logger.LogInformation("All health check cache entries cleared");
    }

    /// <summary>
    /// Gets health check statistics including cache hit/miss ratios
    /// </summary>
    public async Task<HealthCheckCacheStatistics> GetCacheStatisticsAsync()
    {
        return new HealthCheckCacheStatistics
        {
            TotalRequests = _totalRequests,
            CacheHits = _cacheHits,
            CacheMisses = _cacheMisses,
            CachedEntries = _cacheTimestamps.Count,
            LastUpdated = DateTime.UtcNow
        };
    }

    private static string GetCacheKey(string serviceName) => $"health_check_{serviceName}";

    private void OnCacheEviction(object key, object value, EvictionReason reason, object state)
    {
        var serviceName = state as string;
        if (serviceName != null)
        {
            _cacheTimestamps.TryRemove(serviceName, out _);
            _logger.LogDebug("Health check cache entry evicted for service {ServiceName}, reason: {Reason}", 
                serviceName, reason);
        }
    }
}