using ContextMemoryStore.Core.Interfaces;
using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Core.Exceptions;
using ContextMemoryStore.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Neo4j.Driver;

namespace ContextMemoryStore.Infrastructure.Services;

/// <summary>
/// Neo4j implementation of IGraphStoreService for real graph database operations
/// </summary>
public class Neo4jGraphStoreService : IGraphStoreService
{
    private readonly IDriver _driver;
    private readonly Neo4jOptions _options;
    private readonly ILogger<Neo4jGraphStoreService> _logger;

    public Neo4jGraphStoreService(
        IDriver driver,
        IOptions<Neo4jOptions> options,
        ILogger<Neo4jGraphStoreService> logger)
    {
        _driver = driver ?? throw new ArgumentNullException(nameof(driver));
        _options = options.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Stores a relationship in the graph database
    /// </summary>
    public async Task<Relationship> StoreRelationshipAsync(Relationship relationship, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Storing relationship: {Source} -> {Target} ({Type})", 
                relationship.Source, relationship.Target, relationship.Type);

            var session = _driver.AsyncSession();
            try
            {
                var query = @"
                    MERGE (source:Entity {name: $source})
                    MERGE (target:Entity {name: $target})
                    MERGE (source)-[r:RELATED {
                        type: $type,
                        confidence: $confidence,
                        document_id: $documentId,
                        created_at: $createdAt
                    }]->(target)
                    SET r.metadata = $metadata
                    RETURN r";

                var parameters = new Dictionary<string, object>
                {
                    ["source"] = relationship.Source,
                    ["target"] = relationship.Target,
                    ["type"] = relationship.Type,
                    ["confidence"] = relationship.Confidence,
                    ["documentId"] = relationship.DocumentId,
                    ["createdAt"] = DateTime.UtcNow.ToString("O"),
                    ["metadata"] = relationship.Metadata
                };

                var result = await session.RunAsync(query, parameters);
                await result.ConsumeAsync();

                _logger.LogInformation("Successfully stored relationship: {Source} -> {Target} ({Type})", 
                    relationship.Source, relationship.Target, relationship.Type);

                return relationship;
            }
            finally
            {
                await session.CloseAsync();
            }
        }
        catch (Exception ex) when (!(ex is GraphStoreException))
        {
            _logger.LogError(ex, "Error storing relationship: {Source} -> {Target} ({Type})", 
                relationship.Source, relationship.Target, relationship.Type);
            throw new GraphStoreException($"Error storing relationship: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Stores multiple relationships in batch
    /// </summary>
    public async Task<int> StoreRelationshipsAsync(IEnumerable<Relationship> relationships, CancellationToken cancellationToken = default)
    {
        try
        {
            var relationshipList = relationships.ToList();
            _logger.LogInformation("Storing {Count} relationships in batch", relationshipList.Count);

            if (!relationshipList.Any())
                return 0;

            var session = _driver.AsyncSession();
            try
            {
                var result = await session.ExecuteWriteAsync(async tx =>
                {
                    var storedCount = 0;
                    var query = @"
                        MERGE (source:Entity {name: $source})
                        MERGE (target:Entity {name: $target})
                        MERGE (source)-[r:RELATED {
                            type: $type,
                            confidence: $confidence,
                            document_id: $documentId,
                            created_at: $createdAt
                        }]->(target)
                        SET r.metadata = $metadata";

                    foreach (var relationship in relationshipList)
                    {
                        var parameters = new Dictionary<string, object>
                        {
                            ["source"] = relationship.Source,
                            ["target"] = relationship.Target,
                            ["type"] = relationship.Type,
                            ["confidence"] = relationship.Confidence,
                            ["documentId"] = relationship.DocumentId,
                            ["createdAt"] = DateTime.UtcNow.ToString("O"),
                            ["metadata"] = relationship.Metadata
                        };

                        await tx.RunAsync(query, parameters);
                        storedCount++;
                    }

                    return storedCount;
                });

                _logger.LogInformation("Successfully stored {Count} relationships in batch", result);
                return result;
            }
            finally
            {
                await session.CloseAsync();
            }
        }
        catch (Exception ex) when (!(ex is GraphStoreException))
        {
            _logger.LogError(ex, "Error storing {Count} relationships in batch", relationships.Count());
            throw new GraphStoreException($"Error storing relationships in batch: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Finds relationships involving a specific entity
    /// </summary>
    public async Task<IEnumerable<Relationship>> FindRelationshipsAsync(string entityName, RelationshipDirection direction = RelationshipDirection.Both, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Finding relationships for entity: {Entity}, direction: {Direction}", entityName, direction);

            var session = _driver.AsyncSession();
            try
            {
                var query = direction switch
                {
                    RelationshipDirection.Outgoing => @"
                        MATCH (source:Entity {name: $entityName})-[r:RELATED]->(target:Entity)
                        RETURN source.name as source, target.name as target, r.type as type, 
                               r.confidence as confidence, r.document_id as documentId, r.metadata as metadata",
                    RelationshipDirection.Incoming => @"
                        MATCH (source:Entity)-[r:RELATED]->(target:Entity {name: $entityName})
                        RETURN source.name as source, target.name as target, r.type as type, 
                               r.confidence as confidence, r.document_id as documentId, r.metadata as metadata",
                    _ => @"
                        MATCH (entity:Entity {name: $entityName})
                        MATCH (source:Entity)-[r:RELATED]->(target:Entity)
                        WHERE source = entity OR target = entity
                        RETURN source.name as source, target.name as target, r.type as type, 
                               r.confidence as confidence, r.document_id as documentId, r.metadata as metadata"
                };

                var result = await session.RunAsync(query, new { entityName });
                var relationships = new List<Relationship>();

                await foreach (var record in result)
                {
                    var relationship = new Relationship
                    {
                        Source = record["source"].As<string>(),
                        Target = record["target"].As<string>(),
                        Type = record["type"].As<string>(),
                        Confidence = record["confidence"].As<double>(),
                        DocumentId = record["documentId"].As<string>(),
                        Metadata = record["metadata"].As<Dictionary<string, object>>() ?? new Dictionary<string, object>()
                    };

                    relationships.Add(relationship);
                }

                _logger.LogInformation("Found {Count} relationships for entity: {Entity}", relationships.Count, entityName);
                return relationships;
            }
            finally
            {
                await session.CloseAsync();
            }
        }
        catch (Exception ex) when (!(ex is GraphStoreException))
        {
            _logger.LogError(ex, "Error finding relationships for entity: {Entity}", entityName);
            throw new GraphStoreException($"Error finding relationships for entity '{entityName}': {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Finds relationships by type
    /// </summary>
    public async Task<IEnumerable<Relationship>> FindRelationshipsByTypeAsync(string relationshipType, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Finding relationships by type: {Type}", relationshipType);

            var session = _driver.AsyncSession();
            try
            {
                var query = @"
                    MATCH (source:Entity)-[r:RELATED {type: $relationshipType}]->(target:Entity)
                    RETURN source.name as source, target.name as target, r.type as type, 
                           r.confidence as confidence, r.document_id as documentId, r.metadata as metadata";

                var result = await session.RunAsync(query, new { relationshipType });
                var relationships = new List<Relationship>();

                await foreach (var record in result)
                {
                    var relationship = new Relationship
                    {
                        Source = record["source"].As<string>(),
                        Target = record["target"].As<string>(),
                        Type = record["type"].As<string>(),
                        Confidence = record["confidence"].As<double>(),
                        DocumentId = record["documentId"].As<string>(),
                        Metadata = record["metadata"].As<Dictionary<string, object>>() ?? new Dictionary<string, object>()
                    };

                    relationships.Add(relationship);
                }

                _logger.LogInformation("Found {Count} relationships of type: {Type}", relationships.Count, relationshipType);
                return relationships;
            }
            finally
            {
                await session.CloseAsync();
            }
        }
        catch (Exception ex) when (!(ex is GraphStoreException))
        {
            _logger.LogError(ex, "Error finding relationships by type: {Type}", relationshipType);
            throw new GraphStoreException($"Error finding relationships by type '{relationshipType}': {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Performs graph traversal to find connected entities
    /// </summary>
    public async Task<GraphTraversalResult> TraverseAsync(string startEntity, int maxDepth = 3, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Performing graph traversal from: {Entity}, maxDepth: {MaxDepth}", startEntity, maxDepth);

            var session = _driver.AsyncSession();
            try
            {
                var query = @"
                    MATCH path = (start:Entity {name: $startEntity})-[r:RELATED*1.." + maxDepth + @"]-(connected:Entity)
                    RETURN path, length(path) as depth";

                var result = await session.RunAsync(query, new { startEntity });
                var traversalResult = new GraphTraversalResult
                {
                    StartEntity = startEntity,
                    ConnectedEntities = new List<string>(),
                    Relationships = new List<Relationship>(),
                    MaxDepthReached = 0
                };

                var connectedEntities = new HashSet<string>();
                var relationships = new HashSet<Relationship>(new RelationshipComparer());

                await foreach (var record in result)
                {
                    var path = record["path"].As<IPath>();
                    var depth = record["depth"].As<int>();

                    if (depth > traversalResult.MaxDepthReached)
                        traversalResult.MaxDepthReached = depth;

                    // Extract entities from path
                    foreach (var node in path.Nodes)
                    {
                        var entityName = node["name"].As<string>();
                        connectedEntities.Add(entityName);
                    }

                    // Extract relationships from path
                    foreach (var relationship in path.Relationships)
                    {
                        var rel = new Relationship
                        {
                            Source = relationship.StartNodeElementId,
                            Target = relationship.EndNodeElementId,
                            Type = relationship["type"].As<string>(),
                            Confidence = relationship["confidence"].As<double>(),
                            DocumentId = relationship["document_id"].As<string>(),
                            Metadata = relationship["metadata"].As<Dictionary<string, object>>() ?? new Dictionary<string, object>()
                        };

                        relationships.Add(rel);
                    }
                }

                traversalResult.ConnectedEntities = connectedEntities.Where(e => e != startEntity).ToList();
                traversalResult.Relationships = relationships.ToList();

                _logger.LogInformation("Graph traversal completed. Found {EntityCount} connected entities and {RelCount} relationships", 
                    traversalResult.ConnectedEntities.Count, traversalResult.Relationships.Count);

                return traversalResult;
            }
            finally
            {
                await session.CloseAsync();
            }
        }
        catch (Exception ex) when (!(ex is GraphStoreException))
        {
            _logger.LogError(ex, "Error performing graph traversal from: {Entity}", startEntity);
            throw new GraphStoreException($"Error performing graph traversal from '{startEntity}': {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Deletes all relationships for a document
    /// </summary>
    public async Task<int> DeleteRelationshipsAsync(string documentId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Deleting relationships for document: {DocumentId}", documentId);

            var session = _driver.AsyncSession();
            try
            {
                var query = @"
                    MATCH ()-[r:RELATED {document_id: $documentId}]-()
                    DELETE r
                    RETURN count(r) as deletedCount";

                var result = await session.RunAsync(query, new { documentId });
                var record = await result.SingleAsync();
                var deletedCount = record["deletedCount"].As<int>();

                _logger.LogInformation("Deleted {Count} relationships for document: {DocumentId}", deletedCount, documentId);
                return deletedCount;
            }
            finally
            {
                await session.CloseAsync();
            }
        }
        catch (Exception ex) when (!(ex is GraphStoreException))
        {
            _logger.LogError(ex, "Error deleting relationships for document: {DocumentId}", documentId);
            throw new GraphStoreException($"Error deleting relationships for document '{documentId}': {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Gets the total number of relationships in the graph
    /// </summary>
    public async Task<long> GetRelationshipCountAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting relationship count");

            var session = _driver.AsyncSession();
            try
            {
                var query = "MATCH ()-[r:RELATED]-() RETURN count(r) as count";
                var result = await session.RunAsync(query);
                var record = await result.SingleAsync();
                var count = record["count"].As<long>();

                _logger.LogDebug("Relationship count: {Count}", count);
                return count;
            }
            finally
            {
                await session.CloseAsync();
            }
        }
        catch (Exception ex) when (!(ex is GraphStoreException))
        {
            _logger.LogError(ex, "Error getting relationship count");
            throw new GraphStoreException($"Error getting relationship count: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Checks if the graph store service is healthy
    /// </summary>
    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Checking Neo4j health");

            var session = _driver.AsyncSession();
            try
            {
                var result = await session.RunAsync("RETURN 1 as health");
                await result.ConsumeAsync();

                _logger.LogDebug("Neo4j health check successful");
                return true;
            }
            finally
            {
                await session.CloseAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Neo4j health check failed");
            return false;
        }
    }

    /// <summary>
    /// Gets graph statistics
    /// </summary>
    public async Task<GraphStats> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting graph statistics");

            var session = _driver.AsyncSession();
            try
            {
                var query = @"
                    MATCH (n:Entity) 
                    OPTIONAL MATCH ()-[r:RELATED]-()
                    RETURN count(DISTINCT n) as nodeCount, count(r) as relationshipCount";

                var result = await session.RunAsync(query);
                var record = await result.SingleAsync();

                var stats = new GraphStats
                {
                    NodeCount = record["nodeCount"].As<int>(),
                    RelationshipCount = record["relationshipCount"].As<int>()
                };

                _logger.LogDebug("Graph statistics - Nodes: {NodeCount}, Relationships: {RelationshipCount}", 
                    stats.NodeCount, stats.RelationshipCount);

                return stats;
            }
            finally
            {
                await session.CloseAsync();
            }
        }
        catch (Exception ex) when (!(ex is GraphStoreException))
        {
            _logger.LogError(ex, "Error getting graph statistics");
            throw new GraphStoreException($"Error getting graph statistics: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Initializes the graph database schema and constraints
    /// </summary>
    public async Task<bool> InitializeSchemaAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Initializing Neo4j schema and constraints");

            var session = _driver.AsyncSession();
            try
            {
                // Create constraint for Entity.name if it doesn't exist
                var constraintQuery = @"
                    CREATE CONSTRAINT entity_name_unique IF NOT EXISTS
                    FOR (n:Entity) REQUIRE n.name IS UNIQUE";

                await session.RunAsync(constraintQuery);

                // Create index for document_id on relationships if it doesn't exist
                var indexQuery = @"
                    CREATE INDEX relationship_document_id IF NOT EXISTS
                    FOR ()-[r:RELATED]-() ON (r.document_id)";

                await session.RunAsync(indexQuery);

                _logger.LogInformation("Neo4j schema initialization completed successfully");
                return true;
            }
            finally
            {
                await session.CloseAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Neo4j schema");
            return false;
        }
    }

    /// <summary>
    /// Comparer for Relationship objects to ensure uniqueness in HashSet
    /// </summary>
    private class RelationshipComparer : IEqualityComparer<Relationship>
    {
        public bool Equals(Relationship? x, Relationship? y)
        {
            if (x == null || y == null) return false;
            return x.Source == y.Source && x.Target == y.Target && x.Type == y.Type;
        }

        public int GetHashCode(Relationship obj)
        {
            return HashCode.Combine(obj.Source, obj.Target, obj.Type);
        }
    }
}