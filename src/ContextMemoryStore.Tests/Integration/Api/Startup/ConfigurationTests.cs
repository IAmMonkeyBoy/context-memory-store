using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using FluentAssertions;
using ContextMemoryStore.Api;
using ContextMemoryStore.Infrastructure.Configuration;
using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Tests.Common;

namespace ContextMemoryStore.Tests.Integration.Api.Startup;

/// <summary>
/// Integration tests for application configuration and startup
/// </summary>
public class ConfigurationTests : IntegrationTestBase
{
    public ConfigurationTests(WebApplicationFactory<Program> factory) : base(factory)
    {
    }

    [Fact]
    public void Startup_ConfiguresAllRequiredServices()
    {
        // Act & Assert - Services should be registered correctly
        Services.GetRequiredService<IVectorStoreService>().Should().NotBeNull();
        Services.GetRequiredService<IGraphStoreService>().Should().NotBeNull();
        Services.GetRequiredService<ILLMService>().Should().NotBeNull();
        Services.GetRequiredService<IMemoryService>().Should().NotBeNull();
    }

    [Fact]
    public void Startup_ConfiguresAllOptionClasses()
    {
        // Act & Assert - All option classes should be configured
        Services.GetRequiredService<IOptions<ProjectOptions>>().Should().NotBeNull();
        Services.GetRequiredService<IOptions<ApiOptions>>().Should().NotBeNull();
        Services.GetRequiredService<IOptions<QdrantOptions>>().Should().NotBeNull();
        Services.GetRequiredService<IOptions<Neo4jOptions>>().Should().NotBeNull();
        Services.GetRequiredService<IOptions<OllamaOptions>>().Should().NotBeNull();
        Services.GetRequiredService<IOptions<MemoryOptions>>().Should().NotBeNull();
        Services.GetRequiredService<IOptions<ProcessingOptions>>().Should().NotBeNull();
        Services.GetRequiredService<IOptions<PrometheusOptions>>().Should().NotBeNull();
        Services.GetRequiredService<IOptions<PerformanceOptions>>().Should().NotBeNull();
        Services.GetRequiredService<IOptions<FeaturesOptions>>().Should().NotBeNull();
    }

