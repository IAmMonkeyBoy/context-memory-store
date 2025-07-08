using ContextMemoryStore.Core.Entities;

namespace ContextMemoryStore.Core.Interfaces;

/// <summary>
/// Repository interface for document storage operations
/// </summary>
public interface IDocumentRepository
{
    /// <summary>
    /// Retrieves a document by its unique identifier
    /// </summary>
    /// <param name="id">Document identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Document if found, null otherwise</returns>
    Task<Document?> GetByIdAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Stores a new document or updates an existing one
    /// </summary>
    /// <param name="document">Document to store</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Stored document</returns>
    Task<Document> SaveAsync(Document document, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a document by its identifier
    /// </summary>
    /// <param name="id">Document identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves multiple documents by their identifiers
    /// </summary>
    /// <param name="ids">Document identifiers</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of found documents</returns>
    Task<IEnumerable<Document>> GetByIdsAsync(IEnumerable<string> ids, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves all documents with optional filtering
    /// </summary>
    /// <param name="skip">Number of documents to skip</param>
    /// <param name="take">Number of documents to take</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of documents</returns>
    Task<IEnumerable<Document>> GetAllAsync(int skip = 0, int take = 100, CancellationToken cancellationToken = default);
}