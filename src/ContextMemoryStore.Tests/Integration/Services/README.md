# Service Integration Tests

This directory contains comprehensive integration tests for the three core services of the Context Memory Store system. These tests validate real service integrations using actual external dependencies.

## Test Files

### 1. QdrantVectorStoreServiceTests.cs
Tests the `QdrantVectorStoreService` implementation with a real Qdrant container.

**Validates:**
- Health checking and collection initialization
- Embedding storage and retrieval
- Semantic search functionality
- Document deletion and cleanup
- Concurrent operations handling
- Special character and large content processing
- Vector count tracking and collection management

**Dependencies:**
- Qdrant container (automatically started via Testcontainers)
- Ollama service (for embedding generation)

### 2. Neo4jGraphStoreServiceTests.cs
Tests the `Neo4jGraphStoreService` implementation with a real Neo4j container.

**Validates:**
- Health checking and schema initialization
- Relationship storage (single and batch)
- Entity relationship queries by direction and type
- Graph traversal with depth limits
- Relationship deletion by document ID
- Graph statistics and relationship counting
- Complex graph operations and concurrent access
- Special character handling in entity names

**Dependencies:**
- Neo4j container with APOC plugin (automatically started via Testcontainers)

### 3. OllamaLLMServiceTests.cs
Tests the `OllamaLLMService` implementation with an external Ollama service.

**Validates:**
- Health checking and model availability
- Embedding generation (single and batch)
- Chat completion functionality
- Text summarization with length limits
- Relationship extraction from text
- JSON parsing for structured responses
- Concurrent request handling
- Error handling for edge cases

**Dependencies:**
- External Ollama service running on localhost:11434
- Required models: `llama3` (chat), `mxbai-embed-large` (embeddings)

### 4. ServiceCompositionTests.cs
Tests the interaction and integration between all three services.

**Validates:**
- Complete document processing pipeline
- Multi-document consistency across services
- Semantic search with graph context enhancement
- Coordinated document deletion across all stores
- Large document processing efficiency
- Error recovery and partial failure handling
- Overall system health checking

**Dependencies:**
- All three external services (Qdrant, Neo4j, Ollama)

## Running the Tests

### Prerequisites

1. **Docker** - Required for Qdrant and Neo4j containers
2. **Ollama** - Must be running locally with required models

### Setup Ollama

```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull required models
ollama pull llama3
ollama pull mxbai-embed-large

# Start Ollama service
ollama serve
```

### Running Tests

```bash
# From the solution root directory
cd src

# Run all service integration tests
dotnet test ContextMemoryStore.Tests --filter "FullyQualifiedName~Services"

# Run specific service tests
dotnet test ContextMemoryStore.Tests --filter "FullyQualifiedName~QdrantVectorStoreServiceTests"
dotnet test ContextMemoryStore.Tests --filter "FullyQualifiedName~Neo4jGraphStoreServiceTests"
dotnet test ContextMemoryStore.Tests --filter "FullyQualifiedName~OllamaLLMServiceTests"
dotnet test ContextMemoryStore.Tests --filter "FullyQualifiedName~ServiceCompositionTests"

# Run with verbose output
dotnet test ContextMemoryStore.Tests --filter "FullyQualifiedName~Services" --logger "console;verbosity=detailed"
```

### Test Configuration

The tests use configuration from:
- `appsettings.Testing.json` - Base test configuration
- `ServiceIntegrationTestBase` - Container and service setup
- Individual test overrides for service requirements

Key configuration options:
```json
{
  "Qdrant": {
    "Host": "localhost",
    "Port": 6333,
    "CollectionName": "documents",
    "VectorSize": 1024
  },
  "Neo4j": {
    "Uri": "bolt://localhost:7687",
    "Username": "neo4j",
    "Password": "contextmemory"
  },
  "Ollama": {
    "BaseUrl": "http://localhost:11434/v1",
    "ChatModel": "llama3",
    "EmbeddingModel": "mxbai-embed-large"
  }
}
```

## Test Categories

### Unit Integration Tests
Individual service tests that validate each service implementation against its real external dependency:
- Connection and health checking
- Basic CRUD operations
- Service-specific functionality
- Error handling and edge cases

### Composition Integration Tests
Cross-service tests that validate:
- Service interactions and data flow
- End-to-end processing pipelines
- Data consistency across services
- Performance under load
- Error recovery scenarios

## Expected Test Results

### Successful Run Indicators
- All containers start successfully
- Ollama models are available
- Health checks pass for all services
- CRUD operations complete without errors
- Search and traversal return expected results
- Cleanup operations remove data properly

### Common Issues

1. **Ollama Not Running**
   ```
   Error: Ollama health check failed
   Solution: Start Ollama service and pull required models
   ```

2. **Docker Not Available**
   ```
   Error: Failed to start container
   Solution: Ensure Docker is running and accessible
   ```

3. **Port Conflicts**
   ```
   Error: Port already in use
   Solution: Stop conflicting services or change test ports
   ```

4. **Model Not Found**
   ```
   Error: Model not available
   Solution: Pull required models with 'ollama pull <model-name>'
   ```

## Performance Expectations

Typical test execution times:
- QdrantVectorStoreServiceTests: 30-60 seconds
- Neo4jGraphStoreServiceTests: 20-40 seconds  
- OllamaLLMServiceTests: 60-120 seconds (depends on model performance)
- ServiceCompositionTests: 90-180 seconds

## Test Data Management

The tests are designed to be isolated and clean up after themselves:
- Each test uses unique document IDs to avoid conflicts
- Container data is ephemeral (lost when containers stop)
- Tests can run in parallel without interference
- No persistent data pollution between test runs

## Troubleshooting

### Debug Output
Use `ITestOutputHelper` for detailed test output:
```csharp
_output.WriteLine($"Test result: {result}");
```

### Container Logs
Access container logs for debugging:
```bash
docker logs <container-id>
```

### Service Health
Verify services are responding:
```bash
# Qdrant
curl http://localhost:6333/collections

# Neo4j
curl http://localhost:7474

# Ollama
curl http://localhost:11434/api/tags
```

## Contributing

When adding new service integration tests:

1. Extend the appropriate test class
2. Use the existing test patterns and helpers
3. Ensure proper cleanup in test disposal
4. Add meaningful assertions and output
5. Document any new dependencies or setup requirements
6. Consider both success and failure scenarios