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
}