using ContextMemoryStore.Core.Entities;
using ContextMemoryStore.Tests.Fixtures;
using System.Text.Json;

namespace ContextMemoryStore.Tests.Common;

/// <summary>
/// Manages test data creation, cleanup, and isolation for integration tests.
/// </summary>
public class TestDataManager
{
    private readonly List<string> _createdCollections;
    private readonly List<string> _createdGraphNodes;
    private readonly Random _random;

    public TestDataManager()
    {
        _createdCollections = new List<string>();
        _createdGraphNodes = new List<string>();
        _random = new Random();
    }

    /// <summary>
    /// Generates a unique test collection name.
    /// </summary>
    public string GenerateTestCollectionName()
    {
        var collectionName = $"test_collection_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{_random.Next(1000, 9999)}";
        _createdCollections.Add(collectionName);
        return collectionName;
    }

    /// <summary>
    /// Generates a unique test graph node ID.
    /// </summary>
    public string GenerateTestNodeId()
    {
        var nodeId = $"test_node_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{_random.Next(1000, 9999)}";
        _createdGraphNodes.Add(nodeId);
        return nodeId;
    }

    /// <summary>
    /// Creates test documents with specified characteristics.
    /// </summary>
    public List<Document> CreateTestDocuments(int count = 5, string? collectionName = null)
    {
        var documents = new List<Document>();
        var actualCollectionName = collectionName ?? GenerateTestCollectionName();

        for (int i = 0; i < count; i++)
        {
            var document = DocumentFixture.Generate();
            
            // Add test-specific metadata
            document.Metadata["collection"] = actualCollectionName;
            document.Metadata["test_id"] = $"test_{i}";
            document.Metadata["created_at"] = DateTime.UtcNow.ToString("O");

            // Add test tags
            var tags = document.Metadata.Tags;
            tags.Add("test");
            tags.Add(actualCollectionName);
            document.Metadata.Tags = tags;

            documents.Add(document);
        }

        return documents;
    }

    /// <summary>
    /// Creates test vectors for vector store operations.
    /// </summary>
    public List<float[]> CreateTestVectors(int count = 5, int dimensions = 1024)
    {
        var vectors = new List<float[]>();
        
        for (int i = 0; i < count; i++)
        {
            var vector = new float[dimensions];
            for (int j = 0; j < dimensions; j++)
            {
                vector[j] = (float)(_random.NextDouble() * 2.0 - 1.0); // Range [-1, 1]
            }
            vectors.Add(vector);
        }

        return vectors;
    }

    /// <summary>
    /// Creates test graph data (nodes and relationships).
    /// </summary>
    public TestGraphData CreateTestGraphData(int nodeCount = 5, int relationshipCount = 3)
    {
        var nodes = new List<TestGraphNode>();
        var relationships = new List<TestGraphRelationship>();

        // Create nodes
        for (int i = 0; i < nodeCount; i++)
        {
            var nodeId = GenerateTestNodeId();
            nodes.Add(new TestGraphNode
            {
                Id = nodeId,
                Label = "TestDocument",
                Properties = new Dictionary<string, object>
                {
                    ["title"] = $"Test Document {i + 1}",
                    ["content"] = $"This is test content for document {i + 1}",
                    ["test_id"] = $"test_{i}",
                    ["created_at"] = DateTime.UtcNow.ToString("O")
                }
            });
        }

        // Create relationships between nodes
        for (int i = 0; i < Math.Min(relationshipCount, nodeCount - 1); i++)
        {
            relationships.Add(new TestGraphRelationship
            {
                FromNodeId = nodes[i].Id,
                ToNodeId = nodes[i + 1].Id,
                Type = "REFERENCES",
                Properties = new Dictionary<string, object>
                {
                    ["weight"] = _random.NextDouble(),
                    ["test_relationship"] = true
                }
            });
        }

        return new TestGraphData { Nodes = nodes, Relationships = relationships };
    }

    /// <summary>
    /// Creates test API request payloads.
    /// </summary>
    public object CreateTestApiPayload(string operation, Dictionary<string, object>? additionalData = null)
    {
        var basePayload = new Dictionary<string, object>
        {
            ["operation"] = operation,
            ["timestamp"] = DateTime.UtcNow.ToString("O"),
            ["test_data"] = true
        };

        if (additionalData != null)
        {
            foreach (var kvp in additionalData)
            {
                basePayload[kvp.Key] = kvp.Value;
            }
        }

        return basePayload;
    }

    /// <summary>
    /// Serializes test data to JSON for API requests.
    /// </summary>
    public string SerializeToJson(object data)
    {
        return JsonSerializer.Serialize(data, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        });
    }

    /// <summary>
    /// Gets list of created collections for cleanup.
    /// </summary>
    public IReadOnlyList<string> GetCreatedCollections() => _createdCollections.AsReadOnly();

    /// <summary>
    /// Gets list of created graph nodes for cleanup.
    /// </summary>
    public IReadOnlyList<string> GetCreatedGraphNodes() => _createdGraphNodes.AsReadOnly();

    /// <summary>
    /// Clears tracking lists (call after cleanup operations).
    /// </summary>
    public void ClearTrackingLists()
    {
        _createdCollections.Clear();
        _createdGraphNodes.Clear();
    }
}

/// <summary>
/// Represents test graph data structure.
/// </summary>
public class TestGraphData
{
    public List<TestGraphNode> Nodes { get; set; } = new();
    public List<TestGraphRelationship> Relationships { get; set; } = new();
}

/// <summary>
/// Represents a test graph node.
/// </summary>
public class TestGraphNode
{
    public required string Id { get; set; }
    public required string Label { get; set; }
    public Dictionary<string, object> Properties { get; set; } = new();
}

/// <summary>
/// Represents a test graph relationship.
/// </summary>
public class TestGraphRelationship
{
    public required string FromNodeId { get; set; }
    public required string ToNodeId { get; set; }
    public required string Type { get; set; }
    public Dictionary<string, object> Properties { get; set; } = new();
}