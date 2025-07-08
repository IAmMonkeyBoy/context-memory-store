namespace ContextMemoryStore.Core.Entities;

/// <summary>
/// Standard response envelope for all API responses
/// </summary>
/// <typeparam name="T">Type of the data payload</typeparam>
public class StandardResponse<T>
{
    /// <summary>
    /// Response status (success or error)
    /// </summary>
    public required string Status { get; set; }

    /// <summary>
    /// Response data payload
    /// </summary>
    public T? Data { get; set; }

    /// <summary>
    /// Error information if status is error
    /// </summary>
    public ErrorInfo? Error { get; set; }

    /// <summary>
    /// Response metadata
    /// </summary>
    public ResponseMetadata? Metadata { get; set; }
}

/// <summary>
/// Error information for failed responses
/// </summary>
public class ErrorInfo
{
    /// <summary>
    /// Error code
    /// </summary>
    public required string Code { get; set; }

    /// <summary>
    /// Human-readable error message
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Additional error details
    /// </summary>
    public Dictionary<string, object>? Details { get; set; }

    /// <summary>
    /// Timestamp when the error occurred
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Metadata for responses
/// </summary>
public class ResponseMetadata
{
    /// <summary>
    /// Unique request identifier
    /// </summary>
    public string? RequestId { get; set; }

    /// <summary>
    /// Response timestamp
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// API version
    /// </summary>
    public string? Version { get; set; }
}