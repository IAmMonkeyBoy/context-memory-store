# Context Memory Store - Usage Guide

This guide provides comprehensive examples and practical workflows for using the Context Memory Store API.

## Quick Start

### 1. Start the System

```bash
# Clone and start infrastructure
git clone <repository-url>
cd context-memory-store

# Start all services
docker-compose up -d

# Verify services are running
./scripts/health-check.sh
```

### 2. Install Ollama (External Dependency)

```bash
# Install Ollama on your host machine
# Visit: https://ollama.com/download

# Start Ollama service
ollama serve

# Pull required models
ollama pull llama3
ollama pull mxbai-embed-large
```

### 3. Verify System Health

```bash
# Check basic health
curl http://localhost:8080/health

# Check detailed health with dependencies
curl http://localhost:8080/health/detailed

# View metrics
curl http://localhost:8080/metrics
```

## API Usage Examples

### Health Check Operations

#### Basic Health Check
```bash
# Simple health check
curl -X GET http://localhost:8080/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-10T10:30:00Z",
  "version": "1.0.0",
  "uptime_seconds": 3600
}
```

#### Detailed Health Check
```bash
# Detailed health with dependency status
curl -X GET http://localhost:8080/health/detailed
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-10T10:30:00Z",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "dependencies": {
    "qdrant": {
      "status": "healthy",
      "response_time_ms": 12,
      "collections": 1
    },
    "neo4j": {
      "status": "healthy",
      "response_time_ms": 8,
      "nodes": 156,
      "relationships": 89
    },
    "ollama": {
      "status": "healthy",
      "response_time_ms": 245,
      "models": ["llama3", "mxbai-embed-large"]
    }
  }
}
```

### Lifecycle Management

#### Start Memory Engine
```bash
curl -X POST http://localhost:8080/v1/lifecycle/start \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "my-project",
    "config": {
      "auto_summarize": true,
      "max_documents": 10000
    }
  }'
```

#### Check System Status
```bash
curl -X GET http://localhost:8080/v1/lifecycle/status
```

#### Stop Memory Engine
```bash
curl -X POST http://localhost:8080/v1/lifecycle/stop \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "my-project",
    "commit_message": "Context update: added new documentation"
  }'
```

### Memory Operations

#### Ingest Documents
```bash
curl -X POST http://localhost:8080/v1/memory/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "id": "doc_001",
        "content": "This is the content of the document...",
        "metadata": {
          "title": "API Documentation",
          "author": "Developer",
          "type": "documentation",
          "tags": ["api", "rest", "openapi"]
        },
        "source": {
          "type": "file",
          "path": "/docs/api.md",
          "modified": "2025-07-10T10:00:00Z"
        }
      }
    ],
    "options": {
      "auto_summarize": true,
      "extract_relationships": true,
      "chunk_size": 1000
    }
  }'
```

#### Retrieve Context
```bash
# Basic context retrieval
curl -X GET "http://localhost:8080/v1/memory/context?q=API%20authentication"

# Advanced context retrieval with parameters
curl -X GET "http://localhost:8080/v1/memory/context?q=API%20authentication&limit=5&include_relationships=true&min_score=0.7"
```

#### Semantic Search
```bash
# Basic search
curl -X GET "http://localhost:8080/v1/memory/search?q=memory%20management"

# Advanced search with filtering and pagination
curl -X GET "http://localhost:8080/v1/memory/search?q=memory%20management&limit=10&offset=0&sort=relevance"
```

### Configuration Management

#### Get Current Configuration
```bash
curl -X GET http://localhost:8080/v1/config
```

#### Update Configuration
```bash
curl -X PUT http://localhost:8080/v1/config \
  -H "Content-Type: application/json" \
  -d '{
    "project": {
      "name": "updated-project",
      "description": "Updated project description"
    },
    "processing": {
      "chunk_size": 1200,
      "overlap_size": 200
    }
  }'
```

### Diagnostics and Monitoring

#### System Diagnostics
```bash
curl -X GET http://localhost:8080/v1/diagnostics
```

#### Prometheus Metrics
```bash
curl -X GET http://localhost:8080/metrics
```

## Development Workflows

### Typical Development Session

```bash
# 1. Start the system
docker-compose up -d

# 2. Initialize project
curl -X POST http://localhost:8080/v1/lifecycle/start \
  -H "Content-Type: application/json" \
  -d '{"project_id": "dev-session", "config": {"auto_summarize": true}}'

# 3. Ingest project documentation
curl -X POST http://localhost:8080/v1/memory/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "id": "readme",
        "content": "...", 
        "metadata": {"title": "README", "type": "documentation"}
      }
    ]
  }'

# 4. Query for relevant context
curl -X GET "http://localhost:8080/v1/memory/context?q=setup%20instructions"

# 5. End session and persist state
curl -X POST http://localhost:8080/v1/lifecycle/stop \
  -H "Content-Type: application/json" \
  -d '{"project_id": "dev-session", "commit_message": "Dev session complete"}'
```

