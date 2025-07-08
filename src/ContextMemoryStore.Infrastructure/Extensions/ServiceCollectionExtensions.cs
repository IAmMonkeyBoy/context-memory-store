using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ContextMemoryStore.Core.Interfaces;

namespace ContextMemoryStore.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // TODO: Implement service registrations for:
        // - IMemoryService
        // - IVectorStoreService (Qdrant)
        // - IGraphStoreService (Neo4j)
        // - ILLMService (Ollama)
        // - IDocumentRepository
        
        // For now, register placeholder implementations
        // These will be implemented in future steps
        
        return services;
    }
}