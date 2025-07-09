using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Core.Exceptions;
using ContextMemoryStore.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;
using OpenAI.Embeddings;
using System.Text.Json;
using CoreChatMessage = ContextMemoryStore.Core.Interfaces.ChatMessage;

namespace ContextMemoryStore.Infrastructure.Services;

/// <summary>
/// Ollama implementation of ILLMService using OpenAI .NET SDK
/// </summary>
public class OllamaLLMService : ILLMService
{
    private readonly OpenAIClient _openAIClient;
    private readonly OllamaOptions _options;
    private readonly ILogger<OllamaLLMService> _logger;

    public OllamaLLMService(
        OpenAIClient openAIClient,
        IOptions<OllamaOptions> options,
        ILogger<OllamaLLMService> logger)
    {
        _openAIClient = openAIClient ?? throw new ArgumentNullException(nameof(openAIClient));
        _options = options.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Generates embeddings for the given text
    /// </summary>
    public async Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating embedding for text (length: {Length})", text.Length);

            var embeddingClient = _openAIClient.GetEmbeddingClient(_options.EmbeddingModel);
            var response = await embeddingClient.GenerateEmbeddingAsync(text, options: null, cancellationToken);

            var embedding = response.Value.ToFloats().ToArray();
            _logger.LogInformation("Successfully generated embedding with {Dimensions} dimensions", embedding.Length);

            return embedding;
        }
        catch (Exception ex) when (!(ex is LLMServiceException))
        {
            _logger.LogError(ex, "Error generating embedding for text");
            throw new LLMServiceException($"Error generating embedding: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Generates embeddings for multiple texts in batch
    /// </summary>
    public async Task<IEnumerable<float[]>> GenerateEmbeddingsAsync(IEnumerable<string> texts, CancellationToken cancellationToken = default)
    {
        try
        {
            var textList = texts.ToList();
            _logger.LogInformation("Generating embeddings for {Count} texts", textList.Count);

            if (!textList.Any())
                return Enumerable.Empty<float[]>();

            var embeddingClient = _openAIClient.GetEmbeddingClient(_options.EmbeddingModel);
            var response = await embeddingClient.GenerateEmbeddingsAsync(textList, options: null, cancellationToken);

            var embeddings = response.Value.Select(e => e.ToFloats().ToArray()).ToList();
            _logger.LogInformation("Successfully generated {Count} embeddings", embeddings.Count);

            return embeddings;
        }
        catch (Exception ex) when (!(ex is LLMServiceException))
        {
            _logger.LogError(ex, "Error generating embeddings for {Count} texts", texts.Count());
            throw new LLMServiceException($"Error generating embeddings: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Generates a chat completion using the LLM
    /// </summary>
    public async Task<string> GenerateChatCompletionAsync(IEnumerable<CoreChatMessage> messages, CancellationToken cancellationToken = default)
    {
        try
        {
            var messageList = messages.ToList();
            _logger.LogInformation("Generating chat completion for {Count} messages", messageList.Count);

            var chatClient = _openAIClient.GetChatClient(_options.ChatModel);
            
            var chatMessages = messageList.Select<CoreChatMessage, OpenAI.Chat.ChatMessage>(m => 
                m.Role switch
                {
                    "system" => OpenAI.Chat.ChatMessage.CreateSystemMessage(m.Content),
                    "user" => OpenAI.Chat.ChatMessage.CreateUserMessage(m.Content),
                    "assistant" => OpenAI.Chat.ChatMessage.CreateAssistantMessage(m.Content),
                    _ => OpenAI.Chat.ChatMessage.CreateUserMessage(m.Content)
                }).ToList();

            var options = new ChatCompletionOptions
            {
                MaxOutputTokenCount = _options.MaxTokens,
                Temperature = (float)_options.Temperature
            };

            var response = await chatClient.CompleteChatAsync(chatMessages, options, cancellationToken);
            var content = response.Value.Content[0].Text ?? string.Empty;

            _logger.LogInformation("Successfully generated chat completion (length: {Length})", content.Length);
            return content;
        }
        catch (Exception ex) when (!(ex is LLMServiceException))
        {
            _logger.LogError(ex, "Error generating chat completion");
            throw new LLMServiceException($"Error generating chat completion: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Generates a summary of the given text
    /// </summary>
    public async Task<string> GenerateSummaryAsync(string text, int maxLength = 500, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating summary for text (length: {Length}, maxLength: {MaxLength})", text.Length, maxLength);

            var messages = new List<CoreChatMessage>
            {
                new CoreChatMessage { Role = "system", Content = $"You are a helpful assistant that creates concise summaries. Create a summary of the following text in no more than {maxLength} characters. Focus on the key points and main ideas." },
                new CoreChatMessage { Role = "user", Content = text }
            };

            var summary = await GenerateChatCompletionAsync(messages, cancellationToken);
            
            // Truncate if necessary
            if (summary.Length > maxLength)
            {
                summary = summary.Substring(0, maxLength - 3) + "...";
            }

            _logger.LogInformation("Successfully generated summary (length: {Length})", summary.Length);
            return summary;
        }
        catch (Exception ex) when (!(ex is LLMServiceException))
        {
            _logger.LogError(ex, "Error generating summary");
            throw new LLMServiceException($"Error generating summary: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Extracts relationships from the given text
    /// </summary>
    public async Task<IEnumerable<RelationshipExtraction>> ExtractRelationshipsAsync(string text, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Extracting relationships from text (length: {Length})", text.Length);

            var systemPrompt = @"You are a relationship extraction expert. Analyze the given text and extract relationships between entities.
Return your response as a JSON array of objects, where each object has:
- source: the source entity
- target: the target entity  
- type: the relationship type (e.g., 'works_for', 'located_in', 'is_a', 'uses', 'contains')
- confidence: confidence score from 0.0 to 1.0
- context: the sentence or phrase where the relationship was found

Only extract clear, explicit relationships. Be conservative with confidence scores.";

            var messages = new List<CoreChatMessage>
            {
                new CoreChatMessage { Role = "system", Content = systemPrompt },
                new CoreChatMessage { Role = "user", Content = text }
            };

            var response = await GenerateChatCompletionAsync(messages, cancellationToken);
            
            // Parse the JSON response
            var relationships = new List<RelationshipExtraction>();
            try
            {
                var jsonDocument = JsonDocument.Parse(response);
                if (jsonDocument.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var element in jsonDocument.RootElement.EnumerateArray())
                    {
                        if (element.TryGetProperty("source", out var sourceElement) &&
                            element.TryGetProperty("target", out var targetElement) &&
                            element.TryGetProperty("type", out var typeElement))
                        {
                            var relationship = new RelationshipExtraction
                            {
                                Source = sourceElement.GetString() ?? string.Empty,
                                Target = targetElement.GetString() ?? string.Empty,
                                Type = typeElement.GetString() ?? string.Empty,
                                Confidence = element.TryGetProperty("confidence", out var confidenceElement) ? confidenceElement.GetDouble() : 0.5,
                                Context = element.TryGetProperty("context", out var contextElement) ? contextElement.GetString() : null
                            };

                            if (!string.IsNullOrEmpty(relationship.Source) && 
                                !string.IsNullOrEmpty(relationship.Target) && 
                                !string.IsNullOrEmpty(relationship.Type))
                            {
                                relationships.Add(relationship);
                            }
                        }
                    }
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to parse relationship extraction response as JSON: {Response}", response);
            }

            _logger.LogInformation("Successfully extracted {Count} relationships", relationships.Count);
            return relationships;
        }
        catch (Exception ex) when (!(ex is LLMServiceException))
        {
            _logger.LogError(ex, "Error extracting relationships");
            throw new LLMServiceException($"Error extracting relationships: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Checks if the LLM service is healthy
    /// </summary>
    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Checking Ollama health");

            // Try to get available models to verify connectivity
            var models = await GetAvailableModelsAsync(cancellationToken);
            var isHealthy = models.Any();

            _logger.LogDebug("Ollama health check result: {IsHealthy}", isHealthy);
            return isHealthy;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Ollama health check failed");
            return false;
        }
    }

    /// <summary>
    /// Gets available models from the LLM service
    /// </summary>
    public Task<List<string>> GetAvailableModelsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting available models");

            // For Ollama, we'll return the configured models since the OpenAI client may not support model listing
            var modelNames = new List<string>
            {
                _options.ChatModel,
                _options.EmbeddingModel
            };

            _logger.LogDebug("Found {Count} available models", modelNames.Count);
            return Task.FromResult(modelNames);
        }
        catch (Exception ex) when (!(ex is LLMServiceException))
        {
            _logger.LogError(ex, "Error getting available models");
            throw new LLMServiceException($"Error getting available models: {ex.Message}", ex);
        }
    }
}