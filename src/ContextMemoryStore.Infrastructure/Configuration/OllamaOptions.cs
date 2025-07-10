namespace ContextMemoryStore.Infrastructure.Configuration;

/// <summary>
/// Configuration options for Ollama LLM service
/// </summary>
public class OllamaOptions
{
    public const string SectionName = "Ollama";

    /// <summary>
    /// Ollama API base URL (default: http://host.docker.internal:11434/v1)
    /// </summary>
    public string BaseUrl { get; set; } = "http://host.docker.internal:11434/v1";

    /// <summary>
    /// Chat model to use (default: llama3)
    /// </summary>
    public string ChatModel { get; set; } = "llama3";

    /// <summary>
    /// Embedding model to use (default: mxbai-embed-large)
    /// </summary>
    public string EmbeddingModel { get; set; } = "mxbai-embed-large";

    /// <summary>
    /// API key (not typically required for local Ollama)
    /// </summary>
    public string? ApiKey { get; set; }

    /// <summary>
    /// Request timeout in seconds (default: 120)
    /// </summary>
    public int TimeoutSeconds { get; set; } = 120;

    /// <summary>
    /// Maximum tokens for completions (default: 2048)
    /// </summary>
    public int MaxTokens { get; set; } = 2048;

    /// <summary>
    /// Temperature for text generation (default: 0.7)
    /// </summary>
    public double Temperature { get; set; } = 0.7;

    /// <summary>
    /// Number of retry attempts for failed requests (default: 3)
    /// </summary>
    public int RetryAttempts { get; set; } = 3;

    /// <summary>
    /// Base delay between retries in milliseconds (default: 1000)
    /// </summary>
    public int RetryDelayMs { get; set; } = 1000;

    /// <summary>
    /// Maximum delay between retries in milliseconds (default: 10000)
    /// </summary>
    public int MaxRetryDelayMs { get; set; } = 10000;

    /// <summary>
    /// Whether to enable streaming for chat completions (default: true)
    /// </summary>
    public bool EnableStreaming { get; set; } = true;

    /// <summary>
    /// Connection pool size for HTTP client (default: 10)
    /// </summary>
    public int ConnectionPoolSize { get; set; } = 10;

    /// <summary>
    /// Connection lifetime in minutes (default: 5)
    /// </summary>
    public int ConnectionLifetimeMinutes { get; set; } = 5;

    /// <summary>
    /// Enable circuit breaker pattern (default: true)
    /// </summary>
    public bool EnableCircuitBreaker { get; set; } = true;

    /// <summary>
    /// Number of consecutive failures before opening circuit (default: 5)
    /// </summary>
    public int CircuitBreakerFailureThreshold { get; set; } = 5;

    /// <summary>
    /// Circuit breaker open duration in seconds (default: 30)
    /// </summary>
    public int CircuitBreakerOpenDurationSeconds { get; set; } = 30;
}