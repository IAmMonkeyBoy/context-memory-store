namespace ContextMemoryStore.Core.Interfaces;

/// <summary>
/// Service interface for Large Language Model operations
/// </summary>
public interface ILLMService
{
    /// <summary>
    /// Generates embeddings for the given text
    /// </summary>
    /// <param name="text">Text to embed</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Embedding vector</returns>
    Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates embeddings for multiple texts in batch
    /// </summary>
    /// <param name="texts">Texts to embed</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Embedding vectors</returns>
    Task<IEnumerable<float[]>> GenerateEmbeddingsAsync(IEnumerable<string> texts, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a chat completion using the LLM
    /// </summary>
    /// <param name="messages">Conversation messages</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Generated response</returns>
    Task<string> GenerateChatCompletionAsync(IEnumerable<ChatMessage> messages, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a streaming chat completion using the LLM
    /// </summary>
    /// <param name="messages">Conversation messages</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Async enumerable of response chunks</returns>
    IAsyncEnumerable<string> GenerateStreamingChatCompletionAsync(IEnumerable<ChatMessage> messages, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a summary of the given text
    /// </summary>
    /// <param name="text">Text to summarize</param>
    /// <param name="maxLength">Maximum summary length</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Generated summary</returns>
    Task<string> GenerateSummaryAsync(string text, int maxLength = 500, CancellationToken cancellationToken = default);

    /// <summary>
    /// Extracts relationships from the given text
    /// </summary>
    /// <param name="text">Text to analyze</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Extracted relationships</returns>
    Task<IEnumerable<RelationshipExtraction>> ExtractRelationshipsAsync(string text, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if the LLM service is healthy
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if healthy, false otherwise</returns>
    Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets available models from the LLM service
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of available model names</returns>
    Task<List<string>> GetAvailableModelsAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Represents a chat message
/// </summary>
public class ChatMessage
{
    /// <summary>
    /// Role of the message sender (system, user, assistant)
    /// </summary>
    public required string Role { get; set; }

    /// <summary>
    /// Content of the message
    /// </summary>
    public required string Content { get; set; }
}

/// <summary>
/// Represents an extracted relationship from text
/// </summary>
public class RelationshipExtraction
{
    /// <summary>
    /// Source entity in the relationship
    /// </summary>
    public required string Source { get; set; }

    /// <summary>
    /// Target entity in the relationship
    /// </summary>
    public required string Target { get; set; }

    /// <summary>
    /// Type of relationship
    /// </summary>
    public required string Type { get; set; }

    /// <summary>
    /// Confidence score (0.0 to 1.0)
    /// </summary>
    public double Confidence { get; set; }

    /// <summary>
    /// Context where the relationship was found
    /// </summary>
    public string? Context { get; set; }
}