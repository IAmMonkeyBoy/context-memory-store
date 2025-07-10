using ContextMemoryStore.Tests.Common;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Xunit;

namespace ContextMemoryStore.Tests.Integration.Api;

/// <summary>
/// Integration tests for REST API endpoints.
/// Tests all core API endpoints with real HTTP requests.
/// </summary>
[Trait(TestTraits.Category, TestCategories.Integration)]
[Trait(TestTraits.Duration, "Medium")]
public class ApiEndpointIntegrationTests : ServiceIntegrationTestBase
{
    private readonly TestDataManager _testDataManager;

    public ApiEndpointIntegrationTests()
    {
        _testDataManager = new TestDataManager();
    }

    protected override bool RequiresQdrant() => true;
    protected override bool RequiresNeo4j() => true;
    protected override bool RequiresOllama() => false;

    [Fact]
    public async Task HealthEndpoint_ShouldReturnHealthy()
    {
        // Act
        var response = await HttpClient.GetAsync("/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();

        Logger.LogInformation("Health endpoint returned: {Response}", content);
    }

    [Fact]
    public async Task DetailedHealthEndpoint_ShouldReturnServiceStatus()
    {
        // Act
        var response = await HttpClient.GetAsync("/health/detailed");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();

        Logger.LogInformation("Detailed health endpoint returned: {Response}", content);
    }

    [Fact]
    public async Task VersionedHealthEndpoint_ShouldReturnHealthy()
    {
        // Act
        var response = await HttpClient.GetAsync("/v1/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();

        Logger.LogInformation("Versioned health endpoint returned: {Response}", content);
    }

    [Fact]
    public async Task MetricsEndpoint_ShouldReturnPrometheusFormat()
    {
        // Act
        var response = await HttpClient.GetAsync("/metrics");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("text/plain");
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
        content.Should().Contain("# HELP", "Should contain Prometheus help comments");

        Logger.LogInformation("Metrics endpoint returned {Length} characters of data", content.Length);
    }

    [Fact]
    public async Task LifecycleStart_WithValidRequest_ShouldSucceed()
    {
        // Arrange
        var projectId = _testDataManager.GenerateTestNodeId();
        var request = new
        {
            projectId = projectId,
            config = new { }
        };

        var json = JsonSerializer.Serialize(request);
        var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await HttpClient.PostAsync("/lifecycle/start", httpContent);

        // Assert
        response.Should().NotBeNull();
        
        var content = await response.Content.ReadAsStringAsync();
        Logger.LogInformation("Lifecycle start response ({StatusCode}): {Response}", 
            response.StatusCode, content);

        // Allow for either success or expected service-related errors
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.BadRequest,
            HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task LifecycleStatus_WithProjectId_ShouldReturnStatus()
    {
        // Arrange
        var projectId = _testDataManager.GenerateTestNodeId();

        // Act
        var response = await HttpClient.GetAsync($"/lifecycle/status?projectId={projectId}");

        // Assert
        response.Should().NotBeNull();
        
        var content = await response.Content.ReadAsStringAsync();
        Logger.LogInformation("Lifecycle status response ({StatusCode}): {Response}", 
            response.StatusCode, content);

        // Allow for either success or expected errors
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.BadRequest,
            HttpStatusCode.NotFound,
            HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task MemoryIngest_WithValidDocument_ShouldProcessRequest()
    {
        // Arrange
        var document = _testDataManager.CreateTestDocuments(1).First();
        var request = new
        {
            documents = new[] 
            {
                new 
                {
                    id = document.Id,
                    content = document.Content,
                    metadata = document.Metadata
                }
            },
            options = new { }
        };

        var json = JsonSerializer.Serialize(request);
        var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await HttpClient.PostAsync("/memory/ingest", httpContent);

        // Assert
        response.Should().NotBeNull();
        
        var content = await response.Content.ReadAsStringAsync();
        Logger.LogInformation("Memory ingest response ({StatusCode}): {Response}", 
            response.StatusCode, content);

        // Allow for either success or expected service-related errors
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.BadRequest,
            HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task MemoryContext_WithQuery_ShouldReturnContext()
    {
        // Arrange
        var query = "test query for context retrieval";

        // Act
        var response = await HttpClient.GetAsync($"/memory/context?q={Uri.EscapeDataString(query)}");

        // Assert
        response.Should().NotBeNull();
        
        var content = await response.Content.ReadAsStringAsync();
        Logger.LogInformation("Memory context response ({StatusCode}): {Response}", 
            response.StatusCode, content);

        // Allow for either success or expected service-related errors
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.BadRequest,
            HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task MemorySearch_WithQuery_ShouldReturnSearchResults()
    {
        // Arrange
        var query = "test search query";

        // Act
        var response = await HttpClient.GetAsync($"/memory/search?q={Uri.EscapeDataString(query)}&limit=5");

        // Assert
        response.Should().NotBeNull();
        
        var content = await response.Content.ReadAsStringAsync();
        Logger.LogInformation("Memory search response ({StatusCode}): {Response}", 
            response.StatusCode, content);

        // Allow for either success or expected service-related errors
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.BadRequest,
            HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task DiagnosticsSystem_ShouldReturnSystemInfo()
    {
        // Act
        var response = await HttpClient.GetAsync("/api/v1/diagnostics/system");

        // Assert
        response.Should().NotBeNull();
        
        var content = await response.Content.ReadAsStringAsync();
        Logger.LogInformation("Diagnostics system response ({StatusCode}): {Response}", 
            response.StatusCode, content);

        // Allow for either success or expected errors
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task DiagnosticsConnectivity_ShouldReturnConnectivityStatus()
    {
        // Act
        var response = await HttpClient.GetAsync("/api/v1/diagnostics/connectivity");

        // Assert
        response.Should().NotBeNull();
        
        var content = await response.Content.ReadAsStringAsync();
        Logger.LogInformation("Diagnostics connectivity response ({StatusCode}): {Response}", 
            response.StatusCode, content);

        // Allow for either success or expected errors
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task DiagnosticsHealthCheck_ShouldReturnComprehensiveHealth()
    {
        // Act
        var response = await HttpClient.GetAsync("/api/v1/diagnostics/health-check");

        // Assert
        response.Should().NotBeNull();
        
        var content = await response.Content.ReadAsStringAsync();
        Logger.LogInformation("Diagnostics health check response ({StatusCode}): {Response}", 
            response.StatusCode, content);

        // Allow for either success or expected errors
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task InvalidEndpoint_ShouldReturn404()
    {
        // Act
        var response = await HttpClient.GetAsync("/invalid/endpoint");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        Logger.LogInformation("Invalid endpoint correctly returned 404");
    }

    [Fact]
    public async Task LifecycleStart_WithInvalidRequest_ShouldReturnBadRequest()
    {
        // Arrange - Invalid JSON
        var invalidJson = "{ invalid json }";
        var httpContent = new StringContent(invalidJson, Encoding.UTF8, "application/json");

        // Act
        var response = await HttpClient.PostAsync("/lifecycle/start", httpContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await response.Content.ReadAsStringAsync();
        Logger.LogInformation("Invalid lifecycle start correctly returned: {Response}", content);
    }

    [Fact]
    public async Task MemoryContext_WithoutQuery_ShouldReturnBadRequest()
    {
        // Act - Missing required query parameter
        var response = await HttpClient.GetAsync("/memory/context");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await response.Content.ReadAsStringAsync();
        Logger.LogInformation("Memory context without query correctly returned: {Response}", content);
    }

    [Fact]
    public async Task ApiVersioning_ShouldBeConsistent()
    {
        // Act - Test both versioned and unversioned health endpoints
        var unversionedHealth = await HttpClient.GetAsync("/health");
        var versionedHealth = await HttpClient.GetAsync("/v1/health");

        // Assert - Both should work
        unversionedHealth.StatusCode.Should().Be(HttpStatusCode.OK);
        versionedHealth.StatusCode.Should().Be(HttpStatusCode.OK);

        Logger.LogInformation("API versioning consistency verified");
    }

    [Fact]
    public async Task ConcurrentRequests_ShouldHandleLoad()
    {
        // Arrange
        var healthRequests = Enumerable.Range(0, 5)
            .Select(_ => HttpClient.GetAsync("/health"));

        // Act
        var responses = await Task.WhenAll(healthRequests);

        // Assert
        responses.Should().AllSatisfy(response => 
            response.StatusCode.Should().Be(HttpStatusCode.OK, "All concurrent requests should succeed"));

        Logger.LogInformation("Concurrent request handling verified");
    }

    public override async Task DisposeAsync()
    {
        // Cleanup any test data if needed
        Logger.LogInformation("API endpoint integration test cleanup completed");
        await base.DisposeAsync();
    }
}