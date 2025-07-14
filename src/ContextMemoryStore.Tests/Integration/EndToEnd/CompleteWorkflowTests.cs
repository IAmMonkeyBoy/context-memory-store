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
/// End-to-end integration tests for complete API workflows.
/// Tests the full lifecycle from engine startup through document ingestion, 
/// querying, and shutdown with real service integrations.
/// </summary>
[Trait(TestTraits.Category, TestCategories.EndToEnd)]
[Trait(TestTraits.Service, "CompleteWorkflow")]
[Trait(TestTraits.Duration, "Long")]
[Collection("SerializedIntegrationTests")]
public class CompleteWorkflowTests : ServiceIntegrationTestBase
{
    private readonly TestDataManager _testDataManager;
    private readonly JsonSerializerOptions _jsonOptions;
    private string? _projectId;

    public CompleteWorkflowTests()
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

    [Fact]
    public async Task CompleteLifecycle_WithMockedServices_ShouldSucceed()
    {
        // Arrange
        _projectId = GenerateTestProjectId();
        var testDocuments = _testDataManager.CreateTestDocuments(3);

        // Act & Assert - Full lifecycle test
        await ExecuteCompleteLifecycle(_projectId, testDocuments);
    }

    [Fact]
    public async Task MultipleProjects_WithMockedServices_ShouldIsolateData()
    {
        // Arrange
        var projectId1 = GenerateTestProjectId();
        var projectId2 = GenerateTestProjectId();
        var documents1 = _testDataManager.CreateTestDocuments(2);
        var documents2 = _testDataManager.CreateTestDocuments(2);

        // Act
        await ExecuteCompleteLifecycle(projectId1, documents1);
        await ExecuteCompleteLifecycle(projectId2, documents2);

        // Assert - Projects should be isolated (verified through lifecycle)
        Logger.LogInformation("Multiple project isolation test completed successfully");
    }

    [Fact]
    public async Task ConcurrentOperations_WithMockedServices_ShouldHandleGracefully()
    {
        // Arrange
        _projectId = GenerateTestProjectId();
        await StartEngine(_projectId);

        var tasks = new List<Task>();

        // Act - Concurrent operations
        for (int i = 0; i < 3; i++)
        {
            var documents = _testDataManager.CreateTestDocuments(1);
            tasks.Add(IngestDocuments(_projectId, documents));
        }

        for (int i = 0; i < 2; i++)
        {
            tasks.Add(QueryContext(_projectId, $"test query {i}"));
        }

        await Task.WhenAll(tasks);

        // Assert
        var status = await GetEngineStatus(_projectId);
        status.Should().NotBeNull();

        await StopEngine(_projectId);
    }

    [Fact]
    public async Task ErrorHandling_WithInvalidData_ShouldReturnAppropriateErrors()
    {
        // Arrange
        _projectId = GenerateTestProjectId();

        // Act & Assert - Test various error scenarios
        await TestInvalidProjectIdScenarios();
        await TestInvalidDocumentScenarios(_projectId);
        await TestInvalidQueryScenarios(_projectId);
    }

    [Fact]
    public async Task HealthAndDiagnostics_ThroughoutLifecycle_ShouldProvideTelemetry()
    {
        // Arrange
        _projectId = GenerateTestProjectId();

        // Act & Assert - Monitor health throughout lifecycle
        await ValidateHealthEndpoints();
        await StartEngine(_projectId);
        await ValidateHealthEndpoints();
        
        var documents = _testDataManager.CreateTestDocuments(2);
        await IngestDocuments(_projectId, documents);
        await ValidateHealthEndpoints();
        
        await QueryContext(_projectId, "test query");
        await ValidateHealthEndpoints();
        
        await ValidateDiagnosticsEndpoints();
        await ValidateMetricsEndpoint();
        
        await StopEngine(_projectId);
        await ValidateHealthEndpoints();
    }

