namespace ContextMemoryStore.Core.Exceptions;

/// <summary>
/// Base exception for Context Memory Store operations
/// </summary>
public class MemoryStoreException : Exception
{
    /// <summary>
    /// Error code for the exception
    /// </summary>
    public string ErrorCode { get; }

    /// <summary>
    /// Additional error details
    /// </summary>
    public Dictionary<string, object>? Details { get; }

    /// <summary>
    /// HTTP status code for the exception
    /// </summary>
    public int StatusCode { get; }

    /// <summary>
    /// Initializes a new instance of the MemoryStoreException class
    /// </summary>
    /// <param name="errorCode">Error code</param>
    /// <param name="message">Error message</param>
    /// <param name="statusCode">HTTP status code</param>
    /// <param name="details">Additional error details</param>
    /// <param name="innerException">Inner exception</param>
    public MemoryStoreException(string errorCode, string message, int statusCode = 500, Dictionary<string, object>? details = null, Exception? innerException = null)
        : base(message, innerException)
    {
        ErrorCode = errorCode;
        StatusCode = statusCode;
        Details = details;
    }
}

/// <summary>
/// Exception thrown when a document is not found
/// </summary>
public class DocumentNotFoundException : MemoryStoreException
{
    /// <summary>
    /// Initializes a new instance of the DocumentNotFoundException class
    /// </summary>
    /// <param name="documentId">Document identifier</param>
    public DocumentNotFoundException(string documentId)
        : base("DOCUMENT_NOT_FOUND", $"Document with ID '{documentId}' was not found", 404, new Dictionary<string, object> { ["DocumentId"] = documentId })
    {
    }
}

/// <summary>
/// Exception thrown when document processing fails
/// </summary>
public class DocumentProcessingException : MemoryStoreException
{
    /// <summary>
    /// Initializes a new instance of the DocumentProcessingException class
    /// </summary>
    /// <param name="documentId">Document identifier</param>
    /// <param name="message">Error message</param>
    /// <param name="innerException">Inner exception</param>
    public DocumentProcessingException(string documentId, string message, Exception? innerException = null)
        : base("DOCUMENT_PROCESSING_ERROR", message, 422, new Dictionary<string, object> { ["DocumentId"] = documentId }, innerException)
    {
    }
}

/// <summary>
/// Exception thrown when vector store operations fail
/// </summary>
public class VectorStoreException : MemoryStoreException
{
    /// <summary>
    /// Initializes a new instance of the VectorStoreException class
    /// </summary>
    /// <param name="message">Error message</param>
    /// <param name="innerException">Inner exception</param>
    public VectorStoreException(string message, Exception? innerException = null)
        : base("VECTOR_STORE_ERROR", message, 502, null, innerException)
    {
    }
}

/// <summary>
/// Exception thrown when graph store operations fail
/// </summary>
public class GraphStoreException : MemoryStoreException
{
    /// <summary>
    /// Initializes a new instance of the GraphStoreException class
    /// </summary>
    /// <param name="message">Error message</param>
    /// <param name="innerException">Inner exception</param>
    public GraphStoreException(string message, Exception? innerException = null)
        : base("GRAPH_STORE_ERROR", message, 502, null, innerException)
    {
    }
}

/// <summary>
/// Exception thrown when LLM service operations fail
/// </summary>
public class LLMServiceException : MemoryStoreException
{
    /// <summary>
    /// Initializes a new instance of the LLMServiceException class
    /// </summary>
    /// <param name="message">Error message</param>
    /// <param name="innerException">Inner exception</param>
    public LLMServiceException(string message, Exception? innerException = null)
        : base("LLM_SERVICE_ERROR", message, 502, null, innerException)
    {
    }
}