    [Fact]
    public void Configuration_LoadsProjectOptionsCorrectly()
    {
        // Act
        var projectOptions = Services.GetRequiredService<IOptions<ProjectOptions>>().Value;

        // Assert
        projectOptions.Should().NotBeNull();
        projectOptions.Name.Should().NotBeNullOrEmpty();
        projectOptions.Description.Should().NotBeNullOrEmpty();
        projectOptions.Version.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Configuration_LoadsApiOptionsCorrectly()
    {
        // Act
        var apiOptions = Services.GetRequiredService<IOptions<ApiOptions>>().Value;

        // Assert
        apiOptions.Should().NotBeNull();
        apiOptions.Host.Should().NotBeNullOrEmpty();
        apiOptions.Port.Should().BeGreaterThan(0);
        apiOptions.TimeoutSeconds.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Configuration_LoadsQdrantOptionsCorrectly()
    {
        // Act
        var qdrantOptions = Services.GetRequiredService<IOptions<QdrantOptions>>().Value;

        // Assert
        qdrantOptions.Should().NotBeNull();
        qdrantOptions.Host.Should().NotBeNullOrEmpty();
        qdrantOptions.Port.Should().BeGreaterThan(0);
        qdrantOptions.CollectionName.Should().NotBeNullOrEmpty();
        qdrantOptions.VectorSize.Should().BeGreaterThan(0);
        qdrantOptions.Distance.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Configuration_LoadsNeo4jOptionsCorrectly()
    {
        // Act
        var neo4jOptions = Services.GetRequiredService<IOptions<Neo4jOptions>>().Value;

        // Assert
        neo4jOptions.Should().NotBeNull();
        neo4jOptions.Uri.Should().NotBeNullOrEmpty();
        neo4jOptions.Username.Should().NotBeNullOrEmpty();
        neo4jOptions.Password.Should().NotBeNullOrEmpty();
        neo4jOptions.ConnectionTimeoutSeconds.Should().BeGreaterThan(0);
        neo4jOptions.MaxConnectionPoolSize.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Configuration_LoadsOllamaOptionsCorrectly()
    {
        // Act
        var ollamaOptions = Services.GetRequiredService<IOptions<OllamaOptions>>().Value;

        // Assert
        ollamaOptions.Should().NotBeNull();
        ollamaOptions.BaseUrl.Should().NotBeNullOrEmpty();
        ollamaOptions.ChatModel.Should().NotBeNullOrEmpty();
        ollamaOptions.EmbeddingModel.Should().NotBeNullOrEmpty();
        ollamaOptions.TimeoutSeconds.Should().BeGreaterThan(0);
        ollamaOptions.MaxTokens.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Configuration_LoadsMemoryOptionsCorrectly()
    {
        // Act
        var memoryOptions = Services.GetRequiredService<IOptions<MemoryOptions>>().Value;

        // Assert
        memoryOptions.Should().NotBeNull();
        memoryOptions.MaxDocuments.Should().BeGreaterThan(0);
        memoryOptions.CleanupIntervalHours.Should().BeGreaterThan(0);
        memoryOptions.SummaryIntervalMinutes.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Configuration_LoadsProcessingOptionsCorrectly()
    {
        // Act
        var processingOptions = Services.GetRequiredService<IOptions<ProcessingOptions>>().Value;

        // Assert
        processingOptions.Should().NotBeNull();
        processingOptions.SupportedFormats.Should().NotBeNullOrEmpty();
        processingOptions.MaxFileSizeMb.Should().BeGreaterThan(0);
        processingOptions.ChunkSize.Should().BeGreaterThan(0);
        processingOptions.ChunkOverlap.Should().BeGreaterThanOrEqualTo(0);
        processingOptions.MinDocumentLength.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Configuration_LoadsPrometheusOptionsCorrectly()
    {
        // Act
        var prometheusOptions = Services.GetRequiredService<IOptions<PrometheusOptions>>().Value;

        // Assert
        prometheusOptions.Should().NotBeNull();
        prometheusOptions.MetricsPath.Should().NotBeNullOrEmpty();
        prometheusOptions.MetricPrefix.Should().NotBeNullOrEmpty();
        prometheusOptions.Port.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public void Configuration_LoadsPerformanceOptionsCorrectly()
    {
        // Act
        var performanceOptions = Services.GetRequiredService<IOptions<PerformanceOptions>>().Value;

        // Assert
        performanceOptions.Should().NotBeNull();
        performanceOptions.WorkerThreads.Should().BeGreaterThan(0);
        performanceOptions.BatchSize.Should().BeGreaterThan(0);
        performanceOptions.ConnectionPoolSize.Should().BeGreaterThan(0);
        performanceOptions.CacheSize.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Configuration_LoadsFeaturesOptionsCorrectly()
    {
        // Act
        var featuresOptions = Services.GetRequiredService<IOptions<FeaturesOptions>>().Value;

        // Assert
        featuresOptions.Should().NotBeNull();
        // Feature flags should have boolean values (no null checks needed)
    }

    [Fact]
    public void Configuration_SectionNamesMatchExpectedValues()
    {
        // Assert - Verify section names are correct
        ProjectOptions.SectionName.Should().Be("Project");
        ApiOptions.SectionName.Should().Be("Api");
        QdrantOptions.SectionName.Should().Be("Qdrant");
        Neo4jOptions.SectionName.Should().Be("Neo4j");
        OllamaOptions.SectionName.Should().Be("Ollama");
        MemoryOptions.SectionName.Should().Be("Memory");
        ProcessingOptions.SectionName.Should().Be("Processing");
        PrometheusOptions.SectionName.Should().Be("Prometheus");
        PerformanceOptions.SectionName.Should().Be("Performance");
        FeaturesOptions.SectionName.Should().Be("Features");
    }
}