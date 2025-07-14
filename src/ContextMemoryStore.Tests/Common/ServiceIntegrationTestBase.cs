using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Testcontainers.Qdrant;
using Testcontainers.Neo4j;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using DotNet.Testcontainers.Configurations;
using System.Net.Http;
using Xunit;

namespace ContextMemoryStore.Tests.Common;

/// <summary>
/// Base class for integration tests that require real external services.
/// Manages container lifecycle and provides configured services.
/// </summary>
public abstract class ServiceIntegrationTestBase : IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private QdrantContainer? _qdrantContainer;
    private Neo4jContainer? _neo4jContainer;
    
    protected HttpClient HttpClient { get; private set; } = null!;
    protected IServiceProvider Services { get; private set; } = null!;
    protected ILogger<ServiceIntegrationTestBase> Logger { get; private set; } = null!;

    protected ServiceIntegrationTestBase()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                builder.ConfigureAppConfiguration((context, config) =>
                {
                    config.AddJsonFile("appsettings.Testing.json", optional: false);
                    config.AddInMemoryCollection(GetTestConfiguration());
                });
                builder.ConfigureServices(ConfigureTestServices);
            });
    }

    public virtual async Task InitializeAsync()
    {
        // Start containers if required by test
        if (RequiresQdrant())
        {
            _qdrantContainer = await StartQdrantContainerWithRetryAsync();
        }

        if (RequiresNeo4j())
        {
            _neo4jContainer = await StartNeo4jContainerWithRetryAsync();
        }

        // Create HTTP client and services
        HttpClient = _factory.CreateClient();
        Services = _factory.Services;
        Logger = Services.GetRequiredService<ILogger<ServiceIntegrationTestBase>>();
    }

    public virtual async Task DisposeAsync()
    {
        HttpClient?.Dispose();
        
        if (_qdrantContainer != null)
        {
            try
            {
                await _qdrantContainer.StopAsync();
                await _qdrantContainer.DisposeAsync();
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the test cleanup
                Logger?.LogWarning(ex, "Failed to properly dispose Qdrant container");
            }
        }
        
        if (_neo4jContainer != null)
        {
            try
            {
                await _neo4jContainer.StopAsync();
                await _neo4jContainer.DisposeAsync();
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the test cleanup
                Logger?.LogWarning(ex, "Failed to properly dispose Neo4j container");
            }
        }
        
        await _factory.DisposeAsync();
    }

    /// <summary>
    /// Override to indicate if this test requires a real Qdrant container.
    /// </summary>
    protected virtual bool RequiresQdrant() => false;

    /// <summary>
    /// Override to indicate if this test requires a real Neo4j container.
    /// </summary>
    protected virtual bool RequiresNeo4j() => false;

    /// <summary>
    /// Override to indicate if this test requires a real Ollama service.
    /// Note: Ollama containers are not started automatically - use external Ollama for tests.
    /// </summary>
    protected virtual bool RequiresOllama() => false;

    /// <summary>
    /// Override to provide additional test configuration.
    /// </summary>
    protected virtual Dictionary<string, string?> GetTestConfiguration()
    {
        var config = new Dictionary<string, string?>();

        // Configure container connection strings if containers are running
        if (_qdrantContainer != null)
        {
            config["ApiOptions:VectorStore:Endpoint"] = $"http://localhost:{_qdrantContainer.GetMappedPublicPort(6333)}";
        }

        if (_neo4jContainer != null)
        {
            config["ApiOptions:GraphStore:ConnectionString"] = $"bolt://localhost:{_neo4jContainer.GetMappedPublicPort(7687)}";
            config["ApiOptions:GraphStore:Username"] = "neo4j";
            config["ApiOptions:GraphStore:Password"] = "contextmemory";
        }

        if (RequiresOllama())
        {
            // Assume external Ollama running on default port
            config["ApiOptions:LlmService:BaseUrl"] = "http://localhost:11434/v1";
        }

        return config;
    }

    /// <summary>
    /// Override to configure additional test services.
    /// </summary>
    protected virtual void ConfigureTestServices(IServiceCollection services)
    {
        // Default implementation - override in derived classes for custom service configuration
    }

    /// <summary>
    /// Helper method to wait for a service to be ready.
    /// </summary>
    protected async Task WaitForServiceReadiness(string healthEndpoint, TimeSpan? timeout = null)
    {
        timeout ??= TimeSpan.FromSeconds(30);
        var deadline = DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < deadline)
        {
            try
            {
                var response = await HttpClient.GetAsync(healthEndpoint);
                if (response.IsSuccessStatusCode)
                {
                    return;
                }
            }
            catch
            {
                // Service not ready yet
            }

            await Task.Delay(TimeSpan.FromSeconds(1));
        }

        throw new TimeoutException($"Service at {healthEndpoint} did not become ready within {timeout}");
    }

    /// <summary>
    /// Starts a Qdrant container with retry logic to handle port conflicts.
    /// </summary>
    private async Task<QdrantContainer> StartQdrantContainerWithRetryAsync()
    {
        const int maxRetries = 3;
        const int retryDelaySeconds = 2;
        
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                var container = new QdrantBuilder()
                    .WithImage("qdrant/qdrant:v1.11.5")
                    .WithPortBinding(0, 6333)  // Dynamic port allocation - Docker assigns random host port
                    .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(6333))
                    .Build();
                
                await container.StartAsync();
                return container;
            }
            catch (Exception ex) when (attempt < maxRetries && IsPortConflictException(ex))
            {
                // Log the retry attempt
                Console.WriteLine($"Qdrant container start attempt {attempt} failed with port conflict. Retrying in {retryDelaySeconds}s...");
                await Task.Delay(TimeSpan.FromSeconds(retryDelaySeconds));
            }
        }
        
        throw new InvalidOperationException($"Failed to start Qdrant container after {maxRetries} attempts");
    }

    /// <summary>
    /// Starts a Neo4j container with retry logic to handle port conflicts.
    /// </summary>
    private async Task<Neo4jContainer> StartNeo4jContainerWithRetryAsync()
    {
        const int maxRetries = 3;
        const int retryDelaySeconds = 2;
        
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                var container = new Neo4jBuilder()
                    .WithImage("neo4j:5.24-community")
                    .WithEnvironment("NEO4J_AUTH", "neo4j/contextmemory")
                    .WithEnvironment("NEO4J_PLUGINS", "[\"apoc\"]")
                    .WithPortBinding(0, 7474)  // Dynamic port allocation - Docker assigns random host port
                    .WithPortBinding(0, 7687)  // Dynamic port allocation - Docker assigns random host port
                    .WithWaitStrategy(Wait.ForUnixContainer().UntilPortIsAvailable(7474))
                    .Build();
                
                await container.StartAsync();
                return container;
            }
            catch (Exception ex) when (attempt < maxRetries && IsPortConflictException(ex))
            {
                // Log the retry attempt
                Console.WriteLine($"Neo4j container start attempt {attempt} failed with port conflict. Retrying in {retryDelaySeconds}s...");
                await Task.Delay(TimeSpan.FromSeconds(retryDelaySeconds));
            }
        }
        
        throw new InvalidOperationException($"Failed to start Neo4j container after {maxRetries} attempts");
    }

    /// <summary>
    /// Checks if an exception is related to port conflicts.
    /// </summary>
    private static bool IsPortConflictException(Exception ex)
    {
        var message = ex.Message.ToLowerInvariant();
        return message.Contains("port is already allocated") ||
               message.Contains("bind failed") ||
               message.Contains("address already in use") ||
               message.Contains("port already in use");
    }
}