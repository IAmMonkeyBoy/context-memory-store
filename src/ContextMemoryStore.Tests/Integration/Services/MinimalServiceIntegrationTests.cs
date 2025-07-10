using ContextMemoryStore.Tests.Common;
using ContextMemoryStore.Infrastructure.Services;
using ContextMemoryStore.Infrastructure.Configuration;
using ContextMemoryStore.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Xunit;

namespace ContextMemoryStore.Tests.Integration.Services;

/// <summary>
/// Minimal service integration tests that verify basic service functionality.
/// These tests focus on service health checks and basic interface validation.
/// </summary>
[Trait(TestTraits.Category, TestCategories.ServiceIntegration)]
[Trait(TestTraits.Service, "Minimal")]
[Trait(TestTraits.Duration, "Short")]
public class MinimalServiceIntegrationTests : ServiceIntegrationTestBase
{
    protected override bool RequiresQdrant() => true;
    protected override bool RequiresNeo4j() => true;
    protected override bool RequiresOllama() => false;

    [Fact]
    public async Task ServiceHealthChecks_ShouldSucceed()
    {
        // Arrange - Services should be available from DI container
        var vectorStore = Services.GetService<IVectorStoreService>();
        var graphStore = Services.GetService<IGraphStoreService>();

        // Act & Assert - Services should be healthy
        if (vectorStore != null)
        {
            var vectorHealth = await vectorStore.IsHealthyAsync();
            vectorHealth.Should().BeTrue("Vector store should be healthy with container");
        }

        if (graphStore != null)
        {
            var graphHealth = await graphStore.IsHealthyAsync();
            graphHealth.Should().BeTrue("Graph store should be healthy with container");
        }

        Logger.LogInformation("Service health checks completed successfully");
    }

    [Fact]
    public async Task VectorStoreBasicOperations_ShouldWork()
    {
        // Arrange
        var vectorStore = Services.GetService<IVectorStoreService>();
        vectorStore.Should().NotBeNull("Vector store service should be available");

        // Act - Test basic vector count operation
        var count = await vectorStore!.GetVectorCountAsync();

        // Assert
        count.Should().BeGreaterThanOrEqualTo(0, "Vector count should be non-negative");

        Logger.LogInformation("Vector store basic operations verified");
    }

    [Fact]
    public async Task GraphStoreBasicOperations_ShouldWork()
    {
        // Arrange
        var graphStore = Services.GetService<IGraphStoreService>();
        graphStore.Should().NotBeNull("Graph store service should be available");

        // Act - Test basic stats operation
        var stats = await graphStore!.GetStatsAsync();

        // Assert
        stats.Should().NotBeNull("Graph stats should be available");
        stats.NodeCount.Should().BeGreaterThanOrEqualTo(0, "Node count should be non-negative");
        stats.RelationshipCount.Should().BeGreaterThanOrEqualTo(0, "Relationship count should be non-negative");

        Logger.LogInformation("Graph store basic operations verified");
    }

    [Fact]
    public void ServiceRegistration_ShouldBeConfiguredCorrectly()
    {
        // Act - Try to resolve all required services
        var vectorStore = Services.GetService<IVectorStoreService>();
        var graphStore = Services.GetService<IGraphStoreService>();
        var llmService = Services.GetService<ILLMService>();

        // Assert - Services should be registered (even if LLM is mocked)
        vectorStore.Should().NotBeNull("Vector store service should be registered");
        graphStore.Should().NotBeNull("Graph store service should be registered");
        llmService.Should().NotBeNull("LLM service should be registered");

        Logger.LogInformation("Service registration verification completed");
    }
}