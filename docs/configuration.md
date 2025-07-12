# Configuration Management

This document describes the configuration system for the Context Memory Store.

## Overview

The Context Memory Store uses a hierarchical configuration system with YAML files for human-readable settings and environment variables for deployment-specific overrides.

## Configuration Files

### Main Configuration
- **File**: `project/config.yaml`
- **Purpose**: Main configuration for a single project instance
- **Format**: YAML
- **Scope**: Project-specific settings

### Service Configurations
- **Qdrant**: `config/qdrant.yaml`
- **Neo4j**: `config/neo4j.conf`
- **Prometheus**: `config/prometheus.yml`
- **Grafana**: `config/grafana/`

## Configuration Structure

### Project Configuration (`project/config.yaml`)

```yaml
# Project Information
project:
  name: "example-project"
  description: "Project description"
  version: "1.0.0"
  created: "2025-07-06T17:00:00Z"

# LLM API Configuration
llm:
  api_base: "http://host.docker.internal:11434/v1"
  chat_model: "llama3"
  embedding_model: "mxbai-embed-large"
  api_key: ""
  timeout: 30
  max_tokens: 4096

# Vector Storage Configuration
vector_store:
  host: "localhost"
  port: 6333
  collection_name: "context-memory"
  vector_size: 768  # mxbai-embed-large embedding dimension
  distance: "Cosine"
  backup_path: "/project/vector-store.jsonl"

# Graph Storage Configuration
graph_store:
  uri: "bolt://localhost:7687"
  username: "neo4j"
  password: "contextmemory"
  database: "neo4j"
  backup_path: "/project/graph.cypher"
```

## Configuration Sections

### Project Settings
- **name**: Project identifier
- **description**: Project description
- **version**: Project version
- **created**: Project creation timestamp

### LLM Configuration
- **api_base**: Ollama API endpoint
- **chat_model**: Model for conversation
- **embedding_model**: Model for vector generation
- **api_key**: API key (optional for local Ollama)
- **timeout**: Request timeout in seconds
- **max_tokens**: Maximum tokens per request

### Vector Store Settings
- **host**: Qdrant server hostname
- **port**: Qdrant server port
- **collection_name**: Collection name for this project
- **vector_size**: Vector dimensions
- **distance**: Distance metric (Cosine, Euclidean, Dot)
- **backup_path**: Local backup file path

### Graph Store Settings
- **uri**: Neo4j connection URI
- **username**: Neo4j username
- **password**: Neo4j password
- **database**: Neo4j database name
- **backup_path**: Local backup file path

### Memory Management
- **max_documents**: Maximum documents in memory
- **max_age_days**: Maximum document age (0 = unlimited)
- **cleanup_interval_hours**: Cleanup frequency
- **summary_interval_minutes**: Summary update frequency

### Processing Settings
- **supported_formats**: Supported file types
- **max_file_size_mb**: Maximum file size for ingestion
- **chunk_size**: Text chunking size
- **chunk_overlap**: Text chunking overlap
- **auto_summarize**: Enable automatic summarization
- **min_document_length**: Minimum document length

### API Configuration
- **host**: API server host
- **port**: API server port
- **cors_enabled**: Enable CORS
- **rate_limit**: Requests per minute
- **timeout**: Request timeout

### Monitoring
- **prometheus_enabled**: Enable Prometheus metrics
- **metrics_interval**: Metrics collection interval
- **log_level**: Logging level
- **log_file**: Log file path
- **metrics_file**: Metrics file path

### Git Integration
- **auto_commit**: Auto-commit changes
- **commit_message_template**: Commit message template
- **snapshot_branch**: Branch for snapshots
- **tracked_files**: Files to track in git

### Performance
- **worker_threads**: Number of worker threads
- **batch_size**: Batch size for operations
- **connection_pool_size**: Connection pool size
- **cache_size**: Cache size

### Security
- **auth_enabled**: Enable authentication
- **api_key**: API key for access control
- **tls_enabled**: Enable TLS/SSL
- **cert_file**: Certificate file path
- **key_file**: Private key file path

### Feature Flags
- **mcp_enabled**: Enable MCP protocol
- **relationship_extraction**: Enable relationship extraction
- **contextual_summarization**: Enable contextual summarization
- **semantic_search**: Enable semantic search

## Environment Variables

Configuration values can be overridden using environment variables:

```bash
# LLM Configuration
export LLM_API_BASE="http://localhost:11434/v1"
export LLM_CHAT_MODEL="llama3"
export LLM_EMBEDDING_MODEL="mxbai-embed-large"

# Vector Store
export VECTOR_STORE_HOST="localhost"
export VECTOR_STORE_PORT="6333"

# Graph Store
export GRAPH_STORE_URI="bolt://localhost:7687"
export GRAPH_STORE_USERNAME="neo4j"
export GRAPH_STORE_PASSWORD="contextmemory"

# Neo4j Memory Configuration
export NEO4J_INITIAL_HEAP_SIZE="512m"
export NEO4J_MAX_HEAP_SIZE="1g"
export NEO4J_PAGE_CACHE_SIZE="512m"

# API
export API_HOST="0.0.0.0"
export API_PORT="8080"
```

## Configuration Validation

The system validates configuration on startup:

1. **Required Fields**: Ensures all required fields are present
2. **Data Types**: Validates data types and formats
3. **Connectivity**: Tests connections to external services
4. **Permissions**: Validates file system permissions
5. **Resource Limits**: Checks resource availability

## Configuration Best Practices

1. **Version Control**: Keep configuration files in version control
2. **Environment-Specific**: Use environment variables for deployment-specific settings
3. **Security**: Never commit sensitive credentials
4. **Documentation**: Document configuration changes
5. **Validation**: Test configuration changes before deployment

## Configuration Examples

### Development Configuration
```yaml
llm:
  api_base: "http://localhost:11434/v1"
  chat_model: "llama3"
  embedding_model: "mxbai-embed-large"

vector_store:
  host: "localhost"
  port: 6333

graph_store:
  uri: "bolt://localhost:7687"
  username: "neo4j"
  password: "contextmemory"

monitoring:
  log_level: "DEBUG"
  prometheus_enabled: true
```

### Production Configuration
```yaml
llm:
  api_base: "https://ollama.internal:11434/v1"
  api_key: "${LLM_API_KEY}"
  timeout: 60

vector_store:
  host: "qdrant.internal"
  port: 6333

graph_store:
  uri: "bolt://neo4j.internal:7687"
  username: "${NEO4J_USERNAME}"
  password: "${NEO4J_PASSWORD}"

security:
  auth_enabled: true
  api_key: "${API_KEY}"
  tls_enabled: true

monitoring:
  log_level: "INFO"
  prometheus_enabled: true
```