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
- **Version Requirements**: Neo4j 5.15+ (tested with 5.15 Community Edition)
- **Ports**: 7474 (HTTP), 7687 (Bolt), 2004 (Metrics)
- **Purpose**: Stores relationships and graph data
- **Configuration**: `/config/neo4j.conf` (mounted volume)
- **Data**: Persistent volumes for data, logs, import, plugins
- **Credentials**: Configurable via NEO4J_USERNAME/NEO4J_PASSWORD
- **APOC Plugin**: 5.15.0-core (automatically downloaded)
- **Memory Settings**: Fully parameterized via environment variables:
  - `NEO4J_INITIAL_HEAP_SIZE` (default: 512m) - Initial JVM heap size
  - `NEO4J_MAX_HEAP_SIZE` (default: 1g) - Maximum JVM heap size  
  - `NEO4J_PAGE_CACHE_SIZE` (default: 512m) - Page cache for data caching
- **APOC Configuration**: Consolidated into docker-compose.yml environment variables

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
- **Neo4j Metrics**: http://localhost:2004 (Prometheus endpoint)
- **Ollama API**: http://localhost:11434 (external)
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

### 2. Configure Environment Variables (Optional)
```bash
# Copy environment template
cp .env.example .env

# Edit credentials and configuration
# NEO4J_USERNAME, NEO4J_PASSWORD, GRAFANA_PASSWORD
```

### 3. Start Docker Services
```bash
docker-compose up -d
```

### 4. Verify Ollama Connection
```bash
# Test Ollama API from host
curl http://localhost:11434/api/version

# Test from Docker network (should work via host.docker.internal)
docker exec -it context-memory-prometheus curl http://host.docker.internal:11434/api/version
```

### 5. Verify Neo4j Connection
Access Neo4j Browser at http://localhost:7474 and login with:
- Username: neo4j
- Password: contextmemory

### 6. Check Grafana Dashboard
Access Grafana at http://localhost:3000 and login with:
- Username: admin
- Password: contextmemory

## Testing and Validation

The Context Memory Store includes a comprehensive testing framework with multiple levels of validation:

### Quick Validation
```bash
# Fast health check of all services
./scripts/health-check.sh

# Basic service functionality validation
./scripts/validate-services.sh
```

### Comprehensive Testing
```bash
# Complete infrastructure test suite (Docker-based)
./test.sh

# Advanced service functionality testing (100% functional coverage)
./scripts/comprehensive-service-tests.sh
```

### Testing Levels

1. **Health Checks** - Basic service availability
   - Service endpoints responding
   - Basic connectivity validation
   - Quick status verification

2. **Functionality Validation** - Service capabilities
   - Qdrant: Collection creation, vector operations
   - Neo4j: Queries, APOC procedures (436+ available)
   - Prometheus: Metrics collection, target discovery
   - Grafana: Data sources, dashboard API

3. **Comprehensive Testing** - Full functional coverage
   - Vector database operations with metadata
   - Graph database with relationship queries
   - End-to-end service connectivity chains
   - Metrics collection and aggregation

### Testing Workflow for Development

```bash
# 1. Before making infrastructure changes
./scripts/health-check.sh

# 2. After configuration changes
./scripts/validate-services.sh

# 3. For major infrastructure modifications
./scripts/comprehensive-service-tests.sh

# 4. Full validation before commits
./test.sh
```

## Troubleshooting

### Comprehensive Diagnostic Procedure

1. **Quick Service Status Check**
   ```bash
   docker-compose ps
   ./scripts/health-check.sh
   ```

2. **Service Functionality Validation**
   ```bash
   ./scripts/validate-services.sh
   ```

3. **Advanced Diagnostics**
   ```bash
   ./scripts/comprehensive-service-tests.sh
   ```

### Common Issues and Solutions

#### 1. Port Conflicts
**Symptoms**: Services fail to start, bind errors in logs
**Ports Required**: 6333, 6334 (Qdrant), 7474, 7687, 2004 (Neo4j), 9090 (Prometheus), 3000 (Grafana), 11434 (Ollama on host)

**Solution**:
```bash
# Check port usage
netstat -tulpn | grep -E ":(6333|6334|7474|7687|2004|9090|3000|11434)"

# Stop conflicting services
docker-compose down
sudo systemctl stop [conflicting-service]
```

