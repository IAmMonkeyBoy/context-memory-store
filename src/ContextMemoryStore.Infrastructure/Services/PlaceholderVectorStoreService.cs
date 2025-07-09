using ContextMemoryStore.Core.Interfaces;

namespace ContextMemoryStore.Infrastructure.Services;

/// <summary>
/// Placeholder implementation of IVectorStoreService for Phase 4 development
/// This will be replaced with actual Qdrant implementation in future phases
/// </summary>
public class PlaceholderVectorStoreService : IVectorStoreService
{
    public Task<int> StoreEmbeddingsAsync(string documentId, string content, Dictionary<string, object>? metadata = null, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(1);
    }

    public Task<IEnumerable<VectorSearchResult>> SearchAsync(string query, int limit = 10, double threshold = 0.5, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Enumerable.Empty<VectorSearchResult>());
    }

    public Task<int> DeleteEmbeddingsAsync(string documentId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(0);
    }

    public Task<long> GetVectorCountAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(0L);
    }

    public Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(true);
    }

    public Task<int> GetCollectionCountAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(1);
    }

    public Task<bool> InitializeCollectionAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(true);
    }
}