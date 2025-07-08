using ContextMemoryStore.Core.Entities;

namespace ContextMemoryStore.Core.Interfaces;

/// <summary>
/// Service interface for graph database operations
/// </summary>
public interface IGraphStoreService
{
    /// <summary>
    /// Stores a relationship in the graph database
    /// </summary>
    /// <param name="relationship">Relationship to store</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Stored relationship</returns>
    Task<Relationship> StoreRelationshipAsync(Relationship relationship, CancellationToken cancellationToken = default);

    /// <summary>
    /// Stores multiple relationships in batch
    /// </summary>
    /// <param name="relationships">Relationships to store</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Number of relationships stored</returns>
    Task<int> StoreRelationshipsAsync(IEnumerable<Relationship> relationships, CancellationToken cancellationToken = default);

    /// <summary>
    /// Finds relationships involving a specific entity
    /// </summary>
    /// <param name="entityName">Entity name</param>
    /// <param name="direction">Relationship direction</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Related relationships</returns>
    Task<IEnumerable<Relationship>> FindRelationshipsAsync(string entityName, RelationshipDirection direction = RelationshipDirection.Both, CancellationToken cancellationToken = default);

    /// <summary>
    /// Finds relationships by type
    /// </summary>
    /// <param name="relationshipType">Type of relationship</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Relationships of the specified type</returns>
    Task<IEnumerable<Relationship>> FindRelationshipsByTypeAsync(string relationshipType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Performs graph traversal to find connected entities
    /// </summary>
    /// <param name="startEntity">Starting entity</param>
    /// <param name="maxDepth">Maximum traversal depth</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Connected entities and relationships</returns>
    Task<GraphTraversalResult> TraverseAsync(string startEntity, int maxDepth = 3, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes all relationships for a document
    /// </summary>
    /// <param name="documentId">Document identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Number of relationships deleted</returns>
    Task<int> DeleteRelationshipsAsync(string documentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the total number of relationships in the graph
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Total relationship count</returns>
    Task<long> GetRelationshipCountAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if the graph store service is healthy
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if healthy, false otherwise</returns>
    Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets graph statistics
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Graph statistics</returns>
    Task<GraphStats> GetStatsAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Direction for relationship queries
/// </summary>
public enum RelationshipDirection
{
    /// <summary>
    /// Outgoing relationships (entity as source)
    /// </summary>
    Outgoing,
    
    /// <summary>
    /// Incoming relationships (entity as target)
    /// </summary>
    Incoming,
    
    /// <summary>
    /// Both incoming and outgoing relationships
    /// </summary>
    Both
}

/// <summary>
/// Result from a graph traversal operation
/// </summary>
public class GraphTraversalResult
{
    /// <summary>
    /// Starting entity for the traversal
    /// </summary>
    public required string StartEntity { get; set; }

    /// <summary>
    /// Connected entities found during traversal
    /// </summary>
    public List<string> ConnectedEntities { get; set; } = new();

    /// <summary>
    /// Relationships discovered during traversal
    /// </summary>
    public List<Relationship> Relationships { get; set; } = new();

    /// <summary>
    /// Maximum depth reached during traversal
    /// </summary>
    public int MaxDepthReached { get; set; }
}

/// <summary>
/// Statistics for the graph store
/// </summary>
public class GraphStats
{
    /// <summary>
    /// Total number of nodes in the graph
    /// </summary>
    public int NodeCount { get; set; }

    /// <summary>
    /// Total number of relationships in the graph
    /// </summary>
    public int RelationshipCount { get; set; }
}