### Testing and Validation

```bash
# Run comprehensive tests
dotnet test src/ContextMemoryStore.sln --verbosity minimal

# Run only unit tests
dotnet test src/ContextMemoryStore.sln --filter "FullyQualifiedName~Unit" --verbosity minimal

# Validate Docker services
./scripts/validate-services.sh

# Check system health
./scripts/health-check.sh
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_QUERY",
    "message": "Query parameter 'q' is required",
    "details": {
      "parameter": "q",
      "expected": "non-empty string",
      "received": "null"
    },
    "timestamp": "2025-07-10T10:30:00Z"
  }
}
```

#### 503 Service Unavailable
```json
{
  "status": "unhealthy",
  "error": {
    "code": "DEPENDENCY_ERROR",
    "message": "Qdrant service is unavailable",
    "details": {
      "service": "qdrant",
      "last_check": "2025-07-10T10:30:00Z"
    },
    "timestamp": "2025-07-10T10:30:00Z"
  }
}
```

### Troubleshooting

#### Service Connection Issues
```bash
# Check Docker services
docker-compose ps

# Restart specific service
docker-compose restart qdrant

# View service logs
docker-compose logs qdrant
```

#### API Endpoint Issues
```bash
# Check API service logs
docker-compose logs context-memory-api

# Verify configuration
curl http://localhost:8080/v1/config

# Check system diagnostics
curl http://localhost:8080/v1/diagnostics
```

## Performance Considerations

### Response Time Expectations
- Health endpoints: < 100ms
- Memory operations: < 5 seconds
- Search operations: < 2 seconds
- Configuration updates: < 1 second

### Rate Limiting
- Default rate limits apply to prevent resource exhaustion
- Concurrent operations are supported up to system capacity
- Monitor metrics endpoint for performance insights

### Resource Monitoring
```bash
# Check system metrics
curl http://localhost:8080/metrics

# Monitor Docker resource usage
docker stats

# View Grafana dashboards
open http://localhost:3000
```

## Integration Examples

### Python Client Example

```python
import requests
import json

class ContextMemoryClient:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
    
    def start_session(self, project_id, config=None):
        data = {"project_id": project_id}
        if config:
            data["config"] = config
        
        response = requests.post(f"{self.base_url}/v1/lifecycle/start", json=data)
        return response.json()
    
    def ingest_document(self, documents, options=None):
        data = {"documents": documents}
        if options:
            data["options"] = options
        
        response = requests.post(f"{self.base_url}/v1/memory/ingest", json=data)
        return response.json()
    
    def get_context(self, query, limit=10):
        params = {"q": query, "limit": limit}
        response = requests.get(f"{self.base_url}/v1/memory/context", params=params)
        return response.json()

# Usage
client = ContextMemoryClient()
result = client.start_session("python-project")
print(json.dumps(result, indent=2))
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

class ContextMemoryClient {
    constructor(baseUrl = 'http://localhost:8080') {
        this.baseUrl = baseUrl;
    }
    
    async startSession(projectId, config = null) {
        const data = { project_id: projectId };
        if (config) data.config = config;
        
        const response = await axios.post(`${this.baseUrl}/v1/lifecycle/start`, data);
        return response.data;
    }
    
    async ingestDocument(documents, options = null) {
        const data = { documents };
        if (options) data.options = options;
        
        const response = await axios.post(`${this.baseUrl}/v1/memory/ingest`, data);
        return response.data;
    }
    
    async getContext(query, limit = 10) {
        const response = await axios.get(`${this.baseUrl}/v1/memory/context`, {
            params: { q: query, limit }
        });
        return response.data;
    }
}

// Usage
const client = new ContextMemoryClient();
client.startSession('js-project')
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => console.error('Error:', error.message));
```

## Best Practices

### Document Ingestion
- Use meaningful document IDs
- Include comprehensive metadata
- Chunk large documents appropriately
- Use appropriate tags for categorization

### Memory Management
- Start and stop sessions cleanly
- Use descriptive commit messages
- Monitor memory usage via metrics
- Regular cleanup of old data

### Performance Optimization
- Use appropriate search parameters
- Cache frequently accessed context
- Monitor response times
- Optimize query patterns

### Error Handling
- Always check response status
- Implement retry logic for transient failures
- Monitor system health regularly
- Use correlation IDs for debugging

---

*This usage guide provides practical examples for working with the Context Memory Store API. For complete API specification, see [API Design Documentation](api-design.md).*