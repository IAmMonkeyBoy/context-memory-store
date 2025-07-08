using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using ContextMemoryStore.Infrastructure.Configuration;
using ContextMemoryStore.Tests.Common;

namespace ContextMemoryStore.Tests.Unit.Configuration.ApiOptionsTests;

/// <summary>
/// Tests for ApiOptions validation behavior
/// </summary>
public class ValidationTests : TestBase
{
    [Fact]
    public void Validate_WithValidPort_PassesValidation()
    {
        // Arrange
        var options = new ApiOptions
        {
            Host = "localhost",
            Port = 8080,
            CorsEnabled = true,
            RateLimit = 100,
            TimeoutSeconds = 30
        };

        // Act
        var validationResults = ValidateModel(options);

        // Assert
        validationResults.Should().BeEmpty();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(65536)]
    [InlineData(99999)]
    public void Validate_WithInvalidPort_FailsValidation(int invalidPort)
    {
        // Arrange
        var options = new ApiOptions
        {
            Host = "localhost",
            Port = invalidPort,
            CorsEnabled = true,
            RateLimit = 100,
            TimeoutSeconds = 30
        };

        // Act
        var validationResults = ValidateModel(options);

        // Assert
        validationResults.Should().NotBeEmpty();
        validationResults.Should().Contain(r => r.ErrorMessage!.Contains("Port must be between 1 and 65535"));
    }

    [Theory]
    [InlineData(1)]
    [InlineData(80)]
    [InlineData(8080)]
    [InlineData(65535)]
    public void Validate_WithValidPortRange_PassesValidation(int validPort)
    {
        // Arrange
        var options = new ApiOptions
        {
            Host = "localhost",
            Port = validPort,
            CorsEnabled = true,
            RateLimit = 100,
            TimeoutSeconds = 30
        };

        // Act
        var validationResults = ValidateModel(options);

        // Assert
        validationResults.Should().BeEmpty();
    }

    [Fact]
    public void Validate_WithAllDefaultValues_PassesValidation()
    {
        // Arrange
        var options = new ApiOptions(); // Uses all default values

        // Act
        var validationResults = ValidateModel(options);

        // Assert
        validationResults.Should().BeEmpty();
    }

    [Fact]
    public void Validate_WithNullHost_PassesValidation()
    {
        // Arrange
        var options = new ApiOptions
        {
            Host = null!, // Test null host
            Port = 8080,
            CorsEnabled = true,
            RateLimit = 100,
            TimeoutSeconds = 30
        };

        // Act
        var validationResults = ValidateModel(options);

        // Assert
        validationResults.Should().BeEmpty(); // Host is not marked as required
    }

    [Fact]
    public void Validate_WithEmptyHost_PassesValidation()
    {
        // Arrange
        var options = new ApiOptions
        {
            Host = string.Empty,
            Port = 8080,
            CorsEnabled = true,
            RateLimit = 100,
            TimeoutSeconds = 30
        };

        // Act
        var validationResults = ValidateModel(options);

        // Assert
        validationResults.Should().BeEmpty(); // Host is not marked as required
    }

    /// <summary>
    /// Helper method to validate a model using data annotations
    /// </summary>
    private static List<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }
}