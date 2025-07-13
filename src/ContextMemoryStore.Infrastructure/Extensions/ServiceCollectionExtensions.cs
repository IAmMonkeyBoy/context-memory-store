using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Infrastructure.Services;
using ContextMemoryStore.Infrastructure.Configuration;
using ContextMemoryStore.Infrastructure.Clients;
using Prometheus;
using Neo4j.Driver;
using Qdrant.Client;
using Refit;

namespace ContextMemoryStore.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure options from appsettings.json
        services.Configure<ProjectOptions>(configuration.GetSection(ProjectOptions.SectionName));
        services.Configure<ApiOptions>(configuration.GetSection(ApiOptions.SectionName));
        services.Configure<QdrantOptions>(configuration.GetSection(QdrantOptions.SectionName));
        services.Configure<Neo4jOptions>(configuration.GetSection(Neo4jOptions.SectionName));
        services.Configure<OllamaOptions>(configuration.GetSection(OllamaOptions.SectionName));
        services.Configure<MemoryOptions>(configuration.GetSection(MemoryOptions.SectionName));
        services.Configure<ProcessingOptions>(configuration.GetSection(ProcessingOptions.SectionName));
        services.Configure<PrometheusOptions>(configuration.GetSection(PrometheusOptions.SectionName));
        services.Configure<PerformanceOptions>(configuration.GetSection(PerformanceOptions.SectionName));
        services.Configure<FeaturesOptions>(configuration.GetSection(FeaturesOptions.SectionName));

        // Register external service clients
        AddQdrantClient(services, configuration);
        AddNeo4jDriver(services, configuration);
        AddRefitClient(services, configuration);
        AddPrometheusMetrics(services, configuration);

        // Register application services - Phase 5 real implementations
        services.AddScoped<IMemoryService, MemoryService>();
        services.AddScoped<IVectorStoreService, QdrantVectorStoreService>();
        services.AddScoped<IGraphStoreService, Neo4jGraphStoreService>();
        services.AddScoped<ILLMService, OllamaLLMService>();
        services.AddScoped<IDocumentRepository, InMemoryDocumentRepository>();
        services.AddScoped<ILifecycleService, LifecycleService>();
        
        // Register Phase 5 Step 3 enhanced monitoring services
        services.AddScoped<IHealthCheckCacheService, HealthCheckCacheService>();
        services.AddScoped<IHealthCheckScoringService, HealthCheckScoringService>();
        services.AddSingleton<IMetricsCollectionService, MetricsCollectionService>();
        services.AddScoped<ICorrelationIdService, CorrelationIdService>();
        services.AddScoped<IDiagnosticsService, DiagnosticsService>();
        
        // Memory cache for health check caching
        services.AddMemoryCache();
        
        // HTTP context accessor for correlation ID service
        services.AddHttpContextAccessor();
        
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

    private static void AddRefitClient(IServiceCollection services, IConfiguration configuration)
    {
        // Configure HTTP client with enhanced settings for Ollama
        services.AddRefitClient<IOpenAIApi>((provider) =>
        {
            var options = provider.GetRequiredService<IOptions<OllamaOptions>>().Value;
            return new RefitSettings
            {
                ContentSerializer = new SystemTextJsonContentSerializer()
            };
        })
        .ConfigureHttpClient((provider, client) =>
        {
            var options = provider.GetRequiredService<IOptions<OllamaOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
            
            // Add default headers if needed
            client.DefaultRequestHeaders.Add("User-Agent", "ContextMemoryStore/1.0");
            
            // Add authorization header if API key is provided
            if (!string.IsNullOrEmpty(options.ApiKey))
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {options.ApiKey}");
            }
        })
        .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            // Configure connection pooling settings
            MaxConnectionsPerServer = 10, // Default from OllamaOptions.ConnectionPoolSize
            UseCookies = false,
            UseDefaultCredentials = false
        })
        // Add Polly retry policies if needed in the future
        .SetHandlerLifetime(TimeSpan.FromMinutes(5)); // Default from OllamaOptions.ConnectionLifetimeMinutes
    }

    private static void AddPrometheusMetrics(IServiceCollection services, IConfiguration configuration)
    {
        var prometheusOptions = configuration.GetSection(PrometheusOptions.SectionName).Get<PrometheusOptions>();
        
        if (prometheusOptions?.Enabled == true)
        {
            services.AddSingleton<MetricServer>(provider =>
            {
                var options = provider.GetRequiredService<IOptions<PrometheusOptions>>().Value;
                
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

                return new MetricServer(port: options.Port, registry: registry);
            });
        }
    }
}