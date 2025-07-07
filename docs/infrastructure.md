# Infrastructure Setup

This document describes the Docker Compose infrastructure for the Context Memory Store system.

## Overview

The Context Memory Store uses a microservices architecture with the following components:

- **Qdrant** - Vector database for semantic search
- **Neo4j** - Graph database for relationship storage
- **Ollama** - LLM API for chat and embeddings (external service)
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards

## Services

### Qdrant (Vector Database)
- **Image**: `qdrant/qdrant:latest`
- **Ports**: 6333 (HTTP), 6334 (gRPC)
- **Purpose**: Stores vector embeddings for semantic search
- **Configuration**: `/config/qdrant.yaml`
- **Data**: Persistent volume `qdrant_data`

### Neo4j (Graph Database)
- **Image**: `neo4j:5.15-community`
- **Ports**: 7474 (HTTP), 7687 (Bolt)
- **Purpose**: Stores relationships and graph data
- **Configuration**: `/config/neo4j.conf`
- **Data**: Persistent volumes for data, logs, import, plugins
- **Credentials**: neo4j/contextmemory

### Ollama (External LLM API)
- **Installation**: Must be installed and running on host machine
- **Port**: 11434 (on host)
- **Purpose**: Provides OpenAI-compatible API for chat and embeddings
- **Access**: Services connect via `host.docker.internal:11434`
- **Models**: llama3 (chat), mxbai-embed-large (embeddings)

### Prometheus (Metrics)
- **Image**: `prom/prometheus:latest`
- **Port**: 9090
- **Purpose**: Collects metrics from all services
- **Configuration**: `/config/prometheus.yml`
- **Data**: Persistent volume `prometheus_data`

### Grafana (Monitoring)
- **Image**: `grafana/grafana:latest`
- **Port**: 3000
- **Purpose**: Visualization and monitoring dashboards
- **Configuration**: `/config/grafana/`
- **Credentials**: admin/contextmemory

## Network Configuration

All services run on the `context-memory-network` bridge network with subnet `172.20.0.0/16`.

## Starting the Infrastructure

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose down
```

## Service URLs

- **Qdrant Web UI**: http://localhost:6333/dashboard
- **Neo4j Browser**: http://localhost:7474
- **Ollama API**: http://localhost:11434
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000

## Initial Setup

### 1. Install and Start Ollama (Host Machine)
```bash
# Install Ollama on your host machine
# Visit https://ollama.com/download for installation instructions

# Start Ollama
ollama serve

# Pull required models
ollama pull llama3
ollama pull mxbai-embed-large
```

### 2. Start Docker Services
```bash
docker-compose up -d
```

### 3. Verify Ollama Connection
```bash
# Test Ollama API from host
curl http://localhost:11434/api/version

# Test from Docker network (should work via host.docker.internal)
docker exec -it context-memory-prometheus curl http://host.docker.internal:11434/api/version
```

### 4. Verify Neo4j Connection
Access Neo4j Browser at http://localhost:7474 and login with:
- Username: neo4j
- Password: contextmemory

### 5. Check Grafana Dashboard
Access Grafana at http://localhost:3000 and login with:
- Username: admin
- Password: contextmemory

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 6333, 6334, 7474, 7687, 9090, 3000 are available (11434 for Ollama on host)
2. **Ollama Connection**: Ensure Ollama is running on host machine and accessible via host.docker.internal
3. **Memory Issues**: Adjust memory limits in service configurations
4. **Permissions**: Ensure Docker has proper permissions for volume mounts

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f qdrant
docker-compose logs -f neo4j
docker-compose logs -f prometheus
```

### Health Checks
```bash
# Check Qdrant
curl http://localhost:6333/health

# Check Neo4j
curl http://localhost:7474/

# Check Ollama
curl http://localhost:11434/api/version

# Check Prometheus
curl http://localhost:9090/-/healthy
```

## Production Considerations

1. **Security**: Enable authentication and TLS for all services
2. **Backups**: Configure regular backups for persistent volumes
3. **Monitoring**: Set up alerting for service failures
4. **Scaling**: Consider horizontal scaling for high-load scenarios
5. **Resource Limits**: Configure appropriate CPU and memory limits