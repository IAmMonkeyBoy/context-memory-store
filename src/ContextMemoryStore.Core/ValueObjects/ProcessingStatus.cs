namespace ContextMemoryStore.Core.ValueObjects;

/// <summary>
/// Value object representing document processing status
/// </summary>
public sealed record ProcessingStatus
{
    /// <summary>
    /// Document is pending processing
    /// </summary>
    public static readonly ProcessingStatus Pending = new("pending");

    /// <summary>
    /// Document is currently being processed
    /// </summary>
    public static readonly ProcessingStatus Processing = new("processing");

    /// <summary>
    /// Document has been successfully processed
    /// </summary>
    public static readonly ProcessingStatus Completed = new("completed");

    /// <summary>
    /// Document processing failed
    /// </summary>
    public static readonly ProcessingStatus Failed = new("failed");

    /// <summary>
    /// Status value
    /// </summary>
    public string Value { get; }

    private ProcessingStatus(string value)
    {
        Value = value;
    }

    /// <summary>
    /// Creates a processing status from a string value
    /// </summary>
    /// <param name="value">Status value</param>
    /// <returns>Processing status</returns>
    /// <exception cref="ArgumentException">Thrown when value is invalid</exception>
    public static ProcessingStatus FromString(string value)
    {
        return value?.ToLowerInvariant() switch
        {
            "pending" => Pending,
            "processing" => Processing,
            "completed" => Completed,
            "failed" => Failed,
            _ => throw new ArgumentException($"Invalid processing status: {value}", nameof(value))
        };
    }

    /// <summary>
    /// Implicit conversion from ProcessingStatus to string
    /// </summary>
    /// <param name="status">Processing status</param>
    /// <returns>Status value</returns>
    public static implicit operator string(ProcessingStatus status) => status.Value;

    /// <summary>
    /// Returns the status value
    /// </summary>
    /// <returns>Status value</returns>
    public override string ToString() => Value;
}