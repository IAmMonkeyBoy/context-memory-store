using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Core.Exceptions;
using ContextMemoryStore.Infrastructure.Configuration;
using ContextMemoryStore.Infrastructure.Clients;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Caching.Memory;
using Polly;
using Polly.CircuitBreaker;
using System.Text.Json;
using System.Runtime.CompilerServices;
using System.Net.Sockets;
using CoreChatMessage = ContextMemoryStore.Core.Interfaces.ChatMessage;

namespace ContextMemoryStore.Infrastructure.Services;

/// <summary>
/// Enhanced Ollama implementation of ILLMService using Refit HTTP client
/// Features: Streaming, retry policies, circuit breaker, connection pooling, and enhanced error handling
/// </summary>
public class OllamaLLMService : ILLMService
{
    private readonly IOpenAIApi _openAIApi;
    private readonly OllamaOptions _options;
    private readonly ILogger<OllamaLLMService> _logger;
    private readonly IMemoryCache _cache;
    private readonly ResiliencePipeline _resiliencePipeline;

    // Cache keys for model health status
    private const string ModelHealthCacheKeyPrefix = "ollama_model_health_";
    private const string AvailableModelsCacheKey = "ollama_available_models";
    private static readonly TimeSpan ModelHealthCacheDuration = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan AvailableModelsCacheDuration = TimeSpan.FromMinutes(10);

