using ContextMemoryStore.Core.Entities;

namespace ContextMemoryStore.Core.Interfaces;

/// <summary>
/// Service for scoring health checks and analyzing trends
/// </summary>
public interface IHealthCheckScoringService
{
    /// <summary>
    /// Calculates health score for a service based on health check result
    /// </summary>
    /// <param name="result">Health check result</param>
    /// <returns>Health score (0-100)</returns>
    int CalculateHealthScore(HealthCheckResult result);

    /// <summary>
    /// Records health check result for trend analysis
    /// </summary>
    /// <param name="result">Health check result to record</param>
    Task RecordHealthCheckResultAsync(HealthCheckResult result);

    /// <summary>
    /// Gets health trend data for a service
    /// </summary>
    /// <param name="serviceName">Name of the service</param>
    /// <param name="timeRange">Time range for trend analysis</param>
    /// <returns>Health trend data</returns>
    Task<HealthTrendData> GetHealthTrendAsync(string serviceName, TimeSpan timeRange);

    /// <summary>
    /// Gets overall system health score
    /// </summary>
    /// <returns>Overall system health score</returns>
    Task<SystemHealthScore> GetSystemHealthScoreAsync();

    /// <summary>
    /// Gets health alert recommendations based on trends
    /// </summary>
    /// <returns>List of health alert recommendations</returns>
    Task<List<HealthAlert>> GetHealthAlertsAsync();
}