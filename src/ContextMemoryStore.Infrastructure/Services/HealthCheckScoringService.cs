using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Core.Interfaces;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace ContextMemoryStore.Infrastructure.Services;

/// <summary>
/// Service for scoring health checks and analyzing trends
/// </summary>
public class HealthCheckScoringService : IHealthCheckScoringService
{
    private readonly ILogger<HealthCheckScoringService> _logger;
    private readonly ConcurrentDictionary<string, List<HealthCheckResult>> _healthHistory = new();
    private readonly Dictionary<string, double> _serviceWeights = new()
    {
        { "qdrant", 0.4 },      // Vector store is critical
        { "neo4j", 0.3 },       // Graph store is important
        { "ollama", 0.2 },      // LLM service is important
        { "memory", 0.1 }       // Memory service is supporting
    };

    public HealthCheckScoringService(ILogger<HealthCheckScoringService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Calculates health score for a service based on health check result
    /// </summary>
    public int CalculateHealthScore(HealthCheckResult result)
    {
        var baseScore = result.Status switch
        {
            HealthStatus.Healthy => 100,
            HealthStatus.Unhealthy => 0,
            HealthStatus.Timeout => 25,
            HealthStatus.Cancelled => 50,
            _ => 0
        };

        // Adjust score based on response time
        var responseTimePenalty = CalculateResponseTimePenalty(result.ResponseTimeMs);
        var adjustedScore = Math.Max(0, baseScore - responseTimePenalty);

        // Apply service-specific adjustments
        var serviceAdjustment = CalculateServiceSpecificAdjustment(result);
        var finalScore = Math.Max(0, Math.Min(100, adjustedScore + serviceAdjustment));

        _logger.LogDebug("Health score calculated for {ServiceName}: {Score} (base: {BaseScore}, response penalty: {ResponseTimePenalty}, service adjustment: {ServiceAdjustment})",
            result.ServiceName, finalScore, baseScore, responseTimePenalty, serviceAdjustment);

        return (int)finalScore;
    }

    /// <summary>
    /// Records health check result for trend analysis
    /// </summary>
    public async Task RecordHealthCheckResultAsync(HealthCheckResult result)
    {
        var serviceName = result.ServiceName.ToLowerInvariant();
        
        _healthHistory.AddOrUpdate(serviceName, 
            new List<HealthCheckResult> { result },
            (key, existing) =>
            {
                existing.Add(result);
                
                // Keep only last 1000 results per service to prevent memory issues
                if (existing.Count > 1000)
                {
                    existing.RemoveRange(0, existing.Count - 1000);
                }
                
                return existing;
            });

        _logger.LogDebug("Health check result recorded for {ServiceName}", serviceName);
    }

    /// <summary>
    /// Gets health trend data for a service
    /// </summary>
    public async Task<HealthTrendData> GetHealthTrendAsync(string serviceName, TimeSpan timeRange)
    {
        var serviceKey = serviceName.ToLowerInvariant();
        var cutoffTime = DateTime.UtcNow - timeRange;
        
        if (!_healthHistory.TryGetValue(serviceKey, out var allResults))
        {
            return new HealthTrendData
            {
                ServiceName = serviceName,
                TimeRange = timeRange,
                Trend = HealthTrend.Unknown
            };
        }

        var recentResults = allResults
            .Where(r => r.Timestamp >= cutoffTime)
            .OrderBy(r => r.Timestamp)
            .ToList();

        if (recentResults.Count == 0)
        {
            return new HealthTrendData
            {
                ServiceName = serviceName,
                TimeRange = timeRange,
                Trend = HealthTrend.Unknown
            };
        }

        var scores = recentResults.Select(r => r.Score).ToList();
        var healthyResults = recentResults.Where(r => r.Status == HealthStatus.Healthy).ToList();
        
        var trendData = new HealthTrendData
        {
            ServiceName = serviceName,
            TimeRange = timeRange,
            Results = recentResults,
            AverageScore = scores.Average(),
            MinScore = scores.Min(),
            MaxScore = scores.Max(),
            CurrentScore = scores.LastOrDefault(),
            UptimePercentage = (double)healthyResults.Count / recentResults.Count * 100,
            AverageResponseTime = recentResults.Average(r => r.ResponseTimeMs),
            TotalChecks = recentResults.Count,
            FailedChecks = recentResults.Count(r => r.Status != HealthStatus.Healthy),
            Trend = CalculateTrend(scores)
        };

        return trendData;
    }

    /// <summary>
    /// Gets overall system health score
    /// </summary>
    public async Task<SystemHealthScore> GetSystemHealthScoreAsync()
    {
        var serviceScores = new Dictionary<string, int>();
        var criticalIssues = new List<string>();
        
        foreach (var (serviceName, weight) in _serviceWeights)
        {
            var trendData = await GetHealthTrendAsync(serviceName, TimeSpan.FromMinutes(15));
            var score = trendData.CurrentScore;
            
            serviceScores[serviceName] = score;
            
            if (score < 50 && weight > 0.2) // Critical services with low scores
            {
                criticalIssues.Add(serviceName);
            }
        }

        // Calculate weighted overall score
        var weightedScore = 0.0;
        var totalWeight = 0.0;
        
        foreach (var (serviceName, weight) in _serviceWeights)
        {
            if (serviceScores.ContainsKey(serviceName))
            {
                weightedScore += serviceScores[serviceName] * weight;
                totalWeight += weight;
            }
        }

        var overallScore = totalWeight > 0 ? (int)(weightedScore / totalWeight) : 0;
        
        var systemStatus = overallScore switch
        {
            >= 80 => HealthStatus.Healthy,
            >= 50 => HealthStatus.Unhealthy,
            _ => HealthStatus.Unhealthy
        };

        // Calculate system trend based on recent overall scores
        var systemTrend = await CalculateSystemTrend();

        return new SystemHealthScore
        {
            OverallScore = overallScore,
            ServiceScores = serviceScores,
            ServiceWeights = _serviceWeights,
            SystemStatus = systemStatus,
            SystemTrend = systemTrend,
            CriticalIssues = criticalIssues
        };
    }

    /// <summary>
    /// Gets health alert recommendations based on trends
    /// </summary>
    public async Task<List<HealthAlert>> GetHealthAlertsAsync()
    {
        var alerts = new List<HealthAlert>();

        foreach (var serviceName in _serviceWeights.Keys)
        {
            var trendData = await GetHealthTrendAsync(serviceName, TimeSpan.FromMinutes(30));
            
            // Check for critical issues
            if (trendData.CurrentScore < 25)
            {
                alerts.Add(new HealthAlert
                {
                    Severity = AlertSeverity.Critical,
                    ServiceName = serviceName,
                    Title = $"{serviceName} Service Critical",
                    Message = $"Service {serviceName} has a critically low health score of {trendData.CurrentScore}",
                    RecommendedAction = "Investigate service logs and connectivity immediately"
                });
            }
            
            // Check for degrading trends
            if (trendData.Trend == HealthTrend.Degrading && trendData.CurrentScore < 70)
            {
                alerts.Add(new HealthAlert
                {
                    Severity = AlertSeverity.Warning,
                    ServiceName = serviceName,
                    Title = $"{serviceName} Service Degrading",
                    Message = $"Service {serviceName} is showing a degrading health trend with current score {trendData.CurrentScore}",
                    RecommendedAction = "Monitor service performance and check for resource constraints"
                });
            }
            
            // Check for high response times
            if (trendData.AverageResponseTime > 5000) // 5 seconds
            {
                alerts.Add(new HealthAlert
                {
                    Severity = AlertSeverity.Warning,
                    ServiceName = serviceName,
                    Title = $"{serviceName} High Response Time",
                    Message = $"Service {serviceName} has high average response time of {trendData.AverageResponseTime:F0}ms",
                    RecommendedAction = "Check service load and network connectivity"
                });
            }
            
            // Check for low uptime
            if (trendData.UptimePercentage < 95 && trendData.TotalChecks > 10)
            {
                alerts.Add(new HealthAlert
                {
                    Severity = AlertSeverity.Error,
                    ServiceName = serviceName,
                    Title = $"{serviceName} Low Uptime",
                    Message = $"Service {serviceName} has low uptime of {trendData.UptimePercentage:F1}%",
                    RecommendedAction = "Investigate service reliability and implement retry mechanisms"
                });
            }
        }

        return alerts;
    }

    private int CalculateResponseTimePenalty(int responseTimeMs)
    {
        // Penalty based on response time thresholds
        return responseTimeMs switch
        {
            < 1000 => 0,        // < 1s: no penalty
            < 3000 => 5,        // 1-3s: small penalty
            < 5000 => 15,       // 3-5s: medium penalty
            < 10000 => 30,      // 5-10s: large penalty
            _ => 50             // > 10s: severe penalty
        };
    }

    private int CalculateServiceSpecificAdjustment(HealthCheckResult result)
    {
        // Service-specific adjustments based on additional info
        var adjustment = 0;
        
        if (result.AdditionalInfo != null)
        {
            // Example: boost score for services with good connection counts
            if (result.AdditionalInfo.TryGetValue("connections", out var connectionObj) && 
                connectionObj is int connections && connections > 0)
            {
                adjustment += 5;
            }
            
            // Example: reduce score for services with errors
            if (result.AdditionalInfo.TryGetValue("errors", out var errorObj) && 
                errorObj is int errors && errors > 0)
            {
                adjustment -= Math.Min(20, errors * 2);
            }
        }
        
        return adjustment;
    }

    private HealthTrend CalculateTrend(List<int> scores)
    {
        if (scores.Count < 3)
            return HealthTrend.Unknown;

        var recentScores = scores.TakeLast(Math.Min(10, scores.Count)).ToList();
        var firstHalf = recentScores.Take(recentScores.Count / 2).Average();
        var secondHalf = recentScores.Skip(recentScores.Count / 2).Average();

        var difference = secondHalf - firstHalf;
        
        return difference switch
        {
            > 10 => HealthTrend.Improving,
            < -10 => HealthTrend.Degrading,
            _ => HealthTrend.Stable
        };
    }

    private async Task<HealthTrend> CalculateSystemTrend()
    {
        var systemScores = new List<int>();
        
        // Calculate system health scores for the last 10 data points
        for (int i = 0; i < 10; i++)
        {
            var timeOffset = TimeSpan.FromMinutes(i * 2); // Every 2 minutes
            var weightedScore = 0.0;
            var totalWeight = 0.0;
            
            foreach (var (serviceName, weight) in _serviceWeights)
            {
                var trendData = await GetHealthTrendAsync(serviceName, TimeSpan.FromMinutes(15));
                if (trendData.Results.Count > i)
                {
                    var historicalResult = trendData.Results.Skip(Math.Max(0, trendData.Results.Count - 1 - i)).FirstOrDefault();
                    if (historicalResult != null)
                    {
                        weightedScore += historicalResult.Score * weight;
                        totalWeight += weight;
                    }
                }
            }
            
            if (totalWeight > 0)
            {
                systemScores.Add((int)(weightedScore / totalWeight));
            }
        }

        return CalculateTrend(systemScores);
    }
}