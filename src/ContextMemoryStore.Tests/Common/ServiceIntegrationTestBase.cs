using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Testcontainers.Qdrant;
using Testcontainers.Neo4j;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
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
            _qdrantContainer = new QdrantBuilder()
                .WithImage("qdrant/qdrant:v1.11.5")
                .WithPortBinding(6333, 6333)
                .Build();
            
            await _qdrantContainer.StartAsync();
        }

        if (RequiresNeo4j())
        {
            // Note: For now, we'll use default Neo4j settings to avoid API issues
            // In real implementation, we'd configure with proper credentials
            _neo4jContainer = new Neo4jBuilder()
                .WithImage("neo4j:5.24-community")
                .WithEnvironment("NEO4J_AUTH", "neo4j/contextmemory")
                .WithEnvironment("NEO4J_PLUGINS", "[\"apoc\"]")
                .WithPortBinding(7474, 7474)
                .WithPortBinding(7687, 7687)
                .Build();
            
            await _neo4jContainer.StartAsync();
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
            await _qdrantContainer.StopAsync();
            await _qdrantContainer.DisposeAsync();
        }
        
        if (_neo4jContainer != null)
        {
            await _neo4jContainer.StopAsync();
            await _neo4jContainer.DisposeAsync();
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
}