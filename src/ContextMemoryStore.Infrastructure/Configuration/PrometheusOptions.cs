namespace ContextMemoryStore.Infrastructure.Configuration;

/// <summary>
/// Configuration options for Prometheus metrics
/// </summary>
public class PrometheusOptions
{
    public const string SectionName = "Prometheus";

    /// <summary>
    /// Whether metrics collection is enabled (default: true)
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Metrics endpoint path (default: /metrics)
    /// </summary>
    public string MetricsPath { get; set; } = "/metrics";

    /// <summary>
    /// Metric prefix for all custom metrics (default: context_memory)
    /// </summary>
    public string MetricPrefix { get; set; } = "context_memory";

    /// <summary>
    /// Whether to collect ASP.NET Core metrics (default: true)
    /// </summary>
    public bool CollectAspNetCoreMetrics { get; set; } = true;

    /// <summary>
    /// Whether to collect system metrics (default: true)
    /// </summary>
    public bool CollectSystemMetrics { get; set; } = true;

    /// <summary>
    /// Port for Prometheus metrics server (default: 9090)
    /// </summary>
    public int Port { get; set; } = 9090;
}