using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Infrastructure.Services;
using ContextMemoryStore.Infrastructure.Configuration;
using Prometheus;
using Neo4j.Driver;
using Qdrant.Client;
using OpenAI;

namespace ContextMemoryStore.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure options from appsettings.json
        services.Configure<QdrantOptions>(configuration.GetSection(QdrantOptions.SectionName));
        services.Configure<Neo4jOptions>(configuration.GetSection(Neo4jOptions.SectionName));
        services.Configure<OllamaOptions>(configuration.GetSection(OllamaOptions.SectionName));
        services.Configure<PrometheusOptions>(configuration.GetSection(PrometheusOptions.SectionName));

        // Register external service clients
        AddQdrantClient(services, configuration);
        AddNeo4jDriver(services, configuration);
        AddOpenAIClient(services, configuration);
        AddPrometheusMetrics(services, configuration);

        // Register application services
        // For Phase 4 Step 5, we continue using placeholder implementations
        // but now with proper NuGet packages and configuration ready
        services.AddScoped<IMemoryService, PlaceholderMemoryService>();
        services.AddScoped<IVectorStoreService, PlaceholderVectorStoreService>();
        services.AddScoped<IGraphStoreService, PlaceholderGraphStoreService>();
        services.AddScoped<ILLMService, PlaceholderLLMService>();
        
        // TODO: Replace placeholder implementations in Phase 5:
        // - QdrantVectorStoreService for IVectorStoreService
        // - Neo4jGraphStoreService for IGraphStoreService  
        // - OllamaLLMService for ILLMService
        // - Complete MemoryService implementation
        // - IDocumentRepository implementation
        
        return services;
    }

    private static void AddQdrantClient(IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<QdrantClient>(provider =>
        {
            var options = provider.GetRequiredService<IOptions<QdrantOptions>>().Value;
            var host = options.Host;
            var port = options.Port;
            var https = options.UseHttps;
            
            return new QdrantClient(host, port, https, options.ApiKey);
        });
    }

    private static void AddNeo4jDriver(IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IDriver>(provider =>
        {
            var options = provider.GetRequiredService<IOptions<Neo4jOptions>>().Value;
            
            // Use default configuration for now - specific config will be added in Phase 5
            return GraphDatabase.Driver(options.Uri, AuthTokens.Basic(options.Username, options.Password));
        });
    }

    private static void AddOpenAIClient(IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<OpenAIClient>(provider =>
        {
            var options = provider.GetRequiredService<IOptions<OllamaOptions>>().Value;
            var clientOptions = new OpenAIClientOptions()
            {
                Endpoint = new Uri(options.BaseUrl)
            };
            
            // For Ollama, we typically don't need an API key, but the API requires one
            var apiKey = options.ApiKey ?? "not-required-for-ollama";
            return new OpenAIClient(new System.ClientModel.ApiKeyCredential(apiKey), clientOptions);
        });
    }

    private static void AddPrometheusMetrics(IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<MetricServer>(provider =>
        {
            var options = provider.GetRequiredService<IOptions<PrometheusOptions>>().Value;
            
            if (!options.Enabled)
                return null!;

            // Create custom metrics for the application
            var registry = Metrics.NewCustomRegistry();
            
            // Document count metric
            var documentCount = Metrics.WithCustomRegistry(registry)
                .CreateGauge($"{options.MetricPrefix}_documents_total", "Total number of documents in memory");
            
            // Vector count metric  
            var vectorCount = Metrics.WithCustomRegistry(registry)
                .CreateGauge($"{options.MetricPrefix}_vectors_total", "Total number of vectors stored");
            
            // Request duration metric
            var requestDuration = Metrics.WithCustomRegistry(registry)
                .CreateHistogram($"{options.MetricPrefix}_request_duration_seconds", "Request duration in seconds");

            return new MetricServer(port: 9090, registry: registry);
        });
    }
}