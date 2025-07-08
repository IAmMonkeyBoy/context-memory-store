using System.Collections;

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

    /// <summary>
    /// Create a successful response
    /// </summary>
    /// <param name="data">Response data</param>
    /// <param name="requestId">Request identifier</param>
    /// <param name="version">API version</param>
    /// <returns>Success response</returns>
    public static StandardResponse<T> Success(T data, string? requestId = null, string? version = "1.0.0")
    {
        return new StandardResponse<T>
        {
            Status = "success",
            Data = data,
            Metadata = new ResponseMetadata
            {
                RequestId = requestId ?? Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow,
                Version = version
            }
        };
    }

    /// <summary>
    /// Create an error response
    /// </summary>
    /// <param name="code">Error code</param>
    /// <param name="message">Error message</param>
    /// <param name="details">Error details</param>
    /// <param name="requestId">Request identifier</param>
    /// <param name="version">API version</param>
    /// <returns>Error response</returns>
    public static StandardResponse<T> CreateError(string code, string message, object? details = null, string? requestId = null, string? version = "1.0.0")
    {
        return new StandardResponse<T>
        {
            Status = "error",
            Error = new ErrorInfo
            {
                Code = code,
                Message = message,
                Details = details != null ? ConvertToDictionary(details) : null,
                Timestamp = DateTime.UtcNow
            },
            Metadata = new ResponseMetadata
            {
                RequestId = requestId ?? Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow,
                Version = version
            }
        };
    }

    private static Dictionary<string, object>? ConvertToDictionary(object obj)
    {
        if (obj == null) return null;
        
        // If the object is already a dictionary, return it directly to preserve key/value pairs
        if (obj is IDictionary<string, object> dictionary)
        {
            return new Dictionary<string, object>(dictionary);
        }
        
        // If it's a generic dictionary, convert to string keys
        if (obj is IDictionary genericDict)
        {
            var result = new Dictionary<string, object>();
            foreach (DictionaryEntry entry in genericDict)
            {
                if (entry.Key != null)
                {
                    result[entry.Key.ToString()!] = entry.Value ?? string.Empty;
                }
            }
            return result;
        }
        
        // For other objects, use reflection to get properties
        var type = obj.GetType();
        var properties = type.GetProperties();
        var reflectionResult = new Dictionary<string, object>();
        
        foreach (var prop in properties)
        {
            var value = prop.GetValue(obj);
            if (value != null)
            {
                reflectionResult[prop.Name] = value;
            }
        }
        
        return reflectionResult;
    }
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