    public OllamaLLMService(
        IOpenAIApi openAIApi,
        IOptions<OllamaOptions> options,
        ILogger<OllamaLLMService> logger,
        IMemoryCache cache)
    {
        _openAIApi = openAIApi ?? throw new ArgumentNullException(nameof(openAIApi));
        _options = options.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));

        // Build resilience pipeline with retry and circuit breaker
        _resiliencePipeline = BuildResiliencePipeline();

        _logger.LogInformation("Initialized OllamaLLMService with enhanced capabilities - Streaming: {Streaming}, Retry: {Retry}, CircuitBreaker: {CircuitBreaker}",
            _options.EnableStreaming, _options.RetryAttempts > 0, _options.EnableCircuitBreaker);
    }

    /// <summary>
    /// Generates embeddings for the given text with enhanced error handling and retry logic
    /// </summary>
    public async Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(text))
            throw new ArgumentException("Text cannot be null or empty", nameof(text));

        try
        {
            _logger.LogInformation("Generating embedding for text (length: {Length})", text.Length);

            var result = await _resiliencePipeline.ExecuteAsync(async (ct) =>
            {
                var request = new EmbeddingRequest
                {
                    Model = _options.EmbeddingModel,
                    Input = text
                };
                var response = await _openAIApi.CreateEmbeddingAsync(request, ct);
                return response.Data.First().Embedding;
            }, cancellationToken);

            _logger.LogInformation("Successfully generated embedding with {Dimensions} dimensions", result.Length);
            return result;
        }
        catch (Exception ex) when (!(ex is LLMServiceException))
        {
            _logger.LogError(ex, "Error generating embedding for text (length: {Length})", text.Length);
            throw new LLMServiceException($"Error generating embedding: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Generates embeddings for multiple texts in batch with optimized performance
    /// </summary>
    public async Task<IEnumerable<float[]>> GenerateEmbeddingsAsync(IEnumerable<string> texts, CancellationToken cancellationToken = default)
    {
        var textList = texts?.ToList() ?? throw new ArgumentNullException(nameof(texts));

        if (!textList.Any())
        {
            _logger.LogDebug("No texts provided for embedding generation");
            return Enumerable.Empty<float[]>();
        }

        try
        {
            _logger.LogInformation("Generating embeddings for {Count} texts", textList.Count);

            // For large batches, process in chunks to avoid timeout issues
            const int batchSize = 50;
            var allEmbeddings = new List<float[]>();

            for (int i = 0; i < textList.Count; i += batchSize)
            {
                var batch = textList.Skip(i).Take(batchSize).ToList();
                _logger.LogDebug("Processing batch {BatchNumber} with {BatchSize} texts", (i / batchSize) + 1, batch.Count);

                var batchEmbeddings = await _resiliencePipeline.ExecuteAsync(async (ct) =>
                {
                    var request = new EmbeddingRequest
                    {
                        Model = _options.EmbeddingModel,
                        Input = batch.ToArray()
                    };
                    var response = await _openAIApi.CreateEmbeddingAsync(request, ct);
                    return response.Data.Select(e => e.Embedding).ToList();
                }, cancellationToken);

                allEmbeddings.AddRange(batchEmbeddings);
            }

            _logger.LogInformation("Successfully generated {Count} embeddings in {Batches} batches",
                allEmbeddings.Count, (textList.Count + batchSize - 1) / batchSize);

            return allEmbeddings;
        }
        catch (Exception ex) when (!(ex is LLMServiceException))
        {
            _logger.LogError(ex, "Error generating embeddings for {Count} texts", textList.Count);
            throw new LLMServiceException($"Error generating embeddings: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Generates a chat completion using the LLM with enhanced error handling
    /// </summary>
    public async Task<string> GenerateChatCompletionAsync(IEnumerable<CoreChatMessage> messages, CancellationToken cancellationToken = default)
    {
        var messageList = messages?.ToList() ?? throw new ArgumentNullException(nameof(messages));

        if (!messageList.Any())
            throw new ArgumentException("Messages cannot be empty", nameof(messages));

        try
        {
            _logger.LogInformation("Generating chat completion for {Count} messages", messageList.Count);

            var result = await _resiliencePipeline.ExecuteAsync(async (ct) =>
            {
                var chatMessages = messageList.Select(m => new Clients.ChatMessage
                {
                    Role = m.Role.ToLowerInvariant(),
                    Content = m.Content
                }).ToList();

                var request = new ChatCompletionRequest
                {
                    Model = _options.ChatModel,
                    Messages = chatMessages,
                    MaxTokens = _options.MaxTokens,
                    Temperature = (float)_options.Temperature
                };

                var response = await _openAIApi.CreateChatCompletionAsync(request, ct);
                return response.Choices.FirstOrDefault()?.Message.Content ?? string.Empty;
            }, cancellationToken);

            _logger.LogInformation("Successfully generated chat completion (length: {Length})", result.Length);
            return result;
        }
        catch (Exception ex) when (!(ex is LLMServiceException))
        {
            _logger.LogError(ex, "Error generating chat completion for {Count} messages", messageList.Count);
            throw new LLMServiceException($"Error generating chat completion: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Generates a streaming chat completion using the LLM
    /// </summary>
    public async IAsyncEnumerable<string> GenerateStreamingChatCompletionAsync(
        IEnumerable<CoreChatMessage> messages,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var messageList = messages?.ToList() ?? throw new ArgumentNullException(nameof(messages));

        if (!messageList.Any())
            throw new ArgumentException("Messages cannot be empty", nameof(messages));

        if (!_options.EnableStreaming)
        {
            // Fallback to non-streaming if streaming is disabled
            var result = await GenerateChatCompletionAsync(messages, cancellationToken);
            yield return result;
            yield break;
        }

        _logger.LogInformation("Generating streaming chat completion for {Count} messages", messageList.Count);

        using var activity = _logger.BeginScope("StreamingChatCompletion");

        await foreach (var chunk in GenerateStreamingChatCompletionInternalAsync(messageList, cancellationToken))
        {
            yield return chunk;
        }
    }

    private async IAsyncEnumerable<string> GenerateStreamingChatCompletionInternalAsync(
        List<CoreChatMessage> messageList,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var chatMessages = messageList.Select(m => new Clients.ChatMessage
        {
            Role = m.Role.ToLowerInvariant(),
            Content = m.Content
        }).ToList();

        var request = new ChatCompletionRequest
        {
            Model = _options.ChatModel,
            Messages = chatMessages,
            MaxTokens = _options.MaxTokens,
            Temperature = (float)_options.Temperature,
            Stream = true
        };

        HttpResponseMessage httpResponse;
        
        try
        {
            httpResponse = await _openAIApi.CreateChatCompletionStreamAsync(request, cancellationToken);
        }
        catch (Exception ex) when (!(ex is LLMServiceException))
        {
            _logger.LogError(ex, "Error starting streaming chat completion");
            throw new LLMServiceException($"Error in streaming chat completion: {ex.Message}", ex);
        }

        if (!httpResponse.IsSuccessStatusCode)
        {
            var errorContent = await httpResponse.Content.ReadAsStringAsync(cancellationToken);
            httpResponse.Dispose();
            throw new LLMServiceException($"HTTP error {httpResponse.StatusCode}: {errorContent}");
        }

        var stream = await httpResponse.Content.ReadAsStreamAsync(cancellationToken);
        var reader = new StreamReader(stream);
        
        while (!reader.EndOfStream)
        {
            string? line;
            try
            {
                line = await reader.ReadLineAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while reading a line from the response stream.");
                reader?.Dispose();
                httpResponse?.Dispose();
                throw;
            }
            
            if (string.IsNullOrWhiteSpace(line) || !line.StartsWith("data: ")) continue;
            
            var jsonData = line.Substring(6); // Remove "data: " prefix
            if (jsonData == "[DONE]") break;
            
            ChatCompletionStreamResponse? response;
            try
            {
                response = JsonSerializer.Deserialize<ChatCompletionStreamResponse>(jsonData);
            }
            catch (JsonException)
            {
                // Skip malformed JSON chunks
                continue;
            }
            
            var choice = response?.Choices?.FirstOrDefault();
            if (choice?.Delta.Content != null)
            {
                yield return choice.Delta.Content;
            }
        }
        
        reader?.Dispose();
        httpResponse?.Dispose();

        _logger.LogInformation("Successfully completed streaming chat completion");
    }

    /// <summary>
    /// Generates a summary of the given text with enhanced retry logic
    /// </summary>
    public async Task<string> GenerateSummaryAsync(string text, int maxLength = 500, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(text))
            throw new ArgumentException("Text cannot be null or empty", nameof(text));

        if (maxLength <= 0)
            throw new ArgumentException("Max length must be positive", nameof(maxLength));

        try
        {
            _logger.LogInformation("Generating summary for text (length: {Length}, maxLength: {MaxLength})", text.Length, maxLength);

            var messages = new List<CoreChatMessage>
            {
                new() {
                    Role = "system",
                    Content = $"You are a helpful assistant that creates concise summaries. Create a summary of the following text in no more than {maxLength} characters. Focus on the key points and main ideas."
                },
                new() { Role = "user", Content = text }
            };

            var summary = await GenerateChatCompletionAsync(messages, cancellationToken);

            // Truncate if necessary
            if (summary.Length > maxLength)
            {
                summary = summary[..(maxLength - 3)] + "...";
                _logger.LogDebug("Summary truncated from {OriginalLength} to {FinalLength} characters", summary.Length + 3, summary.Length);
            }

            _logger.LogInformation("Successfully generated summary (length: {Length})", summary.Length);
            return summary;
        }
        catch (Exception ex) when (!(ex is LLMServiceException))
        {
            _logger.LogError(ex, "Error generating summary for text (length: {Length})", text.Length);
            throw new LLMServiceException($"Error generating summary: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Extracts relationships from the given text with enhanced parsing and error handling
    /// </summary>
    public async Task<IEnumerable<RelationshipExtraction>> ExtractRelationshipsAsync(string text, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(text))
            throw new ArgumentException("Text cannot be null or empty", nameof(text));

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

Only extract clear, explicit relationships. Be conservative with confidence scores.
Return only valid JSON without any additional text or explanations.";

            var messages = new List<CoreChatMessage>
            {
                new() { Role = "system", Content = systemPrompt },
                new() { Role = "user", Content = text }
            };

            var response = await GenerateChatCompletionAsync(messages, cancellationToken);

            var relationships = ParseRelationshipExtractionResponse(response);

            _logger.LogInformation("Successfully extracted {Count} relationships", relationships.Count());
            return relationships;
        }
        catch (Exception ex) when (!(ex is LLMServiceException))
        {
            _logger.LogError(ex, "Error extracting relationships from text (length: {Length})", text.Length);
            throw new LLMServiceException($"Error extracting relationships: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Checks if the LLM service is healthy with enhanced model verification
    /// </summary>
    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Checking Ollama health with model verification");

            // Check cache first
            var cacheKey = $"{ModelHealthCacheKeyPrefix}overall";
            if (_cache.TryGetValue(cacheKey, out bool cachedHealth))
            {
                _logger.LogDebug("Returning cached health status: {IsHealthy}", cachedHealth);
                return cachedHealth;
            }

            // Verify both chat and embedding models are available and working
            var chatHealthy = await IsModelHealthyAsync(_options.ChatModel, cancellationToken);
            var embeddingHealthy = await IsModelHealthyAsync(_options.EmbeddingModel, cancellationToken);

            var isHealthy = chatHealthy && embeddingHealthy;

            // Cache the result
            _cache.Set(cacheKey, isHealthy, ModelHealthCacheDuration);

            _logger.LogDebug("Ollama health check result: {IsHealthy} (Chat: {ChatHealthy}, Embedding: {EmbeddingHealthy})",
                isHealthy, chatHealthy, embeddingHealthy);

            return isHealthy;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Ollama health check failed");
            return false;
        }
    }

    /// <summary>
    /// Gets available models from the LLM service with enhanced model discovery
    /// </summary>
    public async Task<List<string>> GetAvailableModelsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting available models");

            // Check cache first
            if (_cache.TryGetValue(AvailableModelsCacheKey, out List<string>? cachedModels) && cachedModels != null)
            {
                _logger.LogDebug("Returning cached model list with {Count} models", cachedModels.Count);
                return cachedModels;
            }

            var result = await _resiliencePipeline.ExecuteAsync(async (ct) =>
            {
                // For now, return configured models since OpenAI client may not support direct model listing
                // In a future enhancement, we could directly query Ollama's /api/tags endpoint
                var modelNames = new List<string>
                {
                    _options.ChatModel,
                    _options.EmbeddingModel
                };

                // Verify models are actually working
                var workingModels = new List<string>();
                foreach (var model in modelNames.Distinct())
                {
                    if (await IsModelHealthyAsync(model, ct))
                    {
                        workingModels.Add(model);
                    }
                }

                return workingModels;
            }, cancellationToken);

            // Cache the result
            _cache.Set(AvailableModelsCacheKey, result, AvailableModelsCacheDuration);

            _logger.LogDebug("Found {Count} available and working models", result.Count);
            return result;
        }
        catch (Exception ex) when (!(ex is LLMServiceException))
        {
            _logger.LogError(ex, "Error getting available models");
            throw new LLMServiceException($"Error getting available models: {ex.Message}", ex);
        }
    }

    private async Task<bool> IsModelHealthyAsync(string modelName, CancellationToken cancellationToken)
    {
        var cacheKey = $"{ModelHealthCacheKeyPrefix}{modelName}";
        if (_cache.TryGetValue(cacheKey, out bool cachedHealth))
        {
            return cachedHealth;
        }

        try
        {
            // Test the model with a simple request
            if (modelName == _options.ChatModel)
            {
                var request = new ChatCompletionRequest
                {
                    Model = modelName,
                    Messages = new List<Clients.ChatMessage> { new() { Role = "user", Content = "Hello" } },
                    MaxTokens = 10
                };

                var response = await _openAIApi.CreateChatCompletionAsync(request, cancellationToken);
                var isHealthy = !string.IsNullOrEmpty(response.Choices.FirstOrDefault()?.Message.Content);

                _cache.Set(cacheKey, isHealthy, ModelHealthCacheDuration);
                return isHealthy;
            }
            else if (modelName == _options.EmbeddingModel)
            {
                var request = new EmbeddingRequest
                {
                    Model = modelName,
                    Input = "test"
                };
                var response = await _openAIApi.CreateEmbeddingAsync(request, cancellationToken);
                var isHealthy = response.Data.FirstOrDefault()?.Embedding.Length > 0;

                _cache.Set(cacheKey, isHealthy, ModelHealthCacheDuration);
                return isHealthy;
            }

            return false;
        }
        catch
        {
            _cache.Set(cacheKey, false, ModelHealthCacheDuration);
            return false;
        }
    }

    private List<RelationshipExtraction> ParseRelationshipExtractionResponse(string response)
    {
        var relationships = new List<RelationshipExtraction>();

        try
        {
            // Clean up the response - sometimes models add extra text
            var jsonStart = response.IndexOf('[');
            var jsonEnd = response.LastIndexOf(']');

            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                var jsonContent = response.Substring(jsonStart, jsonEnd - jsonStart + 1);
                var jsonDocument = JsonDocument.Parse(jsonContent);

                if (jsonDocument.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var element in jsonDocument.RootElement.EnumerateArray())
                    {
                        if (TryParseRelationshipElement(element, out var relationship))
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

        return relationships;
    }

    private static bool TryParseRelationshipElement(JsonElement element, out RelationshipExtraction relationship)
    {
        relationship = new RelationshipExtraction
        {
            Source = "",
            Target = "",
            Type = ""
        };

        try
        {
            if (element.TryGetProperty("source", out var sourceElement) &&
                element.TryGetProperty("target", out var targetElement) &&
                element.TryGetProperty("type", out var typeElement))
            {
                var source = sourceElement.GetString();
                var target = targetElement.GetString();
                var type = typeElement.GetString();

                if (!string.IsNullOrWhiteSpace(source) &&
                    !string.IsNullOrWhiteSpace(target) &&
                    !string.IsNullOrWhiteSpace(type))
                {
                    relationship.Source = source;
                    relationship.Target = target;
                    relationship.Type = type;
                    relationship.Confidence = element.TryGetProperty("confidence", out var confidenceElement)
                        ? confidenceElement.GetDouble()
                        : 0.5;
                    relationship.Context = element.TryGetProperty("context", out var contextElement)
                        ? contextElement.GetString()
                        : null;

                    return true;
                }
            }
        }
        catch
        {
            // Ignore parsing errors for individual elements
        }

        return false;
    }

    private ResiliencePipeline BuildResiliencePipeline()
    {
        var pipelineBuilder = new ResiliencePipelineBuilder();

        // Add retry policy
        if (_options.RetryAttempts > 0)
        {
            pipelineBuilder.AddRetry(new Polly.Retry.RetryStrategyOptions
            {
                ShouldHandle = new PredicateBuilder().Handle<HttpRequestException>()
                    .Handle<TaskCanceledException>()
                    .Handle<SocketException>(),
                MaxRetryAttempts = _options.RetryAttempts,
                Delay = TimeSpan.FromMilliseconds(_options.RetryDelayMs),
                MaxDelay = TimeSpan.FromMilliseconds(_options.MaxRetryDelayMs),
                BackoffType = Polly.DelayBackoffType.Exponential,
                OnRetry = args =>
                {
                    _logger.LogWarning("Retrying Ollama request (attempt {Attempt}/{MaxAttempts}): {Exception}",
                        args.AttemptNumber, _options.RetryAttempts, args.Outcome.Exception?.Message);
                    return ValueTask.CompletedTask;
                }
            });
        }

        // Add circuit breaker
        if (_options.EnableCircuitBreaker)
        {
            pipelineBuilder.AddCircuitBreaker(new CircuitBreakerStrategyOptions
            {
                ShouldHandle = new PredicateBuilder().Handle<HttpRequestException>()
                    .Handle<TaskCanceledException>()
                    .Handle<LLMServiceException>(),
                FailureRatio = 0.8,
                MinimumThroughput = _options.CircuitBreakerFailureThreshold,
                BreakDuration = TimeSpan.FromSeconds(_options.CircuitBreakerOpenDurationSeconds),
                OnOpened = args =>
                {
                    _logger.LogWarning("Circuit breaker opened for Ollama service");
                    return ValueTask.CompletedTask;
                },
                OnClosed = args =>
                {
                    _logger.LogInformation("Circuit breaker closed for Ollama service");
                    return ValueTask.CompletedTask;
                }
            });
        }

        // Add timeout
        pipelineBuilder.AddTimeout(TimeSpan.FromSeconds(_options.TimeoutSeconds));

        return pipelineBuilder.Build();
    }
}