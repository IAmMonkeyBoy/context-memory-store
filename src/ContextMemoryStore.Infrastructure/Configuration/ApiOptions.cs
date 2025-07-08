using System.ComponentModel.DataAnnotations;

namespace ContextMemoryStore.Infrastructure.Configuration;

/// <summary>
/// Configuration options for API server settings
/// </summary>
public class ApiOptions
{
    public const string SectionName = "Api";

    /// <summary>
    /// API server host (default: 0.0.0.0)
    /// </summary>
    public string Host { get; set; } = "0.0.0.0";

    /// <summary>
    /// API server port (default: 8080)
    /// </summary>
    [Range(1, 65535, ErrorMessage = "Port must be between 1 and 65535")]
    public int Port { get; set; } = 8080;

    /// <summary>
    /// Enable CORS for web access (default: true)
    /// </summary>
    public bool CorsEnabled { get; set; } = true;

    /// <summary>
    /// Rate limiting (requests per minute) (default: 100)
    /// </summary>
    public int RateLimit { get; set; } = 100;

    /// <summary>
    /// Request timeout in seconds (default: 30)
    /// </summary>
    public int TimeoutSeconds { get; set; } = 30;
}