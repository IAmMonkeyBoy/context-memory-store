using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Core.Exceptions;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace ContextMemoryStore.Infrastructure.Services;

/// <summary>
/// In-memory implementation of IDocumentRepository for development and testing
/// </summary>
public class InMemoryDocumentRepository : IDocumentRepository
{
    private readonly ConcurrentDictionary<string, Document> _documents = new();
    private readonly ILogger<InMemoryDocumentRepository> _logger;

    public InMemoryDocumentRepository(ILogger<InMemoryDocumentRepository> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Creates a new document
    /// </summary>
    public Task<Document> CreateAsync(Document document, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Creating document: {DocumentId}", document.Id);

            if (_documents.ContainsKey(document.Id))
            {
                throw new DocumentProcessingException(document.Id, $"Document with ID {document.Id} already exists");
            }

            _documents[document.Id] = document;
            _logger.LogDebug("Successfully created document: {DocumentId}", document.Id);

            return Task.FromResult(document);
        }
        catch (Exception ex) when (!(ex is DocumentProcessingException))
        {
            _logger.LogError(ex, "Error creating document: {DocumentId}", document.Id);
            throw new DocumentProcessingException(document.Id, $"Error creating document {document.Id}: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Updates an existing document
    /// </summary>
    public Task<Document> UpdateAsync(Document document, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Updating document: {DocumentId}", document.Id);

            if (!_documents.ContainsKey(document.Id))
            {
                throw new DocumentNotFoundException($"Document with ID {document.Id} not found");
            }

            _documents[document.Id] = document;
            _logger.LogDebug("Successfully updated document: {DocumentId}", document.Id);

            return Task.FromResult(document);
        }
        catch (Exception ex) when (!(ex is DocumentNotFoundException))
        {
            _logger.LogError(ex, "Error updating document: {DocumentId}", document.Id);
            throw new DocumentProcessingException(document.Id, $"Error updating document {document.Id}: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Gets a document by ID
    /// </summary>
    public Task<Document?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting document by ID: {DocumentId}", id);

            var document = _documents.TryGetValue(id, out var doc) ? doc : null;
            
            if (document != null)
            {
                _logger.LogDebug("Found document: {DocumentId}", id);
            }
            else
            {
                _logger.LogDebug("Document not found: {DocumentId}", id);
            }

            return Task.FromResult(document);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting document by ID: {DocumentId}", id);
            throw new DocumentProcessingException(id, $"Error getting document {id}: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Stores a new document or updates an existing one
    /// </summary>
    public Task<Document> SaveAsync(Document document, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Saving document: {DocumentId}", document.Id);

            _documents[document.Id] = document;
            _logger.LogDebug("Successfully saved document: {DocumentId}", document.Id);

            return Task.FromResult(document);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving document: {DocumentId}", document.Id);
            throw new DocumentProcessingException(document.Id, $"Error saving document {document.Id}: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Gets multiple documents by their identifiers
    /// </summary>
    public Task<IEnumerable<Document>> GetByIdsAsync(IEnumerable<string> ids, CancellationToken cancellationToken = default)
    {
        try
        {
            var idList = ids.ToList();
            _logger.LogDebug("Getting documents by IDs: {Count} documents", idList.Count);

            var documents = new List<Document>();
            foreach (var id in idList)
            {
                if (_documents.TryGetValue(id, out var document))
                {
                    documents.Add(document);
                }
            }

            _logger.LogDebug("Retrieved {Count} documents", documents.Count);
            return Task.FromResult<IEnumerable<Document>>(documents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting documents by IDs");
            throw new DocumentProcessingException("batch", $"Error getting documents by IDs: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Gets all documents with optional filtering
    /// </summary>
    public Task<IEnumerable<Document>> GetAllAsync(int skip = 0, int take = 100, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting all documents with skip={Skip}, take={Take}", skip, take);

            var documents = _documents.Values.Skip(skip).Take(take).ToList();
            _logger.LogDebug("Retrieved {Count} documents", documents.Count);

            return Task.FromResult<IEnumerable<Document>>(documents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all documents");
            throw new DocumentProcessingException("all", $"Error getting all documents: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Deletes a document
    /// </summary>
    public Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Deleting document: {DocumentId}", id);

            var removed = _documents.TryRemove(id, out _);
            
            if (removed)
            {
                _logger.LogDebug("Successfully deleted document: {DocumentId}", id);
            }
            else
            {
                _logger.LogDebug("Document not found for deletion: {DocumentId}", id);
            }

            return Task.FromResult(removed);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document: {DocumentId}", id);
            throw new DocumentProcessingException(id, $"Error deleting document {id}: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Gets the total count of documents
    /// </summary>
    public Task<long> GetCountAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting document count");

            var count = (long)_documents.Count;
            _logger.LogDebug("Document count: {Count}", count);

            return Task.FromResult(count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting document count");
            throw new DocumentProcessingException("count", $"Error getting document count: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Checks if a document exists
    /// </summary>
    public Task<bool> ExistsAsync(string id, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Checking if document exists: {DocumentId}", id);

            var exists = _documents.ContainsKey(id);
            _logger.LogDebug("Document exists check for {DocumentId}: {Exists}", id, exists);

            return Task.FromResult(exists);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if document exists: {DocumentId}", id);
            throw new DocumentProcessingException(id, $"Error checking if document {id} exists: {ex.Message}", ex);
        }
    }
}