using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using ContextMemoryStore.Api.Controllers;
using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Tests.Common;

namespace ContextMemoryStore.Tests.Unit.Controllers.HealthController;

/// <summary>
/// Tests for HealthController.GetDetailedHealth() method
/// </summary>
public class GetDetailedHealthTests : MethodTestBase<Api.Controllers.HealthController>
{
    private readonly Mock<IVectorStoreService> _vectorStoreServiceMock;
    private readonly Mock<IGraphStoreService> _graphStoreServiceMock;
    private readonly Mock<ILLMService> _llmServiceMock;

    public GetDetailedHealthTests()
    {
        _vectorStoreServiceMock = CreateMock<IVectorStoreService>();
        _graphStoreServiceMock = CreateMock<IGraphStoreService>();
        _llmServiceMock = CreateMock<ILLMService>();
    }

    protected override Api.Controllers.HealthController CreateSubject()
    {
        return new Api.Controllers.HealthController(
            _vectorStoreServiceMock.Object,
            _graphStoreServiceMock.Object,
            _llmServiceMock.Object,
            LoggerMock.Object);
    }

    [Fact]
    public async Task GetDetailedHealth_WhenAllServicesHealthy_ReturnsOkWithDetailedStatus()
    {
        // Arrange
        _vectorStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _vectorStoreServiceMock
            .Setup(x => x.GetCollectionCountAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(5);
        _vectorStoreServiceMock
            .Setup(x => x.GetVectorCountAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(100);

        _graphStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _graphStoreServiceMock
            .Setup(x => x.GetStatsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Core.Interfaces.GraphStats { NodeCount = 100, RelationshipCount = 50 });

        _llmServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _llmServiceMock
            .Setup(x => x.GetAvailableModelsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<string> { "llama3", "mxbai-embed-large" });

        // Setup logging expectations
        SetupLogging(LogLevel.Information, "Detailed health check completed");

        var controller = CreateSubject();

        // Act
        var result = await controller.GetDetailedHealth();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        
        var okResult = result as OkObjectResult;
        var responseType = okResult!.Value!.GetType();
        
        // Verify dependencies section exists
        var dependencies = responseType.GetProperty("dependencies")?.GetValue(okResult.Value);
        dependencies.Should().NotBeNull();
    }

    [Fact]
    public async Task GetDetailedHealth_WhenQdrantUnhealthy_ReturnsServiceUnavailable()
    {
        // Arrange
        _vectorStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _graphStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _graphStoreServiceMock
            .Setup(x => x.GetStatsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Core.Interfaces.GraphStats { NodeCount = 100, RelationshipCount = 50 });

        _llmServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _llmServiceMock
            .Setup(x => x.GetAvailableModelsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<string> { "llama3" });

        // Setup logging expectations
        SetupLogging(LogLevel.Information, "Detailed health check completed");

        var controller = CreateSubject();

        // Act
        var result = await controller.GetDetailedHealth();

        // Assert
        result.Should().BeOfType<ObjectResult>();
        
        var objectResult = result as ObjectResult;
        objectResult!.StatusCode.Should().Be(503);
    }

    [Fact]
    public async Task GetDetailedHealth_WhenQdrantThrowsException_HandlesGracefully()
    {
        // Arrange
        _vectorStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Qdrant connection failed"));

        _graphStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _graphStoreServiceMock
            .Setup(x => x.GetStatsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Core.Interfaces.GraphStats { NodeCount = 100, RelationshipCount = 50 });

        _llmServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _llmServiceMock
            .Setup(x => x.GetAvailableModelsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<string> { "llama3" });

        // Setup logging expectations
        SetupLogging(LogLevel.Warning, "Qdrant health check failed");
        SetupLogging(LogLevel.Information, "Detailed health check completed");

        var controller = CreateSubject();

        // Act
        var result = await controller.GetDetailedHealth();

        // Assert
        result.Should().BeOfType<ObjectResult>();
        
        // Should return service unavailable when exception is thrown
        var objectResult = result as ObjectResult;
        objectResult!.StatusCode.Should().Be(503);
    }

    [Fact]
    public async Task GetDetailedHealth_IncludesAllDependencyChecks()
    {
        // Arrange
        _vectorStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _vectorStoreServiceMock
            .Setup(x => x.GetCollectionCountAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(3);
        _vectorStoreServiceMock
            .Setup(x => x.GetVectorCountAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(150);

        _graphStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _graphStoreServiceMock
            .Setup(x => x.GetStatsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Core.Interfaces.GraphStats { NodeCount = 200, RelationshipCount = 100 });

        _llmServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _llmServiceMock
            .Setup(x => x.GetAvailableModelsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<string> { "llama3", "mxbai-embed-large" });

        // Setup logging expectations
        SetupLogging(LogLevel.Information, "Detailed health check completed");

        var controller = CreateSubject();

        // Act
        var result = await controller.GetDetailedHealth();

        // Assert
        _vectorStoreServiceMock.Verify(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()), Times.Once);
        _vectorStoreServiceMock.Verify(x => x.GetCollectionCountAsync(It.IsAny<CancellationToken>()), Times.Once);
        
        _graphStoreServiceMock.Verify(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()), Times.Once);
        _graphStoreServiceMock.Verify(x => x.GetStatsAsync(It.IsAny<CancellationToken>()), Times.Once);
        
        _llmServiceMock.Verify(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()), Times.Once);
        _llmServiceMock.Verify(x => x.GetAvailableModelsAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetDetailedHealth_WhenMultipleServicesThrowExceptions_ReturnsServiceUnavailable()
    {
        // Arrange
        _vectorStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Vector store failed"));
        
        _graphStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Graph store failed"));
        
        _llmServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _llmServiceMock
            .Setup(x => x.GetAvailableModelsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<string> { "llama3" });

        // Setup logging expectations for warnings and errors
        SetupLogging(LogLevel.Warning, "Qdrant health check failed");
        SetupLogging(LogLevel.Warning, "Neo4j health check failed");
        SetupLogging(LogLevel.Information, "Detailed health check completed");

        var controller = CreateSubject();

        // Act
        var result = await controller.GetDetailedHealth();

        // Assert
        result.Should().BeOfType<ObjectResult>();
        
        var objectResult = result as ObjectResult;
        objectResult!.StatusCode.Should().Be(503);
        
        // Since individual service failures are handled gracefully,
        // the response should have status="unhealthy" but no overall error field
        var response = objectResult.Value!.GetType().GetProperty("status")?.GetValue(objectResult.Value);
        response.Should().Be("unhealthy");
        
        // Verify dependencies section shows failed services
        var dependencies = objectResult.Value!.GetType().GetProperty("dependencies")?.GetValue(objectResult.Value);
        dependencies.Should().NotBeNull();
    }

    protected override void VerifyMocks()
    {
        _vectorStoreServiceMock.VerifyAll();
        _graphStoreServiceMock.VerifyAll();
        _llmServiceMock.VerifyAll();
        base.VerifyMocks();
    }
}