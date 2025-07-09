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
/// Tests for HealthController.GetHealth() method
/// </summary>
public class GetHealthTests : MethodTestBase<Api.Controllers.HealthController>
{
    private readonly Mock<IVectorStoreService> _vectorStoreServiceMock;
    private readonly Mock<IGraphStoreService> _graphStoreServiceMock;
    private readonly Mock<ILLMService> _llmServiceMock;

    public GetHealthTests()
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
    public async Task GetHealth_WhenHealthy_ReturnsOkWithHealthyStatus()
    {
        // Arrange
        _vectorStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        
        _graphStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        
        _llmServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Setup logging expectations
        SetupLogging(LogLevel.Debug, "Starting basic health check");
        SetupLogging(LogLevel.Information, "Health check completed");

        var controller = CreateSubject();

        // Act
        var result = await controller.GetHealth();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        
        var okResult = result as OkObjectResult;
        okResult!.Value.Should().NotBeNull();
        
        // Verify the response structure
        var response = okResult.Value!.GetType().GetProperty("status")?.GetValue(okResult.Value);
        response.Should().Be("healthy");
    }

    [Fact]
    public async Task GetHealth_WhenUnhealthy_ReturnsServiceUnavailableWithUnhealthyStatus()
    {
        // Arrange
        _vectorStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        
        _graphStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        
        _llmServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Setup logging expectations
        SetupLogging(LogLevel.Debug, "Starting basic health check");
        SetupLogging(LogLevel.Information, "Health check completed");

        var controller = CreateSubject();

        // Act
        var result = await controller.GetHealth();

        // Assert
        result.Should().BeOfType<ObjectResult>();
        
        var objectResult = result as ObjectResult;
        objectResult!.StatusCode.Should().Be(503);
        
        var response = objectResult.Value!.GetType().GetProperty("status")?.GetValue(objectResult.Value);
        response.Should().Be("unhealthy");
    }

    [Fact]
    public async Task GetHealth_WhenDegraded_ReturnsServiceUnavailableWithUnhealthyStatus()
    {
        // Arrange - Some services healthy, some unhealthy (degraded state)
        _vectorStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        
        _graphStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        
        _llmServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Setup logging expectations
        SetupLogging(LogLevel.Debug, "Starting basic health check");
        SetupLogging(LogLevel.Information, "Health check completed");

        var controller = CreateSubject();

        // Act
        var result = await controller.GetHealth();

        // Assert
        result.Should().BeOfType<ObjectResult>();
        
        var objectResult = result as ObjectResult;
        objectResult!.StatusCode.Should().Be(503);
        
        var response = objectResult.Value!.GetType().GetProperty("status")?.GetValue(objectResult.Value);
        response.Should().Be("unhealthy");
    }

    [Fact]
    public async Task GetHealth_WhenExceptionThrown_ReturnsServiceUnavailableWithErrorResponse()
    {
        // Arrange
        var expectedException = new InvalidOperationException("Health check failed");
        
        _vectorStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(expectedException);
        
        _graphStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        
        _llmServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Setup logging expectations
        SetupLogging(LogLevel.Debug, "Starting basic health check");
        SetupLogging(LogLevel.Error, "Health check failed");

        var controller = CreateSubject();

        // Act
        var result = await controller.GetHealth();

        // Assert
        result.Should().BeOfType<ObjectResult>();
        
        var objectResult = result as ObjectResult;
        objectResult!.StatusCode.Should().Be(503);
        
        var response = objectResult.Value!.GetType().GetProperty("status")?.GetValue(objectResult.Value);
        response.Should().Be("unhealthy");
        
        var error = objectResult.Value!.GetType().GetProperty("error")?.GetValue(objectResult.Value);
        error.Should().Be("Health check failed");
    }

    [Fact]
    public async Task GetHealth_ReturnsResponseWithRequiredProperties()
    {
        // Arrange
        _vectorStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        
        _graphStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        
        _llmServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Setup logging expectations
        SetupLogging(LogLevel.Debug, "Starting basic health check");
        SetupLogging(LogLevel.Information, "Health check completed");

        var controller = CreateSubject();

        // Act
        var result = await controller.GetHealth();

        // Assert
        var okResult = result as OkObjectResult;
        var responseType = okResult!.Value!.GetType();
        
        // Verify all required properties are present
        responseType.GetProperty("status").Should().NotBeNull();
        responseType.GetProperty("timestamp").Should().NotBeNull();
        responseType.GetProperty("version").Should().NotBeNull();
        responseType.GetProperty("uptime_seconds").Should().NotBeNull();
    }

    [Fact]
    public async Task GetHealth_LogsHealthCheckCompletion()
    {
        // Arrange
        _vectorStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        
        _graphStoreServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        
        _llmServiceMock
            .Setup(x => x.IsHealthyAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Setup logging expectations
        SetupLogging(LogLevel.Debug, "Starting basic health check");
        SetupLogging(LogLevel.Information, "Health check completed");

        var controller = CreateSubject();

        // Act
        await controller.GetHealth();

        // Assert
        VerifyLogging(LogLevel.Information, "Health check completed", Times.Once());
    }

    protected override void VerifyMocks()
    {
        _vectorStoreServiceMock.VerifyAll();
        _graphStoreServiceMock.VerifyAll();
        _llmServiceMock.VerifyAll();
        base.VerifyMocks();
    }
}