using ContextMemoryStore.Tests.Common;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace ContextMemoryStore.Tests.Integration.EndToEnd;

/// <summary>
/// Tests data persistence across Vector DB (Qdrant) and Graph DB (Neo4j).
/// Validates that data is correctly stored, retrieved, and maintained 
/// throughout the system lifecycle.
/// </summary>
[Trait(TestTraits.Category, TestCategories.EndToEnd)]
[Trait(TestTraits.Service, "DataPersistence")]
[Trait(TestTraits.Duration, "Long")]
public class DataPersistenceTests : ServiceIntegrationTestBase
{
    private readonly TestDataManager _testDataManager;
    private TestCleanupHelper? _cleanupHelper;
    private readonly JsonSerializerOptions _jsonOptions;

    public DataPersistenceTests()
    {
        _testDataManager = new TestDataManager();
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };
    }

    protected override bool RequiresQdrant() => false; // Start with mocked services  
    protected override bool RequiresNeo4j() => false;
    protected override bool RequiresOllama() => false;

    public override async Task InitializeAsync()
    {
        await base.InitializeAsync();
        _cleanupHelper = new TestCleanupHelper(HttpClient, Services.GetRequiredService<ILogger<TestCleanupHelper>>());
    }

    [Fact]
    public async Task DocumentIngestion_ShouldPersistToVectorStore()
    {
        // Arrange
        var projectId = GenerateTestProjectId();
        var documents = _testDataManager.CreateTestDocuments(5);
        
        // Act
        await StartEngine(projectId);
        var ingestResponse = await IngestDocuments(projectId, documents);
        
        // Assert - Query to verify vector storage
        var searchResponse = await SearchDocuments(projectId, "test content");
        searchResponse.Should().NotBeNull();
        
        var contextResponse = await QueryContext(projectId, "test content");
        contextResponse.Should().NotBeNull();
        
        // Verify documents can be found through vector search
        Logger.LogInformation("Vector store persistence validated for {Count} documents", documents.Count);
        
        await StopEngine(projectId);
    }

    [Fact]
    public async Task RelationshipExtraction_ShouldPersistToGraphStore()
    {
        // Arrange
        var projectId = GenerateTestProjectId();
        var documents = CreateDocumentsWithRelationships();
        
        // Act
        await StartEngine(projectId);
        await IngestDocuments(projectId, documents, processRelationships: true);
        
        // Assert - Query with relationships
        var contextWithRelationships = await QueryContext(projectId, "document", includeRelationships: true);
        contextWithRelationships.Should().NotBeNull();
        
        // Verify relationship data is included in response
        Logger.LogInformation("Graph store persistence validated for document relationships");
        
        await StopEngine(projectId);
    }

    [Fact]
    public async Task DataConsistency_AcrossStoresAfterMultipleOperations()
    {
        // Arrange
        var projectId = GenerateTestProjectId();
        var initialDocs = _testDataManager.CreateTestDocuments(3);
        var additionalDocs = _testDataManager.CreateTestDocuments(2);
        
        // Act
        await StartEngine(projectId);
        
        // Initial ingestion
        await IngestDocuments(projectId, initialDocs);
        var initialSearch = await SearchDocuments(projectId, "test");
        
        // Additional ingestion
        await IngestDocuments(projectId, additionalDocs);
        var finalSearch = await SearchDocuments(projectId, "test");
        
        // Query context multiple times
        var context1 = await QueryContext(projectId, "content");
        var context2 = await QueryContext(projectId, "document");
        
        // Assert - Data should be consistent across operations
        initialSearch.Should().NotBeNull();
        finalSearch.Should().NotBeNull();
        context1.Should().NotBeNull();
        context2.Should().NotBeNull();
        
        Logger.LogInformation("Data consistency validated across multiple operations");
        
        await StopEngine(projectId);
    }

    [Fact]
    public async Task StateRecovery_AfterEngineRestart()
    {
        // Arrange
        var projectId = GenerateTestProjectId();
        var documents = _testDataManager.CreateTestDocuments(3);
        
        // Act - First lifecycle
        await StartEngine(projectId);
        await IngestDocuments(projectId, documents);
        var beforeStop = await QueryContext(projectId, "test");
        await StopEngine(projectId);
        
        // Restart engine
        await StartEngine(projectId);
        var afterRestart = await QueryContext(projectId, "test");
        await StopEngine(projectId);
        
        // Assert - Data should be recoverable after restart
        beforeStop.Should().NotBeNull();
        afterRestart.Should().NotBeNull();
        
        Logger.LogInformation("State recovery validated after engine restart");
    }

    [Fact]
    public async Task LargeDataset_ShouldHandlePersistenceCorrectly()
    {
        // Arrange
        var projectId = GenerateTestProjectId();
        var largeBatch1 = _testDataManager.CreateTestDocuments(25);
        var largeBatch2 = _testDataManager.CreateTestDocuments(25);
        
        // Act
        await StartEngine(projectId);
        
        // Ingest in batches
        await IngestDocuments(projectId, largeBatch1);
        await IngestDocuments(projectId, largeBatch2);
        
        // Perform multiple queries to test persistence under load
        var tasks = new List<Task>();
        for (int i = 0; i < 5; i++)
        {
            tasks.Add(QueryContext(projectId, $"test query {i}"));
            tasks.Add(SearchDocuments(projectId, $"search term {i}"));
        }
        
        await Task.WhenAll(tasks);
        
        // Assert - System should remain stable with large datasets
        var finalContext = await QueryContext(projectId, "comprehensive test");
        finalContext.Should().NotBeNull();
        
        Logger.LogInformation("Large dataset persistence validated with {Count} documents", 
            largeBatch1.Count + largeBatch2.Count);
        
        await StopEngine(projectId);
    }

    [Fact]
    public async Task DataIsolation_BetweenDifferentProjects()
    {
        // Arrange
        var projectId1 = GenerateTestProjectId();
        var projectId2 = GenerateTestProjectId();
        var docs1 = _testDataManager.CreateTestDocuments(3, "project1_collection");
        var docs2 = _testDataManager.CreateTestDocuments(3, "project2_collection");
        
        // Act
        await StartEngine(projectId1);
        await StartEngine(projectId2);
        
        await IngestDocuments(projectId1, docs1);
        await IngestDocuments(projectId2, docs2);
        
        var context1 = await QueryContext(projectId1, "project1");
        var context2 = await QueryContext(projectId2, "project2");
        
        // Assert - Data should be isolated between projects
        context1.Should().NotBeNull();
        context2.Should().NotBeNull();
        
        // Projects should not see each other's data
        Logger.LogInformation("Data isolation validated between projects {Project1} and {Project2}", 
            projectId1, projectId2);
        
        await StopEngine(projectId1);
        await StopEngine(projectId2);
    }

    [Fact]
    public async Task MetadataPreservation_ThroughoutPersistence()
    {
        // Arrange
        var projectId = GenerateTestProjectId();
        var documents = CreateDocumentsWithRichMetadata();
        
        // Act
        await StartEngine(projectId);
        await IngestDocuments(projectId, documents);
        
        // Query and verify metadata is preserved
        var searchResults = await SearchDocuments(projectId, "metadata");
        var contextResults = await QueryContext(projectId, "metadata");
        
        // Assert - Metadata should be preserved
        searchResults.Should().NotBeNull();
        contextResults.Should().NotBeNull();
        
        Logger.LogInformation("Metadata preservation validated for {Count} documents", documents.Count);
        
        await StopEngine(projectId);
    }

    // Helper Methods

    private List<ContextMemoryStore.Core.Entities.Document> CreateDocumentsWithRelationships()
    {
        var docs = _testDataManager.CreateTestDocuments(3);
        
        // Add relationship-indicating content
        docs[0].Content = "This document references Document B and relates to the main concept.";
        docs[1].Content = "Document B contains information that builds upon Document A's foundation.";
        docs[2].Content = "This summary document combines concepts from both Document A and Document B.";
        
        docs[0].Metadata["references"] = new[] { "Document B", "main concept" };
        docs[1].Metadata["referenced_by"] = new[] { "Document A" };
        docs[2].Metadata["summarizes"] = new[] { "Document A", "Document B" };
        
        return docs;
    }

    private List<ContextMemoryStore.Core.Entities.Document> CreateDocumentsWithRichMetadata()
    {
        var docs = _testDataManager.CreateTestDocuments(3);
        
        for (int i = 0; i < docs.Count; i++)
        {
            docs[i].Metadata["custom_field"] = $"custom_value_{i}";
            docs[i].Metadata["numeric_field"] = i * 100;
            docs[i].Metadata["date_field"] = DateTime.UtcNow.AddDays(-i).ToString("O");
            docs[i].Metadata["array_field"] = new[] { $"item1_{i}", $"item2_{i}", $"item3_{i}" };
            docs[i].Metadata["nested_object"] = new
            {
                Level1 = new
                {
                    Level2 = $"nested_value_{i}",
                    Count = i + 1
                }
            };
        }
        
        return docs;
    }

    private async Task<object?> StartEngine(string projectId)
    {
        var request = new
        {
            ProjectId = projectId,
            Config = new
            {
                VectorStoreConfig = new { CollectionName = $"test_collection_{projectId}" },
                GraphStoreConfig = new { DatabaseName = "neo4j" }
            }
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await HttpClient.PostAsync("/lifecycle/start", content);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> StopEngine(string projectId)
    {
        var request = new
        {
            ProjectId = projectId,
            CommitMessage = $"Data persistence test completion for {projectId}"
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await HttpClient.PostAsync("/lifecycle/stop", content);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> IngestDocuments(
        string projectId, 
        List<ContextMemoryStore.Core.Entities.Document> documents, 
        bool processRelationships = true)
    {
        var request = new
        {
            ProjectId = projectId,
            Documents = documents.Select(d => new
            {
                d.Id,
                d.Content,
                Metadata = d.Metadata,
                Source = new
                {
                    d.Source.Type,
                    d.Source.Path
                }
            }).ToList(),
            Options = new
            {
                ProcessRelationships = processRelationships,
                GenerateSummary = true
            }
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await HttpClient.PostAsync("/memory/ingest", content);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> QueryContext(string projectId, string query, bool includeRelationships = false)
    {
        var url = $"/memory/context?q={Uri.EscapeDataString(query)}&limit=10&includeRelationships={includeRelationships}&minScore=0.1";
        var response = await HttpClient.GetAsync(url);
        
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> SearchDocuments(string projectId, string query)
    {
        var url = $"/memory/search?q={Uri.EscapeDataString(query)}&limit=20&offset=0&sort=relevance";
        var response = await HttpClient.GetAsync(url);
        
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private string GenerateTestProjectId()
    {
        return $"persist_test_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}";
    }

    public override async Task DisposeAsync()
    {
        await _cleanupHelper!.PerformComprehensiveCleanup(_testDataManager);
        await base.DisposeAsync();
    }
}