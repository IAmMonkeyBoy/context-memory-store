using FluentAssertions;
using ContextMemoryStore.Infrastructure.Configuration;
using ContextMemoryStore.Tests.Common;

namespace ContextMemoryStore.Tests.Unit.Configuration.ApiOptionsTests;

/// <summary>
/// Tests for ApiOptions default values
/// </summary>
public class DefaultValueTests : TestBase
{
    [Fact]
    public void Constructor_SetsExpectedDefaultValues()
    {
        // Act
        var options = new ApiOptions();

        // Assert
        options.Host.Should().Be("0.0.0.0");
        options.Port.Should().Be(8080);
        options.CorsEnabled.Should().BeTrue();
        options.RateLimit.Should().Be(100);
        options.TimeoutSeconds.Should().Be(30);
    }

    [Fact]
    public void SectionName_HasExpectedValue()
    {
        // Act & Assert
        ApiOptions.SectionName.Should().Be("Api");
    }

    [Fact]
    public void Host_DefaultValue_IsValidForAllInterfaces()
    {
        // Arrange
        var options = new ApiOptions();

        // Act & Assert
        options.Host.Should().Be("0.0.0.0", "Default host should bind to all interfaces for containerized environments");
    }

    [Fact]
    public void Port_DefaultValue_IsStandardWebPort()
    {
        // Arrange
        var options = new ApiOptions();

        // Act & Assert
        options.Port.Should().Be(8080, "Default port should be 8080 for non-privileged web applications");
    }

    [Fact]
    public void CorsEnabled_DefaultValue_IsTrue()
    {
        // Arrange
        var options = new ApiOptions();

        // Act & Assert
        options.CorsEnabled.Should().BeTrue("CORS should be enabled by default for web API accessibility");
    }

    [Fact]
    public void RateLimit_DefaultValue_IsReasonable()
    {
        // Arrange
        var options = new ApiOptions();

        // Act & Assert
        options.RateLimit.Should().Be(100, "Default rate limit should allow reasonable API usage");
    }

    [Fact]
    public void TimeoutSeconds_DefaultValue_IsReasonable()
    {
        // Arrange
        var options = new ApiOptions();

        // Act & Assert
        options.TimeoutSeconds.Should().Be(30, "Default timeout should be reasonable for API operations");
    }

    [Fact]
    public void Properties_CanBeModified()
    {
        // Arrange
        var options = new ApiOptions();

        // Act
        options.Host = "localhost";
        options.Port = 9000;
        options.CorsEnabled = false;
        options.RateLimit = 200;
        options.TimeoutSeconds = 60;

        // Assert
        options.Host.Should().Be("localhost");
        options.Port.Should().Be(9000);
        options.CorsEnabled.Should().BeFalse();
        options.RateLimit.Should().Be(200);
        options.TimeoutSeconds.Should().Be(60);
    }
}