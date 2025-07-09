namespace ContextMemoryStore.Core.Interfaces;

/// <summary>
/// Service for accessing correlation ID in other parts of the application
/// </summary>
public interface ICorrelationIdService
{
    /// <summary>
    /// Gets the current correlation ID
    /// </summary>
    string? GetCorrelationId();
}