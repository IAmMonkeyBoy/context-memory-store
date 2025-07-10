# Context Memory Store - Troubleshooting Guide

This guide provides comprehensive troubleshooting procedures for common issues and system diagnostics.

## Quick Diagnostics

### System Health Check
```bash
# Quick health assessment
curl http://localhost:8080/health

# Detailed health with dependencies
curl http://localhost:8080/health/detailed

# System diagnostics
curl http://localhost:8080/v1/diagnostics
```

### Service Status Verification
```bash
# Check all Docker services
docker-compose ps

# View service logs
docker-compose logs

# Check specific service
docker-compose logs qdrant
docker-compose logs neo4j
docker-compose logs context-memory-api
```

## Common Issues and Solutions

### 1. API Service Not Responding

#### Symptoms
- HTTP requests timeout or return connection errors
- Health endpoints return 503 Service Unavailable
- API service not listed in `docker-compose ps`

#### Diagnosis
```bash
# Check if API service is running
docker-compose ps context-memory-api

# View API service logs
docker-compose logs context-memory-api

# Check port availability
netstat -tlnp | grep 8080
```

#### Solutions

**Service Not Started:**
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d context-memory-api
```

**Port Conflicts:**
```bash
# Check what's using port 8080
sudo lsof -i :8080

# Kill conflicting process or change port in docker-compose.yml
```

**Configuration Issues:**
```bash
# Verify configuration
curl http://localhost:8080/v1/config

# Check environment variables
docker-compose exec context-memory-api env | grep ASPNETCORE
```

### 2. Qdrant Vector Store Issues

#### Symptoms
- Vector operations fail
- Health check shows Qdrant as unhealthy
- "gRPC error" or "connection refused" messages

#### Diagnosis
```bash
# Check Qdrant service status
docker-compose ps qdrant

# View Qdrant logs
docker-compose logs qdrant

# Test Qdrant directly
curl http://localhost:6333/dashboard
```

#### Solutions

**Service Connection Issues:**
```bash
# Restart Qdrant service
docker-compose restart qdrant

# Check Qdrant health directly
curl http://localhost:6333/health
```

**Collection Issues:**
```bash
# Check collections via Qdrant API
curl http://localhost:6333/collections

# Recreate collection if needed (data loss warning)
curl -X DELETE http://localhost:6333/collections/context-memory
```

**Network Connectivity:**
```bash
# Test network connectivity from API service
docker-compose exec context-memory-api ping qdrant

# Check Docker network
docker network ls
docker network inspect context-memory-store_default
```

### 3. Neo4j Graph Store Issues

#### Symptoms
- Graph operations fail
- Neo4j shows as unhealthy
- APOC procedure errors

#### Diagnosis
```bash
# Check Neo4j service
docker-compose ps neo4j

# View Neo4j logs
docker-compose logs neo4j

# Access Neo4j browser
open http://localhost:7474
```

#### Solutions

**Authentication Issues:**
```bash
# Reset Neo4j authentication (development only)
docker-compose down
docker volume rm context-memory-store_neo4j_data
docker-compose up -d neo4j
```

**APOC Plugin Issues:**
```bash
# Verify APOC is loaded
curl -X POST http://localhost:7474/db/data/cypher \
  -H "Content-Type: application/json" \
  -d '{"query": "CALL apoc.help(\"apoc\")"}'
```

**Memory/Performance Issues:**
```bash
# Check Neo4j memory settings in docker-compose.yml
# Increase NEO4J_dbms_memory_heap_initial_size if needed
# Increase NEO4J_dbms_memory_heap_max_size if needed
```

### 4. Ollama LLM Service Issues

#### Symptoms
- LLM operations fail
- "model not found" errors
- Connection timeouts to Ollama

#### Diagnosis
```bash
# Check if Ollama is running on host
ps aux | grep ollama

# Test Ollama directly
curl http://localhost:11434/api/tags

# Check required models
ollama list
```

#### Solutions

**Ollama Not Running:**
```bash
# Start Ollama service
ollama serve

# Or start as background service (varies by OS)
```

**Models Not Available:**
```bash
# Pull required models
ollama pull llama3
ollama pull mxbai-embed-large

# Verify models are available
ollama list
```

**Host Connectivity Issues:**
```bash
# Test connectivity from container
docker-compose exec context-memory-api curl http://host.docker.internal:11434/api/tags

# Check Docker host networking
docker run --rm curlimages/curl:latest curl http://host.docker.internal:11434/api/tags
```

### 5. Docker Compose Issues

#### Symptoms
- Services fail to start
- "port already in use" errors
- Volume mount issues

#### Diagnosis
```bash
# Check Docker daemon
docker info

# View Docker Compose logs
docker-compose logs

# Check port conflicts
docker-compose ps
netstat -tlnp | grep -E '(6333|7474|7687|8080|9090|3000)'
```

#### Solutions

**Port Conflicts:**
```bash
# Stop conflicting services
sudo systemctl stop apache2  # if using port 8080
sudo systemctl stop postgresql  # if using port 5432

# Or modify ports in docker-compose.yml
```

**Volume Issues:**
```bash
# Reset all volumes (data loss warning)
docker-compose down -v
docker-compose up -d

# Fix permissions (Linux/Mac)
sudo chown -R $USER:$USER ./project
```

**Memory/Resource Issues:**
```bash
# Check Docker resource limits
docker system df
docker system prune -f

