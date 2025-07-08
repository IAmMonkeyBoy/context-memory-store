using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using FluentAssertions;
using ContextMemoryStore.Api;
using ContextMemoryStore.Tests.Common;

namespace ContextMemoryStore.Tests.Integration.Controllers.HealthController;

/// <summary>
/// Integration tests for GET /health endpoint
/// </summary>
public class GetHealthEndpointTests : IntegrationTestBase
{
    public GetHealthEndpointTests(WebApplicationFactory<Program> factory) : base(factory)
    {
    }

    [Fact]
    public async Task GetHealth_ReturnsOkWithValidStructure()
    {
        // Act
        var response = await Client.GetAsync("/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();

        // Verify JSON structure
        var healthResponse = await response.Content.ReadFromJsonAsync<HealthResponse>();
        healthResponse.Should().NotBeNull();
        healthResponse!.Status.Should().Be("healthy");
        healthResponse.Timestamp.Should().NotBeNullOrEmpty();
        healthResponse.Version.Should().NotBeNullOrEmpty();
        healthResponse.UptimeSeconds.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetHealth_V1Endpoint_ReturnsOkWithValidStructure()
    {
        // Act
        var response = await Client.GetAsync("/v1/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var healthResponse = await response.Content.ReadFromJsonAsync<HealthResponse>();
        healthResponse.Should().NotBeNull();
        healthResponse!.Status.Should().Be("healthy");
    }

    [Fact]
    public async Task GetHealth_ReturnsConsistentVersionNumber()
    {
        // Act
        var response1 = await Client.GetAsync("/health");
        var response2 = await Client.GetAsync("/health");

        // Assert
        var health1 = await response1.Content.ReadFromJsonAsync<HealthResponse>();
        var health2 = await response2.Content.ReadFromJsonAsync<HealthResponse>();

        health1!.Version.Should().Be(health2!.Version);
        health1.Version.Should().Be("1.0.0");
    }

    [Fact]
    public async Task GetHealth_ReturnsIncreasingUptime()
    {
        // Act
        var response1 = await Client.GetAsync("/health");
        await Task.Delay(1000); // Wait 1 second
        var response2 = await Client.GetAsync("/health");

        // Assert
        var health1 = await response1.Content.ReadFromJsonAsync<HealthResponse>();
        var health2 = await response2.Content.ReadFromJsonAsync<HealthResponse>();

        health2!.UptimeSeconds.Should().BeGreaterThan(health1!.UptimeSeconds);
    }

    [Fact]
    public async Task GetHealth_MultipleRequests_AllReturnSuccess()
    {
        // Act & Assert
        var tasks = Enumerable.Range(0, 5).Select(async _ =>
        {
            var response = await Client.GetAsync("/health");
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var health = await response.Content.ReadFromJsonAsync<HealthResponse>();
            health.Should().NotBeNull();
            health!.Status.Should().Be("healthy");
        });

        await Task.WhenAll(tasks);
    }

    [Fact]
    public async Task GetHealth_ReturnsValidTimestamp()
    {
        // Arrange
        var beforeRequest = DateTime.UtcNow;

        // Act
        var response = await Client.GetAsync("/health");
        var afterRequest = DateTime.UtcNow;

        // Assert
        var health = await response.Content.ReadFromJsonAsync<HealthResponse>();
        
        var timestamp = DateTime.Parse(health!.Timestamp);
        timestamp.Should().BeOnOrAfter(beforeRequest.AddSeconds(-1)); // Allow 1 second tolerance
        timestamp.Should().BeOnOrBefore(afterRequest.AddSeconds(1));
    }

    [Fact]
    public async Task GetHealth_WithAcceptHeader_ReturnsJsonContentType()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Get, "/health");
        request.Headers.Add("Accept", "application/json");

        // Act
        var response = await Client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    /// <summary>
    /// Response model for health endpoint
    /// </summary>
    private class HealthResponse
    {
        public string Status { get; set; } = string.Empty;
        public string Timestamp { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public long UptimeSeconds { get; set; }
    }
}