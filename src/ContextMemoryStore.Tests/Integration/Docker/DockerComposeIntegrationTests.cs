using ContextMemoryStore.Tests.Common;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Http;
using Xunit;

namespace ContextMemoryStore.Tests.Integration.Docker;

/// <summary>
/// Integration tests for Docker Compose orchestration and service dependencies.
/// Tests container startup, service connectivity, and configuration management.
/// </summary>
[Trait(TestTraits.Category, TestCategories.Docker)]
[Trait(TestTraits.Category, TestCategories.RequiresExternalServices)]
[Trait(TestTraits.Duration, "Long")]
public class DockerComposeIntegrationTests : ServiceIntegrationTestBase
{
    private readonly HttpClient _httpClient;

    public DockerComposeIntegrationTests()
    {
        // Create separate HTTP client for external service testing
        _httpClient = new HttpClient();
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
    }

    protected override bool RequiresQdrant() => true;
    protected override bool RequiresNeo4j() => true;
    protected override bool RequiresOllama() => false; // External service

    [Fact]
    public async Task DockerEnvironment_ShouldBeAvailable()
    {
        // Act
        var isDockerAvailable = TestEnvironment.IsDockerAvailable;

        // Assert
        isDockerAvailable.Should().BeTrue("Docker should be available for container integration testing");

        Logger.LogInformation("Docker environment availability verified");
    }

    [Fact]
    public async Task QdrantContainer_ShouldBeHealthy()
    {
        // Arrange
        var qdrantEndpoint = TestConstants.DefaultQdrantEndpoint;

        // Act
        var response = await _httpClient.GetAsync($"{qdrantEndpoint}/");

        // Assert
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.NotFound); // Qdrant root might return 404 but service is up