#### 2. Ollama Connection Issues
**Symptoms**: Ollama validation fails, "host.docker.internal" not reachable
**Requirements**: Ollama running on host machine

**Diagnosis**:
```bash
# Test Ollama on host
curl http://localhost:11434/api/version

# Test from Docker network
docker exec -it context-memory-prometheus curl http://host.docker.internal:11434/api/version
```

**Solutions**:
```bash
# Install and start Ollama
# Visit https://ollama.com/download
ollama serve

# Pull required models
ollama pull llama3
ollama pull mxbai-embed-large
```

#### 3. Neo4j APOC Issues
**Symptoms**: APOC procedures not available, Neo4j startup failures
**Expected**: 436+ APOC procedures available

**Diagnosis**:
```bash
# Check APOC installation
docker logs context-memory-neo4j | grep -i apoc

# Verify APOC procedures
curl -X POST http://localhost:7474/db/neo4j/tx/commit \
  -H "Content-Type: application/json" \
  -d '{"statements":[{"statement":"CALL apoc.help(\"apoc\") YIELD name RETURN count(name) as apoc_procedures"}]}'
```

**Solutions**:
```bash
# Restart Neo4j services
docker-compose restart neo4j-apoc-downloader neo4j

# Check environment variables
docker-compose config | grep NEO4J_dbms_security_procedures
```

#### 4. Memory and Performance Issues
**Symptoms**: Services slow to respond, container restarts, OOM errors

**Diagnosis**:
```bash
# Check container resource usage
docker stats

# Check system resources
free -h
df -h
```

**Solutions**:
- Increase Docker memory allocation
- Adjust service memory limits in docker-compose.yml
- Check available disk space for volumes
- Review Neo4j memory configuration

#### 5. Volume and Permission Issues
**Symptoms**: Data not persisting, permission denied errors

**Diagnosis**:
```bash
# Check volume mounts
docker-compose config | grep volumes -A 20

# Check volume permissions
docker exec -it context-memory-qdrant ls -la /qdrant/storage
```

**Solutions**:
```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./data

# Reset volumes if needed
docker-compose down -v
docker-compose up -d
```

### Advanced Debugging

#### Service Logs Analysis
```bash
# View all service logs
docker-compose logs --tail=100

# Service-specific logs with timestamps
docker-compose logs -f --timestamps qdrant
docker-compose logs -f --timestamps neo4j
docker-compose logs -f --timestamps prometheus
docker-compose logs -f --timestamps grafana

# Filter for errors
docker-compose logs | grep -i error
```

#### Health Check Endpoints
```bash
# Comprehensive health validation
curl http://localhost:6333/health         # Qdrant
curl http://localhost:7474/               # Neo4j
curl http://localhost:2004/metrics        # Neo4j metrics
curl http://localhost:9090/-/healthy      # Prometheus
curl http://localhost:3000/api/health     # Grafana
curl http://localhost:11434/api/version   # Ollama (external)
```

#### Service Configuration Validation
```bash
# Validate Docker Compose configuration
docker-compose config

# Check environment variable resolution
docker-compose config | grep -A 5 environment

# Verify service dependencies
docker-compose config | grep -A 10 depends_on
```

### Performance Validation

#### Response Time Testing
```bash
# Test service response times
time curl -s http://localhost:6333/health
time curl -s http://localhost:7474/
time curl -s http://localhost:9090/-/healthy
```

#### Resource Monitoring
```bash
# Monitor resource usage during tests
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Monitor during comprehensive tests
./scripts/comprehensive-service-tests.sh &
watch docker stats
```

### Validation Success Criteria

✅ **All services healthy and responding**
✅ **APOC procedures available (436+ procedures)**
✅ **Vector operations working (collections, search, filtering)**
✅ **Graph operations functional (queries, nodes, relationships)**
✅ **Metrics collection active (Prometheus targets configured)**
✅ **Dashboard integration working (Grafana data sources)**
✅ **100% functional test coverage achieved**

## Production Considerations

1. **Security**: Enable authentication and TLS for all services
2. **Backups**: Configure regular backups for persistent volumes
3. **Monitoring**: Set up alerting for service failures
4. **Scaling**: Consider horizontal scaling for high-load scenarios
5. **Resource Limits**: Configure appropriate CPU and memory limits