# Increase Docker memory limits in Docker Desktop settings
```

### 6. Integration Test Failures

#### Symptoms
- Tests timeout or fail
- "Service not available" errors during testing
- Inconsistent test results

#### Diagnosis
```bash
# Run unit tests only
dotnet test src/ContextMemoryStore.sln --filter "FullyQualifiedName~Unit"

# Run specific integration test
dotnet test src/ContextMemoryStore.sln --filter "GetHealth_ReturnsOkWithValidStructure"

# Check test environment
cat src/ContextMemoryStore.Tests/appsettings.Testing.json
```

#### Solutions

**Services Not Running:**
```bash
# Ensure Docker services are running before tests
docker-compose up -d
sleep 30  # Wait for services to be ready
dotnet test src/ContextMemoryStore.sln
```

**Test Environment Issues:**
```bash
# Reset test environment
docker-compose down
docker-compose up -d
./scripts/health-check.sh
dotnet test src/ContextMemoryStore.sln --filter "FullyQualifiedName~Integration"
```

**Testcontainers Issues:**
```bash
# Clean up test containers
docker container prune -f
docker volume prune -f

# Check Docker socket permissions (Linux)
sudo chmod 666 /var/run/docker.sock
```

## Performance Issues

### Slow Response Times

#### Diagnosis
```bash
# Check system metrics
curl http://localhost:8080/metrics

# Monitor container resources
docker stats

# Check system load
top
htop
```

#### Solutions

**Resource Constraints:**
```bash
# Increase Docker memory limits
# Modify docker-compose.yml resource limits

# Check disk space
df -h

# Clean up Docker resources
docker system prune -f
```

**Database Performance:**
```bash
# Check Qdrant collection size
curl http://localhost:6333/collections/context-memory/info

# Check Neo4j query performance in browser
# Use PROFILE in Cypher queries

# Consider adding indexes (Neo4j) or optimizing collection settings (Qdrant)
```

### Memory Leaks

#### Diagnosis
```bash
# Monitor memory usage over time
watch 'docker stats --no-stream'

# Check for memory leaks in API service
curl http://localhost:8080/v1/diagnostics
```

#### Solutions
```bash
# Restart services periodically
docker-compose restart

# Check for resource cleanup in application logs
docker-compose logs context-memory-api | grep -i "dispose\|cleanup"
```

## Monitoring and Alerting

### Health Check Automation
```bash
#!/bin/bash
# Create health-check-monitor.sh

while true; do
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
    if [ "$response" != "200" ]; then
        echo "$(date): Health check failed with status $response"
        # Add notification logic here
    fi
    sleep 60
done
```

### Log Monitoring
```bash
# Monitor all service logs
docker-compose logs -f

# Monitor specific service with filtering
docker-compose logs -f context-memory-api | grep -E "ERROR|WARN"

# Save logs for analysis
docker-compose logs > system-logs-$(date +%Y%m%d-%H%M%S).log
```

### Prometheus Alerts

Create `prometheus-alerts.yml`:
```yaml
groups:
  - name: context-memory-store
    rules:
      - alert: HealthCheckFailing
        expr: up{job="context-memory-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Context Memory Store API is down"
          
      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes{name="context-memory-api"} > 1073741824
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
```

## Recovery Procedures

### Complete System Recovery
```bash
#!/bin/bash
# emergency-recovery.sh

echo "Starting emergency recovery..."

# Stop all services
docker-compose down

# Clean up containers and volumes
docker container prune -f
docker volume prune -f
docker network prune -f

# Restart services
docker-compose up -d

# Wait for services to be ready
sleep 60

# Verify health
./scripts/health-check.sh

echo "Recovery complete"
```

### Data Recovery
```bash
# Restore from Git snapshots
cd project
git log --oneline  # Find last good commit
git checkout <commit-hash> -- vector-store.jsonl graph.cypher

# Restart services to load restored data
docker-compose restart
```

### Configuration Reset
```bash
# Reset to default configuration
cp config/defaults/* project/

# Or restore from Git
git checkout HEAD -- project/config.yaml

# Restart API service
docker-compose restart context-memory-api
```

## Getting Help

### Collecting Diagnostic Information
```bash
#!/bin/bash
# collect-diagnostics.sh

echo "Collecting diagnostic information..."
mkdir -p diagnostics/$(date +%Y%m%d-%H%M%S)
cd diagnostics/$(date +%Y%m%d-%H%M%S)

# System information
uname -a > system-info.txt
docker version > docker-version.txt
docker-compose version > docker-compose-version.txt

# Service status
docker-compose ps > service-status.txt
curl -s http://localhost:8080/health > health-check.json
curl -s http://localhost:8080/v1/diagnostics > system-diagnostics.json

# Logs
docker-compose logs > all-services.log
docker-compose logs context-memory-api > api-service.log

# Configuration
cp ../../docker-compose.yml .
cp ../../project/config.yaml .

echo "Diagnostics collected in: $(pwd)"
```

### Support Checklist

Before seeking help, ensure you have:

1. ✅ Collected diagnostic information
2. ✅ Verified Docker and Docker Compose versions
3. ✅ Checked service logs for error messages
4. ✅ Tested with minimal configuration
5. ✅ Reviewed recent changes to configuration
6. ✅ Attempted basic troubleshooting steps

### Reporting Issues

When reporting issues, include:

- System information (OS, Docker version)
- Service status and logs
- Configuration files
- Steps to reproduce the issue
- Expected vs actual behavior
- Diagnostic output from scripts above

---

*This troubleshooting guide covers common scenarios in the Context Memory Store system. For additional support, refer to the [Usage Guide](usage-guide.md) and [API Documentation](api-design.md).*