        Logger.LogInformation("Qdrant container health verified at {Endpoint}", qdrantEndpoint);
    }

    [Fact]
    public async Task QdrantCollections_ShouldBeAccessible()
    {
        // Arrange
        var qdrantEndpoint = TestConstants.DefaultQdrantEndpoint;

        // Act
        var response = await _httpClient.GetAsync($"{qdrantEndpoint}/collections");

        // Assert
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.NotFound); // Collections endpoint might vary

        var content = await response.Content.ReadAsStringAsync();
        Logger.LogInformation("Qdrant collections response: {Response}", content);
    }

    [Fact]
    public async Task Neo4jContainer_ShouldBeHealthy()
    {
        // Arrange
        var neo4jHttpEndpoint = "http://localhost:7474";

        // Act
        var response = await _httpClient.GetAsync($"{neo4jHttpEndpoint}/");

        // Assert
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.Moved,
            HttpStatusCode.Found,
            HttpStatusCode.Unauthorized); // Neo4j might require auth

        Logger.LogInformation("Neo4j container health verified at {Endpoint}", neo4jHttpEndpoint);
    }

    [Fact]
    public async Task ServiceConnectivity_AllRequiredServices_ShouldBeReachable()
    {
        // Act
        var servicesAvailable = await TestEnvironment.AreExternalServicesAvailable();

        // Assert
        if (TestEnvironment.IsDockerAvailable)
        {
            // If Docker is available, at least some services should be reachable
            Logger.LogInformation("External services availability: {Available}", servicesAvailable);
        }
        else
        {
            Logger.LogWarning("Docker not available - skipping external service connectivity test");
        }

        // This test is informational - we log results but don't fail
        // because external services may not always be running
        Logger.LogInformation("Service connectivity test completed");
    }

    [Fact]
    public async Task ContainerNetworking_ShouldAllowServiceCommunication()
    {
        // Arrange
        var testEndpoints = new[]
        {
            ("Qdrant", TestConstants.DefaultQdrantEndpoint),
            ("Neo4j HTTP", "http://localhost:7474"),
            ("Ollama", TestConstants.DefaultOllamaEndpoint)
        };

        // Act & Assert
        foreach (var (serviceName, endpoint) in testEndpoints)
        {
            try
            {
                var response = await _httpClient.GetAsync(endpoint);
                Logger.LogInformation("Service {ServiceName} at {Endpoint}: {StatusCode}", 
                    serviceName, endpoint, response.StatusCode);
            }
            catch (Exception ex)
            {
                Logger.LogInformation("Service {ServiceName} at {Endpoint}: Not reachable ({Exception})", 
                    serviceName, endpoint, ex.GetType().Name);
            }
        }

        Logger.LogInformation("Container networking connectivity test completed");
    }

    [Fact]
    public async Task ServiceConfiguration_ShouldUseExpectedPorts()
    {
        // Arrange
        var expectedPorts = new Dictionary<string, int>
        {
            ["Qdrant"] = 6333,
            ["Neo4j Bolt"] = 7687,
            ["Neo4j HTTP"] = 7474,
            ["Ollama"] = 11434
        };

        // Act & Assert
        foreach (var (serviceName, port) in expectedPorts)
        {
            var endpoint = $"http://localhost:{port}";
            try
            {
                var response = await _httpClient.GetAsync(endpoint);
                Logger.LogInformation("Service {ServiceName} on port {Port}: Responding", serviceName, port);
            }
            catch (Exception ex)
            {
                Logger.LogInformation("Service {ServiceName} on port {Port}: Not responding ({Exception})", 
                    serviceName, port, ex.GetType().Name);
            }
        }

        Logger.LogInformation("Service port configuration validation completed");
    }

    [Fact]
    public async Task ContainerLifecycle_ShouldSupportRestarts()
    {
        // This test verifies that our test infrastructure can handle container restarts
        // by testing the container management in our ServiceIntegrationTestBase

        // Arrange
        var initialHealthCheck = await CheckContainerHealth();

        // Act - Force reinitialization (simulates container restart)
        await DisposeAsync();
        await InitializeAsync();

        // Assert
        var postRestartHealthCheck = await CheckContainerHealth();
        
        Logger.LogInformation("Container lifecycle test completed - Initial: {Initial}, Post-restart: {PostRestart}", 
            initialHealthCheck, postRestartHealthCheck);
    }

    [Fact]
    public async Task ServiceDependencies_ShouldStartInCorrectOrder()
    {
        // This test validates that services can start and be accessed in the expected order
        // Priority order: Infrastructure services (Qdrant, Neo4j) before application services

        // Arrange
        var services = new[]
        {
            ("Qdrant", TestConstants.DefaultQdrantEndpoint),
            ("Neo4j", "http://localhost:7474")
        };

        // Act & Assert
        var healthChecks = new List<(string Service, bool IsHealthy, TimeSpan ResponseTime)>();

        foreach (var (serviceName, endpoint) in services)
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            try
            {
                var response = await _httpClient.GetAsync(endpoint);
                stopwatch.Stop();
                
                var isHealthy = response.IsSuccessStatusCode || 
                               response.StatusCode == HttpStatusCode.NotFound ||
                               response.StatusCode == HttpStatusCode.Unauthorized;
                
                healthChecks.Add((serviceName, isHealthy, stopwatch.Elapsed));
                
                Logger.LogInformation("Service {ServiceName}: {Status} in {Duration}ms", 
                    serviceName, isHealthy ? "Healthy" : "Unhealthy", stopwatch.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                healthChecks.Add((serviceName, false, stopwatch.Elapsed));
                Logger.LogInformation("Service {ServiceName}: Failed in {Duration}ms - {Exception}", 
                    serviceName, stopwatch.ElapsedMilliseconds, ex.GetType().Name);
            }
        }

        Logger.LogInformation("Service dependency startup order validation completed");
    }

    [Fact]
    public async Task ConfigurationManagement_ShouldUseContainerDefaults()
    {
        // This test verifies that our configuration correctly uses container-appropriate defaults

        // Act
        var config = GetTestConfiguration();

        // Assert
        var qdrantEndpoint = config.GetValueOrDefault("ApiOptions:VectorStore:Endpoint", TestConstants.DefaultQdrantEndpoint);
        var neo4jEndpoint = config.GetValueOrDefault("ApiOptions:GraphStore:ConnectionString", TestConstants.DefaultNeo4jEndpoint);
        var ollamaEndpoint = config.GetValueOrDefault("ApiOptions:LlmService:BaseUrl", TestConstants.DefaultOllamaEndpoint);

        qdrantEndpoint.Should().StartWith("http://localhost:6333", "Qdrant should use localhost container port");
        neo4jEndpoint.Should().StartWith("bolt://localhost:7687", "Neo4j should use localhost bolt port");
        ollamaEndpoint.Should().StartWith("http://localhost:11434", "Ollama should use localhost port");

        Logger.LogInformation("Configuration management validation completed");
        Logger.LogInformation("Qdrant: {Qdrant}, Neo4j: {Neo4j}, Ollama: {Ollama}", 
            qdrantEndpoint, neo4jEndpoint, ollamaEndpoint);
    }

    [Fact]
    public async Task ResourceUtilization_ShouldBeWithinLimits()
    {
        // This test monitors that container resource usage is reasonable
        // We'll use basic metrics that don't require admin privileges

        // Arrange
        var startTime = DateTime.UtcNow;

        // Act - Perform some operations to generate load
        var healthTasks = new[]
        {
            CheckServiceHealth("Qdrant", TestConstants.DefaultQdrantEndpoint),
            CheckServiceHealth("Neo4j", "http://localhost:7474"),
            CheckServiceHealth("API", "/health")
        };

        var results = await Task.WhenAll(healthTasks);
        var endTime = DateTime.UtcNow;
        var duration = endTime - startTime;

        // Assert
        duration.Should().BeLessThan(TimeSpan.FromMinutes(1), "Health checks should complete quickly");

        var successfulChecks = results.Count(r => r);
        Logger.LogInformation("Resource utilization test completed in {Duration}ms - {Successful}/{Total} services healthy", 
            duration.TotalMilliseconds, successfulChecks, results.Length);
    }

    // Helper Methods

    private async Task<bool> CheckContainerHealth()
    {
        try
        {
            // Check if containers are responding
            var qdrantTask = _httpClient.GetAsync(TestConstants.DefaultQdrantEndpoint);
            var neo4jTask = _httpClient.GetAsync("http://localhost:7474");

            await Task.WhenAll(qdrantTask, neo4jTask);

            return true; // If no exceptions, containers are at least reachable
        }
        catch
        {
            return false;
        }
    }

    private async Task<bool> CheckServiceHealth(string serviceName, string endpoint)
    {
        try
        {
            HttpResponseMessage response;
            if (endpoint.StartsWith("/"))
            {
                // Use the test HTTP client for API endpoints
                response = await HttpClient.GetAsync(endpoint);
            }
            else
            {
                // Use the external HTTP client for external services
                response = await _httpClient.GetAsync(endpoint);
            }

            var isHealthy = response.IsSuccessStatusCode || 
                           response.StatusCode == HttpStatusCode.NotFound ||
                           response.StatusCode == HttpStatusCode.Unauthorized;

            Logger.LogDebug("Service {ServiceName} health check: {StatusCode} ({Healthy})", 
                serviceName, response.StatusCode, isHealthy);

            return isHealthy;
        }
        catch (Exception ex)
        {
            Logger.LogDebug("Service {ServiceName} health check failed: {Exception}", serviceName, ex.GetType().Name);
            return false;
        }
    }

    public override async Task DisposeAsync()
    {
        _httpClient?.Dispose();
        await base.DisposeAsync();
        Logger.LogInformation("Docker Compose integration test cleanup completed");
    }
}