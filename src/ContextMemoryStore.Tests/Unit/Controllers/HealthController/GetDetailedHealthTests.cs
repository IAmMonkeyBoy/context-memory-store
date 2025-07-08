using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;
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
    private readonly Mock<HealthCheckService> _healthCheckServiceMock;
    private readonly Mock<IVectorStoreService> _vectorStoreServiceMock;
    private readonly Mock<IGraphStoreService> _graphStoreServiceMock;
    private readonly Mock<ILLMService> _llmServiceMock;

    public GetDetailedHealthTests()
    {
        _healthCheckServiceMock = CreateMock<HealthCheckService>();
        _vectorStoreServiceMock = CreateMock<IVectorStoreService>();
        _graphStoreServiceMock = CreateMock<IGraphStoreService>();
        _llmServiceMock = CreateMock<ILLMService>();
    }

    protected override Api.Controllers.HealthController CreateSubject()
    {
        return new Api.Controllers.HealthController(
            _healthCheckServiceMock.Object,
            _vectorStoreServiceMock.Object,
            _graphStoreServiceMock.Object,
            _llmServiceMock.Object,
            LoggerMock.Object);
    }

    [Fact]
    public async Task GetDetailedHealth_WhenAllServicesHealthy_ReturnsOkWithDetailedStatus()
    {
        // Arrange
        var healthReport = new HealthReport(
            new Dictionary<string, HealthReportEntry>(),
            HealthStatus.Healthy,
            TimeSpan.FromMilliseconds(100));

        _healthCheckServiceMock
            .Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(healthReport);

        _vectorStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _vectorStoreServiceMock
            .Setup(x => x.GetCollectionCountAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(5);

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
        var healthReport = new HealthReport(
            new Dictionary<string, HealthReportEntry>(),
            HealthStatus.Unhealthy,
            TimeSpan.FromMilliseconds(100));

        _healthCheckServiceMock
            .Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(healthReport);

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
        var healthReport = new HealthReport(
            new Dictionary<string, HealthReportEntry>(),
            HealthStatus.Healthy,
            TimeSpan.FromMilliseconds(100));

        _healthCheckServiceMock
            .Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(healthReport);

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

        var controller = CreateSubject();

        // Act
        var result = await controller.GetDetailedHealth();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        
        // Should still return OK but with unhealthy Qdrant status
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
    }

    [Fact]
    public async Task GetDetailedHealth_IncludesAllDependencyChecks()
    {
        // Arrange
        var healthReport = new HealthReport(
            new Dictionary<string, HealthReportEntry>(),
            HealthStatus.Healthy,
            TimeSpan.FromMilliseconds(100));

        _healthCheckServiceMock
            .Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(healthReport);

        _vectorStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _vectorStoreServiceMock
            .Setup(x => x.GetCollectionCountAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(3);

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
    public async Task GetDetailedHealth_WhenOverallHealthCheckFails_ReturnsServiceUnavailable()
    {
        // Arrange
        _healthCheckServiceMock
            .Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Overall health check failed"));

        var controller = CreateSubject();

        // Act
        var result = await controller.GetDetailedHealth();

        // Assert
        result.Should().BeOfType<ObjectResult>();
        
        var objectResult = result as ObjectResult;
        objectResult!.StatusCode.Should().Be(503);
        
        var response = objectResult.Value!.GetType().GetProperty("error")?.GetValue(objectResult.Value);
        response.Should().Be("Detailed health check failed");
    }

    protected override void VerifyMocks()
    {
        _healthCheckServiceMock.VerifyAll();
        _vectorStoreServiceMock.VerifyAll();
        _graphStoreServiceMock.VerifyAll();
        _llmServiceMock.VerifyAll();
        base.VerifyMocks();
    }
}