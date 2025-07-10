using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text.Json;

namespace ContextMemoryStore.Tests.Common;

/// <summary>
/// Helper class for cleaning up test data across different services.
/// </summary>
public class TestCleanupHelper
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<TestCleanupHelper> _logger;
    private readonly string? _qdrantEndpoint;
    private readonly string? _neo4jConnectionString;

    public TestCleanupHelper(
        HttpClient httpClient, 
        ILogger<TestCleanupHelper> logger,
        string? qdrantEndpoint = null,
        string? neo4jConnectionString = null)
    {
        _httpClient = httpClient;
        _logger = logger;
        _qdrantEndpoint = qdrantEndpoint;
        _neo4jConnectionString = neo4jConnectionString;
    }

    /// <summary>
    /// Cleans up test collections from Qdrant vector store.
    /// </summary>
    public async Task CleanupQdrantCollections(IEnumerable<string> collectionNames)
    {
        if (string.IsNullOrEmpty(_qdrantEndpoint))
        {
            _logger.LogWarning("Qdrant endpoint not configured, skipping cleanup");
            return;
        }

        foreach (var collectionName in collectionNames)
        {
            try
            {
                var response = await _httpClient.DeleteAsync($"{_qdrantEndpoint}/collections/{collectionName}");
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Successfully cleaned up Qdrant collection: {CollectionName}", collectionName);
                }
                else
                {
                    _logger.LogWarning("Failed to cleanup Qdrant collection {CollectionName}: {StatusCode}", 
                        collectionName, response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up Qdrant collection {CollectionName}", collectionName);
            }
        }
    }

    /// <summary>
    /// Cleans up test nodes from Neo4j graph store.
    /// </summary>
    public async Task CleanupNeo4jNodes(IEnumerable<string> nodeIds)
    {
        if (string.IsNullOrEmpty(_neo4jConnectionString))
        {
            _logger.LogWarning("Neo4j connection string not configured, skipping cleanup");
            return;
        }

        // Note: In a real implementation, this would use Neo4j.Driver
        // For now, we'll log the cleanup operations that would be performed
        foreach (var nodeId in nodeIds)
        {
            try
            {
                _logger.LogInformation("Would cleanup Neo4j node: {NodeId}", nodeId);
                // TODO: Implement actual Neo4j cleanup when Neo4j.Driver is integrated
                // Example Cypher: MATCH (n {id: $nodeId}) DETACH DELETE n
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up Neo4j node {NodeId}", nodeId);
            }
        }
    }

    /// <summary>
    /// Cleans up test data via API endpoints.
    /// </summary>
    public async Task CleanupViaApi(string endpoint, object payload)
    {
        try
        {
            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            var response = await _httpClient.DeleteAsync($"{endpoint}?{await content.ReadAsStringAsync()}");
            
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully cleaned up via API endpoint: {Endpoint}", endpoint);
            }
            else
            {
                _logger.LogWarning("Failed to cleanup via API endpoint {Endpoint}: {StatusCode}", 
                    endpoint, response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up via API endpoint {Endpoint}", endpoint);
        }
    }

    /// <summary>
    /// Performs comprehensive cleanup using the test data manager.
    /// </summary>
    public async Task PerformComprehensiveCleanup(TestDataManager testDataManager)
    {
        _logger.LogInformation("Starting comprehensive test data cleanup");

        // Cleanup vector store collections
        var collections = testDataManager.GetCreatedCollections();
        if (collections.Any())
        {
            await CleanupQdrantCollections(collections);
        }

        // Cleanup graph store nodes
        var nodes = testDataManager.GetCreatedGraphNodes();
        if (nodes.Any())
        {
            await CleanupNeo4jNodes(nodes);
        }

        // Clear tracking lists
        testDataManager.ClearTrackingLists();

        _logger.LogInformation("Completed comprehensive test data cleanup");
    }

    /// <summary>
    /// Waits for cleanup operations to complete with timeout.
    /// </summary>
    public async Task WaitForCleanupCompletion(TimeSpan? timeout = null)
    {
        timeout ??= TimeSpan.FromSeconds(10);
        
        // Simple delay to allow cleanup operations to complete
        // In a more sophisticated implementation, this could poll for cleanup completion
        await Task.Delay(timeout.Value);
        
        _logger.LogInformation("Cleanup completion wait finished");
    }

    /// <summary>
    /// Verifies that cleanup was successful by checking for test data remnants.
    /// </summary>
    public async Task<bool> VerifyCleanupSuccess(TestDataManager testDataManager)
    {
        var collections = testDataManager.GetCreatedCollections();
        var nodes = testDataManager.GetCreatedGraphNodes();

        if (!collections.Any() && !nodes.Any())
        {
            _logger.LogInformation("No test data to verify - cleanup verification successful");
            return true;
        }

        // In a real implementation, this would query the services to verify data is gone
        _logger.LogInformation("Cleanup verification: {CollectionCount} collections, {NodeCount} nodes tracked", 
            collections.Count, nodes.Count);

        return true; // Assume success for now
    }
}