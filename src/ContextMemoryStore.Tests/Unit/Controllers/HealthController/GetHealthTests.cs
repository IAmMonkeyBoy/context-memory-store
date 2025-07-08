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
    private readonly Mock<HealthCheckService> _healthCheckServiceMock;
    private readonly Mock<IVectorStoreService> _vectorStoreServiceMock;
    private readonly Mock<IGraphStoreService> _graphStoreServiceMock;
    private readonly Mock<ILLMService> _llmServiceMock;

    public GetHealthTests()
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
    public async Task GetHealth_WhenHealthy_ReturnsOkWithHealthyStatus()
    {
        // Arrange
        var healthReport = new HealthReport(
            new Dictionary<string, HealthReportEntry>(),
            HealthStatus.Healthy,
            TimeSpan.FromMilliseconds(100));

        _healthCheckServiceMock
            .Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(healthReport);

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
        var healthReport = new HealthReport(
            new Dictionary<string, HealthReportEntry>(),
            HealthStatus.Unhealthy,
            TimeSpan.FromMilliseconds(100));

        _healthCheckServiceMock
            .Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(healthReport);

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
        // Arrange
        var healthReport = new HealthReport(
            new Dictionary<string, HealthReportEntry>(),
            HealthStatus.Degraded,
            TimeSpan.FromMilliseconds(100));

        _healthCheckServiceMock
            .Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(healthReport);

        var controller = CreateSubject();

        // Act
        var result = await controller.GetHealth();

        // Assert
        result.Should().BeOfType<ObjectResult>();
        
        var objectResult = result as ObjectResult;
        objectResult!.StatusCode.Should().Be(503);
    }

    [Fact]
    public async Task GetHealth_WhenExceptionThrown_ReturnsServiceUnavailableWithErrorResponse()
    {
        // Arrange
        var expectedException = new InvalidOperationException("Health check failed");
        
        _healthCheckServiceMock
            .Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(expectedException);

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
        var healthReport = new HealthReport(
            new Dictionary<string, HealthReportEntry>(),
            HealthStatus.Healthy,
            TimeSpan.FromMilliseconds(100));

        _healthCheckServiceMock
            .Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(healthReport);

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
        var healthReport = new HealthReport(
            new Dictionary<string, HealthReportEntry>(),
            HealthStatus.Healthy,
            TimeSpan.FromMilliseconds(100));

        _healthCheckServiceMock
            .Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(healthReport);

        // Setup logging expectation
        LoggerMock.Setup(x => x.Log(
            Microsoft.Extensions.Logging.LogLevel.Information,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Health check completed")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()));

        var controller = CreateSubject();

        // Act
        await controller.GetHealth();

        // Assert
        LoggerMock.Verify(x => x.Log(
            Microsoft.Extensions.Logging.LogLevel.Information,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Health check completed")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
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