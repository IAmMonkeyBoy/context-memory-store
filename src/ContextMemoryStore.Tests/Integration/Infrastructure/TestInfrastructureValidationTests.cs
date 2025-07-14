using ContextMemoryStore.Tests.Common;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace ContextMemoryStore.Tests.Integration.Infrastructure;

/// <summary>
/// Validates that the integration test infrastructure is working correctly.
/// These tests verify the test infrastructure itself rather than application functionality.
/// </summary>
[Trait(TestTraits.Category, TestCategories.Integration)]
[Trait(TestTraits.Service, "Infrastructure")]
[Collection("SerializedIntegrationTests")]
public class TestInfrastructureValidationTests : ServiceIntegrationTestBase
{
    private readonly TestDataManager _testDataManager;
    private TestCleanupHelper? _cleanupHelper;

    public TestInfrastructureValidationTests()
    {
        _testDataManager = new TestDataManager();
    }

    private TestCleanupHelper GetCleanupHelper()
    {
        return _cleanupHelper ??= new TestCleanupHelper(HttpClient, Services.GetRequiredService<ILogger<TestCleanupHelper>>());
    }

    protected override bool RequiresQdrant() => false; // Test infrastructure without containers first
    protected override bool RequiresNeo4j() => false;

    [Fact]
    public async Task HttpClient_ShouldBeConfigured()
    {
        // Arrange & Act
        var response = await HttpClient.GetAsync("/health");

        // Assert
        response.Should().NotBeNull();
        Logger.Should().NotBeNull();
        Services.Should().NotBeNull();
    }

    [Fact]
    public async Task TestDataManager_ShouldGenerateUniqueCollectionNames()
    {
        // Arrange & Act
        var name1 = _testDataManager.GenerateTestCollectionName();
        var name2 = _testDataManager.GenerateTestCollectionName();

        // Assert
        name1.Should().NotBeNullOrEmpty();
        name2.Should().NotBeNullOrEmpty();
        name1.Should().NotBe(name2);
        name1.Should().StartWith("test_collection_");
        name2.Should().StartWith("test_collection_");
    }

    [Fact]
    public void TestDataManager_ShouldCreateTestDocuments()
    {
        // Arrange & Act
        var documents = _testDataManager.CreateTestDocuments(3);

        // Assert
        documents.Should().HaveCount(3);
        documents.Should().AllSatisfy(doc =>
        {
            doc.Should().NotBeNull();
            doc.Content.Should().NotBeNullOrEmpty();
            doc.Metadata.Should().ContainKey("test_id");
            doc.Metadata.Should().ContainKey("collection");
        });
    }

    [Fact]
    public void TestDataManager_ShouldCreateTestVectors()
    {
        // Arrange & Act
        var vectors = _testDataManager.CreateTestVectors(3, 1024);

        // Assert
        vectors.Should().HaveCount(3);
        vectors.Should().AllSatisfy(vector =>
        {
            vector.Should().HaveCount(1024);
            vector.Should().AllSatisfy(value => value.Should().BeInRange(-1f, 1f));
        });
    }

    [Fact]
    public void TestDataManager_ShouldCreateTestGraphData()
    {
        // Arrange & Act
        var graphData = _testDataManager.CreateTestGraphData(5, 3);

        // Assert
        graphData.Should().NotBeNull();
        graphData.Nodes.Should().HaveCount(5);
        graphData.Relationships.Should().HaveCount(3);

        graphData.Nodes.Should().AllSatisfy(node =>
        {
            node.Id.Should().NotBeNullOrEmpty();
            node.Label.Should().Be("TestDocument");
            node.Properties.Should().ContainKey("title");
        });

        graphData.Relationships.Should().AllSatisfy(rel =>
        {
            rel.FromNodeId.Should().NotBeNullOrEmpty();
            rel.ToNodeId.Should().NotBeNullOrEmpty();
            rel.Type.Should().Be("REFERENCES");
        });
    }

    [Fact]
    public void TestDataManager_ShouldTrackCreatedResources()
    {
        // Arrange
        var initialCollections = _testDataManager.GetCreatedCollections().Count;
        var initialNodes = _testDataManager.GetCreatedGraphNodes().Count;

        // Act
        _testDataManager.GenerateTestCollectionName();
        _testDataManager.GenerateTestNodeId();

        // Assert
        _testDataManager.GetCreatedCollections().Should().HaveCount(initialCollections + 1);
        _testDataManager.GetCreatedGraphNodes().Should().HaveCount(initialNodes + 1);
    }

    [Fact]
    public async Task CleanupHelper_ShouldHandleMissingEndpoints()
    {
        // Arrange
        var collections = new[] { "test_collection_1", "test_collection_2" };
        var nodes = new[] { "test_node_1", "test_node_2" };

        // Act & Assert - Should not throw
        var cleanupHelper = GetCleanupHelper();
        await cleanupHelper.CleanupQdrantCollections(collections);
        await cleanupHelper.CleanupNeo4jNodes(nodes);
        await cleanupHelper.PerformComprehensiveCleanup(_testDataManager);
    }

    [Fact]
    public async Task WaitForServiceReadiness_ShouldTimeoutGracefully()
    {
        // Arrange
        var nonExistentEndpoint = "/non-existent-service";

        // Act & Assert
        var act = async () => await WaitForServiceReadiness(nonExistentEndpoint, TimeSpan.FromSeconds(1));
        await act.Should().ThrowAsync<TimeoutException>();
    }

    [Fact]
    public async Task ServiceProvider_ShouldProvideRequiredServices()
    {
        // Arrange & Act
        var logger = Services.GetService<ILogger<TestInfrastructureValidationTests>>();
        var loggerFactory = Services.GetService<ILoggerFactory>();

        // Assert
        logger.Should().NotBeNull();
        loggerFactory.Should().NotBeNull();
    }

    [Fact]
    public void IntegrationTestConfiguration_ShouldLoadFromConfig()
    {
        // Arrange & Act
        var config = Services.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
        var testConfig = IntegrationTestConfiguration.FromConfiguration(config);

        // Assert
        testConfig.Should().NotBeNull();
        testConfig.ContainerStartupTimeout.Should().BePositive();
        testConfig.ServiceReadinessTimeout.Should().BePositive();
        testConfig.CleanupTimeout.Should().BePositive();
    }

    public override async Task DisposeAsync()
    {
        await GetCleanupHelper().PerformComprehensiveCleanup(_testDataManager);
        await base.DisposeAsync();
    }
}