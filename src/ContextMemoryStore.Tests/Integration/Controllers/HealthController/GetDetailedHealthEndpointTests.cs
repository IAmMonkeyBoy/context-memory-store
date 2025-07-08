using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using FluentAssertions;
using ContextMemoryStore.Api;
using ContextMemoryStore.Tests.Common;

namespace ContextMemoryStore.Tests.Integration.Controllers.HealthController;

/// <summary>
/// Integration tests for GET /health/detailed endpoint
/// </summary>
public class GetDetailedHealthEndpointTests : IntegrationTestBase
{
    public GetDetailedHealthEndpointTests(WebApplicationFactory<Program> factory) : base(factory)
    {
    }

    [Fact]
    public async Task GetDetailedHealth_ReturnsOkWithValidStructure()
    {
        // Act
        var response = await Client.GetAsync("/health/detailed");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();

        // Verify JSON structure
        var healthResponse = await response.Content.ReadFromJsonAsync<DetailedHealthResponse>();
        healthResponse.Should().NotBeNull();
        healthResponse!.Status.Should().Be("healthy");
        healthResponse.Dependencies.Should().NotBeNull();
    }

    [Fact]
    public async Task GetDetailedHealth_IncludesAllDependencies()
    {
        // Act
        var response = await Client.GetAsync("/health/detailed");

        // Assert
        var healthResponse = await response.Content.ReadFromJsonAsync<DetailedHealthResponse>();
        
        healthResponse!.Dependencies.Should().NotBeNull();
        healthResponse.Dependencies!.Qdrant.Should().NotBeNull();
        healthResponse.Dependencies.Neo4j.Should().NotBeNull();
        healthResponse.Dependencies.Ollama.Should().NotBeNull();
    }

    [Fact]
    public async Task GetDetailedHealth_QdrantDependency_HasExpectedStructure()
    {
        // Act
        var response = await Client.GetAsync("/health/detailed");

        // Assert
        var healthResponse = await response.Content.ReadFromJsonAsync<DetailedHealthResponse>();
        
        var qdrant = healthResponse!.Dependencies!.Qdrant;
        qdrant.Should().NotBeNull();
        qdrant!.Status.Should().Be("healthy"); // Mock is configured as healthy
        qdrant.ResponseTimeMs.Should().BeGreaterThanOrEqualTo(0);
        qdrant.Collections.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public async Task GetDetailedHealth_Neo4jDependency_HasExpectedStructure()
    {
        // Act
        var response = await Client.GetAsync("/health/detailed");

        // Assert
        var healthResponse = await response.Content.ReadFromJsonAsync<DetailedHealthResponse>();
        
        var neo4j = healthResponse!.Dependencies!.Neo4j;
        neo4j.Should().NotBeNull();
        neo4j!.Status.Should().Be("healthy"); // Mock is configured as healthy
        neo4j.ResponseTimeMs.Should().BeGreaterThanOrEqualTo(0);
        neo4j.Nodes.Should().BeGreaterThanOrEqualTo(0);
        neo4j.Relationships.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public async Task GetDetailedHealth_OllamaDependency_HasExpectedStructure()
    {
        // Act
        var response = await Client.GetAsync("/health/detailed");

        // Assert
        var healthResponse = await response.Content.ReadFromJsonAsync<DetailedHealthResponse>();
        
        var ollama = healthResponse!.Dependencies!.Ollama;
        ollama.Should().NotBeNull();
        ollama!.Status.Should().Be("healthy"); // Mock is configured as healthy
        ollama.ResponseTimeMs.Should().BeGreaterThanOrEqualTo(0);
        ollama.Models.Should().NotBeNull();
    }

    [Fact]
    public async Task GetDetailedHealth_ReturnsBasicHealthProperties()
    {
        // Act
        var response = await Client.GetAsync("/health/detailed");

        // Assert
        var healthResponse = await response.Content.ReadFromJsonAsync<DetailedHealthResponse>();
        
        healthResponse!.Status.Should().Be("healthy");
        healthResponse.Timestamp.Should().NotBeNullOrEmpty();
        healthResponse.Version.Should().Be("1.0.0");
        healthResponse.UptimeSeconds.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetDetailedHealth_V1Endpoint_WorksCorrectly()
    {
        // Act
        var response = await Client.GetAsync("/v1/health/detailed");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var healthResponse = await response.Content.ReadFromJsonAsync<DetailedHealthResponse>();
        healthResponse.Should().NotBeNull();
        healthResponse!.Dependencies.Should().NotBeNull();
    }

    [Fact]
    public async Task GetDetailedHealth_PerformanceIsReasonable()
    {
        // Arrange
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act
        var response = await Client.GetAsync("/health/detailed");

        // Assert
        stopwatch.Stop();
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Should complete within reasonable time (allowing for mock setup overhead)
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(5000);
    }

    [Fact]
    public async Task GetDetailedHealth_MultipleRequests_ReturnConsistentStructure()
    {
        // Act
        var response1 = await Client.GetAsync("/health/detailed");
        var response2 = await Client.GetAsync("/health/detailed");

        // Assert
        var health1 = await response1.Content.ReadFromJsonAsync<DetailedHealthResponse>();
        var health2 = await response2.Content.ReadFromJsonAsync<DetailedHealthResponse>();

        health1!.Version.Should().Be(health2!.Version);
        health1.Dependencies.Should().NotBeNull();
        health2.Dependencies.Should().NotBeNull();
    }

    /// <summary>
    /// Response models for detailed health endpoint
    /// </summary>
    private class DetailedHealthResponse
    {
        public string Status { get; set; } = string.Empty;
        public string Timestamp { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public long UptimeSeconds { get; set; }
        public DependenciesResponse? Dependencies { get; set; }
    }

    private class DependenciesResponse
    {
        public QdrantHealthResponse? Qdrant { get; set; }
        public Neo4jHealthResponse? Neo4j { get; set; }
        public OllamaHealthResponse? Ollama { get; set; }
    }

    private class QdrantHealthResponse
    {
        public string Status { get; set; } = string.Empty;
        public int ResponseTimeMs { get; set; }
        public int Collections { get; set; }
    }

    private class Neo4jHealthResponse
    {
        public string Status { get; set; } = string.Empty;
        public int ResponseTimeMs { get; set; }
        public int Nodes { get; set; }
        public int Relationships { get; set; }
    }

    private class OllamaHealthResponse
    {
        public string Status { get; set; } = string.Empty;
        public int ResponseTimeMs { get; set; }
        public string[] Models { get; set; } = Array.Empty<string>();
    }
}