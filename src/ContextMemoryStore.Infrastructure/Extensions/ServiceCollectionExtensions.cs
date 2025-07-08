using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Infrastructure.Services;

namespace ContextMemoryStore.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Register placeholder implementations for Phase 4 development
        // These will be replaced with actual implementations in future phases
        
        services.AddScoped<IMemoryService, PlaceholderMemoryService>();
        services.AddScoped<IVectorStoreService, PlaceholderVectorStoreService>();
        services.AddScoped<IGraphStoreService, PlaceholderGraphStoreService>();
        services.AddScoped<ILLMService, PlaceholderLLMService>();
        
        // TODO: Add actual service implementations:
        // - Qdrant for IVectorStoreService
        // - Neo4j for IGraphStoreService  
        // - Ollama for ILLMService
        // - Complete IMemoryService implementation
        // - IDocumentRepository implementation
        
        return services;
    }
}