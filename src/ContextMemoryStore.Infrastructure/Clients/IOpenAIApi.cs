using Refit;
using System.Text.Json.Serialization;

namespace ContextMemoryStore.Infrastructure.Clients;

/// <summary>
/// Refit interface for OpenAI-compatible API endpoints (targeting Ollama)
/// </summary>
public interface IOpenAIApi
{
    [Post("/v1/chat/completions")]
    Task<ChatCompletionResponse> CreateChatCompletionAsync([Body] ChatCompletionRequest request, CancellationToken cancellationToken = default);

    [Post("/v1/chat/completions")]
    Task<HttpResponseMessage> CreateChatCompletionStreamAsync([Body] ChatCompletionRequest request, CancellationToken cancellationToken = default);

    [Post("/v1/embeddings")]
    Task<EmbeddingResponse> CreateEmbeddingAsync([Body] EmbeddingRequest request, CancellationToken cancellationToken = default);
}

/// <summary>
/// Chat completion request model
/// </summary>
public class ChatCompletionRequest
{
    [JsonPropertyName("model")]
    public required string Model { get; set; }

    [JsonPropertyName("messages")]
    public required List<ChatMessage> Messages { get; set; }

    [JsonPropertyName("max_tokens")]
    public int? MaxTokens { get; set; }

    [JsonPropertyName("temperature")]
    public float? Temperature { get; set; }

    [JsonPropertyName("stream")]
    public bool Stream { get; set; } = false;
}

/// <summary>
/// Chat message model
/// </summary>
public class ChatMessage
{
    [JsonPropertyName("role")]
    public required string Role { get; set; }

    [JsonPropertyName("content")]
    public required string Content { get; set; }
}

/// <summary>
/// Chat completion response model
/// </summary>
public class ChatCompletionResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("object")]
    public string? Object { get; set; }

    [JsonPropertyName("created")]
    public long Created { get; set; }

    [JsonPropertyName("model")]
    public string? Model { get; set; }

    [JsonPropertyName("choices")]
    public required List<ChatChoice> Choices { get; set; }

    [JsonPropertyName("usage")]
    public Usage? Usage { get; set; }
}

/// <summary>
/// Chat completion streaming response model
/// </summary>
public class ChatCompletionStreamResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("object")]
    public string? Object { get; set; }

    [JsonPropertyName("created")]
    public long Created { get; set; }

    [JsonPropertyName("model")]
    public string? Model { get; set; }

    [JsonPropertyName("choices")]
    public required List<ChatStreamChoice> Choices { get; set; }
}

/// <summary>
/// Chat choice in completion response
/// </summary>
public class ChatChoice
{
    [JsonPropertyName("index")]
    public int Index { get; set; }

    [JsonPropertyName("message")]
    public required ChatMessage Message { get; set; }

    [JsonPropertyName("finish_reason")]
    public string? FinishReason { get; set; }
}

/// <summary>
/// Chat choice in streaming response
/// </summary>
public class ChatStreamChoice
{
    [JsonPropertyName("index")]
    public int Index { get; set; }

    [JsonPropertyName("delta")]
    public required ChatMessageDelta Delta { get; set; }

    [JsonPropertyName("finish_reason")]
    public string? FinishReason { get; set; }
}

/// <summary>
/// Chat message delta for streaming
/// </summary>
public class ChatMessageDelta
{
    [JsonPropertyName("role")]
    public string? Role { get; set; }

    [JsonPropertyName("content")]
    public string? Content { get; set; }
}

/// <summary>
/// Embedding request model
/// </summary>
public class EmbeddingRequest
{
    [JsonPropertyName("model")]
    public required string Model { get; set; }

    [JsonPropertyName("input")]
    public required object Input { get; set; } // Can be string or string[]
}

/// <summary>
/// Embedding response model
/// </summary>
public class EmbeddingResponse
{
    [JsonPropertyName("object")]
    public string? Object { get; set; }

    [JsonPropertyName("data")]
    public required List<EmbeddingData> Data { get; set; }

    [JsonPropertyName("model")]
    public string? Model { get; set; }

    [JsonPropertyName("usage")]
    public Usage? Usage { get; set; }
}

/// <summary>
/// Individual embedding data
/// </summary>
public class EmbeddingData
{
    [JsonPropertyName("object")]
    public string? Object { get; set; }

    [JsonPropertyName("index")]
    public int Index { get; set; }

    [JsonPropertyName("embedding")]
    public required float[] Embedding { get; set; }
}

/// <summary>
/// Usage statistics
/// </summary>
public class Usage
{
    [JsonPropertyName("prompt_tokens")]
    public int PromptTokens { get; set; }

    [JsonPropertyName("completion_tokens")]
    public int CompletionTokens { get; set; }

    [JsonPropertyName("total_tokens")]
    public int TotalTokens { get; set; }
}