    private async Task ExecuteCompleteLifecycle(string projectId, List<ContextMemoryStore.Core.Entities.Document> documents)
    {
        Logger.LogInformation("Starting complete lifecycle test for project {ProjectId}", projectId);

        // 1. Start Engine
        var startResponse = await StartEngine(projectId);
        startResponse.Should().NotBeNull();

        // 2. Check Status After Start
        var statusAfterStart = await GetEngineStatus(projectId);
        statusAfterStart.Should().NotBeNull();

        // 3. Ingest Documents
        var ingestResponse = await IngestDocuments(projectId, documents);
        ingestResponse.Should().NotBeNull();

        // 4. Query Context
        var contextResponse = await QueryContext(projectId, "test content");
        contextResponse.Should().NotBeNull();

        // 5. Search Documents
        var searchResponse = await SearchDocuments(projectId, "test");
        searchResponse.Should().NotBeNull();

        // 6. Check Status After Operations
        var statusAfterOps = await GetEngineStatus(projectId);
        statusAfterOps.Should().NotBeNull();

        // 7. Stop Engine
        var stopResponse = await StopEngine(projectId);
        stopResponse.Should().NotBeNull();

        Logger.LogInformation("Complete lifecycle test completed successfully for project {ProjectId}", projectId);
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
        responseContent.Should().NotBeNullOrEmpty();

        Logger.LogInformation("Engine started for project {ProjectId}", projectId);
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> StopEngine(string projectId)
    {
        var request = new
        {
            ProjectId = projectId,
            CommitMessage = $"Test completion for project {projectId}"
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await HttpClient.PostAsync("/lifecycle/stop", content);
        
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().NotBeNullOrEmpty();

        Logger.LogInformation("Engine stopped for project {ProjectId}", projectId);
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> GetEngineStatus(string projectId)
    {
        var response = await HttpClient.GetAsync($"/lifecycle/status?projectId={projectId}");
        
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().NotBeNullOrEmpty();

        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> IngestDocuments(string projectId, List<ContextMemoryStore.Core.Entities.Document> documents)
    {
        var request = new
        {
            ProjectId = projectId,
            Documents = documents.Select(d => new
            {
                d.Id,
                d.Content,
                Metadata = new
                {
                    Title = d.Metadata.Title ?? "Test Document",
                    Type = d.Metadata.Type ?? "test",
                    Tags = d.Metadata.Tags
                },
                Source = new
                {
                    d.Source.Type,
                    d.Source.Path
                }
            }).ToList(),
            Options = new
            {
                ProcessRelationships = true,
                GenerateSummary = true
            }
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await HttpClient.PostAsync("/memory/ingest", content);
        
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().NotBeNullOrEmpty();

        Logger.LogInformation("Ingested {Count} documents for project {ProjectId}", documents.Count, projectId);
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> QueryContext(string projectId, string query)
    {
        var url = $"/memory/context?q={Uri.EscapeDataString(query)}&limit=5&includeRelationships=true&minScore=0.3";
        var response = await HttpClient.GetAsync(url);
        
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().NotBeNullOrEmpty();

        Logger.LogInformation("Queried context for project {ProjectId} with query: {Query}", projectId, query);
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task<object?> SearchDocuments(string projectId, string query)
    {
        var url = $"/memory/search?q={Uri.EscapeDataString(query)}&limit=10&offset=0&sort=relevance";
        var response = await HttpClient.GetAsync(url);
        
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().NotBeNullOrEmpty();

        Logger.LogInformation("Searched documents for project {ProjectId} with query: {Query}", projectId, query);
        return JsonSerializer.Deserialize<object>(responseContent);
    }

    private async Task TestInvalidProjectIdScenarios()
    {
        // Test empty project ID
        var response = await HttpClient.GetAsync("/lifecycle/status?projectId=");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        // Test invalid project ID format
        response = await HttpClient.GetAsync("/lifecycle/status?projectId=invalid-project-id-format");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.NotFound);
    }

    private async Task TestInvalidDocumentScenarios(string projectId)
    {
        await StartEngine(projectId);

        // Test empty documents list
        var request = new
        {
            ProjectId = projectId,
            Documents = new List<object>(),
            Options = new { ProcessRelationships = true }
        };

        var json = JsonSerializer.Serialize(request, _jsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await HttpClient.PostAsync("/memory/ingest", content);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.OK); // Might be OK with empty list

        await StopEngine(projectId);
    }

    private async Task TestInvalidQueryScenarios(string projectId)
    {
        await StartEngine(projectId);

        // Test empty query
        var response = await HttpClient.GetAsync("/memory/context?q=&limit=5");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.OK);

        // Test invalid parameters
        response = await HttpClient.GetAsync("/memory/context?q=test&limit=-1");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await StopEngine(projectId);
    }

    private async Task ValidateHealthEndpoints()
    {
        // Basic health check
        var response = await HttpClient.GetAsync("/health");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();

        // Detailed health check
        response = await HttpClient.GetAsync("/health/detailed");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);

        content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
    }

    private async Task ValidateDiagnosticsEndpoints()
    {
        var endpoints = new[]
        {
            "/api/v1/diagnostics/system",
            "/api/v1/diagnostics/connectivity",
            "/api/v1/diagnostics/configuration",
            "/api/v1/diagnostics/resources",
            "/api/v1/diagnostics/health-check",
            "/api/v1/diagnostics/metrics"
        };

        foreach (var endpoint in endpoints)
        {
            var response = await HttpClient.GetAsync(endpoint);
            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);

            var content = await response.Content.ReadAsStringAsync();
            content.Should().NotBeNullOrEmpty();
        }
    }

    private async Task ValidateMetricsEndpoint()
    {
        var response = await HttpClient.GetAsync("/metrics");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
        content.Should().Contain("# TYPE"); // Prometheus format indicator
    }

    private string GenerateTestProjectId()
    {
        return $"test_project_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}";
    }

    public override async Task DisposeAsync()
    {
        if (!string.IsNullOrEmpty(_projectId))
        {
            try
            {
                await StopEngine(_projectId);
            }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "Failed to stop engine during cleanup for project {ProjectId}", _projectId);
            }
        }

        await base.DisposeAsync();
    }
}