using ContextMemoryStore.Core.Entities;

namespace ContextMemoryStore.Core.Interfaces;

/// <summary>
/// Service for system diagnostics and troubleshooting
/// </summary>
public interface IDiagnosticsService
{
    /// <summary>
    /// Gets comprehensive system diagnostic information
    /// </summary>
    /// <returns>System diagnostic information</returns>
    Task<SystemDiagnostics> GetSystemDiagnosticsAsync();

    /// <summary>
    /// Gets performance diagnostics for a specific time range
    /// </summary>
    /// <param name="timeRange">Time range for diagnostics</param>
    /// <returns>Performance diagnostic information</returns>
    Task<PerformanceDiagnostics> GetPerformanceDiagnosticsAsync(TimeSpan timeRange);

    /// <summary>
    /// Gets service connectivity diagnostics
    /// </summary>
    /// <returns>Service connectivity diagnostic information</returns>
    Task<ServiceConnectivityDiagnostics> GetServiceConnectivityDiagnosticsAsync();

    /// <summary>
    /// Gets configuration diagnostics
    /// </summary>
    /// <returns>Configuration diagnostic information</returns>
    Task<ConfigurationDiagnostics> GetConfigurationDiagnosticsAsync();

    /// <summary>
    /// Gets resource usage diagnostics
    /// </summary>
    /// <returns>Resource usage diagnostic information</returns>
    Task<ResourceUsageDiagnostics> GetResourceUsageDiagnosticsAsync();

    /// <summary>
    /// Runs a comprehensive system health check
    /// </summary>
    /// <returns>Comprehensive health check results</returns>
    Task<ComprehensiveHealthCheck> RunComprehensiveHealthCheckAsync();

    /// <summary>
    /// Gets troubleshooting recommendations based on current system state
    /// </summary>
    /// <returns>List of troubleshooting recommendations</returns>
    Task<List<TroubleshootingRecommendation>> GetTroubleshootingRecommendationsAsync();

    /// <summary>
    /// Generates a diagnostic report for support
    /// </summary>
    /// <returns>Diagnostic report</returns>
    Task<DiagnosticReport> GenerateDiagnosticReportAsync();
}