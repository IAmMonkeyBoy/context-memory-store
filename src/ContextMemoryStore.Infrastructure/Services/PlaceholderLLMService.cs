using ContextMemoryStore.Core.Interfaces;

namespace ContextMemoryStore.Infrastructure.Services;

/// <summary>
/// Placeholder implementation of ILLMService for Phase 4 development
/// This will be replaced with actual Ollama implementation in future phases
/// </summary>
public class PlaceholderLLMService : ILLMService
{
    public Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default)
    {
        // Return placeholder embedding (768 dimensions for mxbai-embed-large)
        var embedding = new float[768];
        for (int i = 0; i < embedding.Length; i++)
        {
            embedding[i] = 0.1f; // Simple placeholder value
        }
        return Task.FromResult(embedding);
    }

    public Task<IEnumerable<float[]>> GenerateEmbeddingsAsync(IEnumerable<string> texts, CancellationToken cancellationToken = default)
    {
        var embeddings = texts.Select(_ =>
        {
            var embedding = new float[768];
            for (int i = 0; i < embedding.Length; i++)
            {
                embedding[i] = 0.1f; // Simple placeholder value
            }
            return embedding;
        });
        return Task.FromResult(embeddings);
    }

    public Task<string> GenerateChatCompletionAsync(IEnumerable<ChatMessage> messages, CancellationToken cancellationToken = default)
    {
        var lastMessage = messages.LastOrDefault()?.Content ?? "No messages";
        return Task.FromResult($"Generated response for: {lastMessage}");
    }

    public async IAsyncEnumerable<string> GenerateStreamingChatCompletionAsync(IEnumerable<ChatMessage> messages, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var lastMessage = messages.LastOrDefault()?.Content ?? "No messages";
        var response = $"Generated streaming response for: {lastMessage}";
        
        // Simulate streaming by yielding chunks
        var words = response.Split(' ');
        foreach (var word in words)
        {
            if (cancellationToken.IsCancellationRequested)
                yield break;
                
            yield return word + " ";
            await Task.Delay(10, cancellationToken); // Small delay to simulate streaming
        }
    }

    public Task<string> GenerateSummaryAsync(string text, int maxLength = 500, CancellationToken cancellationToken = default)
    {
        var summary = text.Length > maxLength 
            ? text.Substring(0, Math.Min(maxLength, text.Length)) + "..."
            : text;
        return Task.FromResult($"Summary: {summary}");
    }

    public Task<IEnumerable<RelationshipExtraction>> ExtractRelationshipsAsync(string text, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Enumerable.Empty<RelationshipExtraction>());
    }

    public Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(true);
    }

    public Task<List<string>> GetAvailableModelsAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new List<string> { "llama3", "mxbai-embed-large" });
    }
}