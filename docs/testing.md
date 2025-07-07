# Testing Framework

This document describes the comprehensive testing framework for the Context Memory Store system.

## Overview

The testing framework provides multiple levels of validation to ensure all infrastructure components are working correctly:

1. **Quick Health Checks** - Fast verification that services are responding
2. **Comprehensive Infrastructure Tests** - Full Docker-based testing with service functionality validation
3. **Service Functionality Validation** - In-depth testing of actual service capabilities
4. **Extended Testing** - Optional tests for APOC procedures and external dependencies

## Testing Scripts

### 1. Quick Health Check (`scripts/health-check.sh`)

A lightweight script that quickly checks if all services are responding to basic requests.

```bash
# Run quick health check
./scripts/health-check.sh
```

**What it checks:**
- Service health endpoints (Qdrant, Neo4j, Prometheus, Grafana)
- Metrics endpoints availability
- External Ollama service (optional)

**Use when:**
- You want a fast status check
- Debugging service availability issues
- Verifying services after restart

### 2. Comprehensive Infrastructure Tests (`test.sh`)

The main testing script that runs a complete Docker-based test environment.

```bash
# Run full infrastructure tests
./test.sh
```

**What it does:**
- Starts isolated test environment using `docker-compose.test.yml`
- Validates all service health and metrics endpoints
- Tests basic functionality of each service
- Includes external dependency checking
- Provides detailed logging and error reporting
- Automatically cleans up after testing

**Features:**
- Colored output for easy reading
- Retry logic for service startup
- Timeout protection (5-minute default)
- Comprehensive error reporting with service logs
- Pre-flight dependency checking

### 3. Service Functionality Validation (`scripts/validate-services.sh`)

Tests actual service functionality beyond basic health checks.

```bash
# Run service functionality validation
./scripts/validate-services.sh
```

**What it validates:**

#### Qdrant
- Collection creation and listing
- Vector insertion and search operations
- Basic semantic search functionality

#### Neo4j
- Authentication and basic queries
- APOC procedures availability
- Graph node creation and querying
- Metrics endpoint functionality

#### Prometheus
- Target configuration and discovery
- Query engine functionality
- Rules endpoint accessibility

#### Grafana
- Authentication system
- Data source configuration
- Dashboard API accessibility

#### Ollama (Optional)
- Version endpoint access
- Model listing and availability
- Required models (llama3, mxbai-embed-large) presence

## Docker Test Configuration

### Main Test Configuration (`docker-compose.test.yml`)

The test configuration extends the main `docker-compose.yml` and includes:

- **test-runner**: Main test orchestrator that validates all services
- **neo4j-validator**: Extended Neo4j testing (APOC procedures)
- **ollama-validator**: Extended Ollama testing (model availability)

### Test Profiles

#### Default Profile
Runs basic infrastructure validation:
```bash
docker-compose -f docker-compose.test.yml up
```

#### Extended Tests Profile
Includes additional validation containers:
```bash
docker-compose -f docker-compose.test.yml --profile extended-tests up
```

## Test Flow

### 1. Pre-Test Phase
- Dependency checking (Docker, Docker Compose, curl)
- External service availability (Ollama)
- Cleanup of any existing test containers
- Warning about running main containers

### 2. Test Execution Phase
- Service startup with health check dependencies
- Basic connectivity validation
- Functionality testing for each service
- Inter-service communication verification
- External dependency testing

### 3. Post-Test Phase
- Comprehensive cleanup of containers and volumes
- Removal of dangling images
- Test result reporting
- Error log display on failure

## Error Handling and Troubleshooting

### Common Issues

1. **Service Startup Timeout**
   - Increase `TEST_TIMEOUT` in `test.sh`
   - Check Docker resource allocation
   - Verify port availability

2. **Ollama Not Available**
   - Tests will continue with warnings
   - Install Ollama on host machine
   - Ensure Ollama is running: `ollama serve`

3. **Neo4j APOC Issues**
   - Check `NEO4J_PLUGINS=apoc` in environment
   - Verify APOC plugin installation in container
   - Review Neo4j logs for plugin loading errors

4. **Port Conflicts**
   - Stop any running services: `docker-compose down`
   - Check for other applications using ports 6333, 7474, 7687, 2004, 9090, 3000

### Debug Information

When tests fail, the framework automatically provides:
- Last 50 lines of logs from each service
- Specific error messages with context
- Troubleshooting recommendations
- Links to relevant documentation

## Integration with Development Workflow

### Before Committing Code
```bash
# Quick verification
./scripts/health-check.sh

# Full validation if making infrastructure changes
./test.sh
```

### After Infrastructure Changes
```bash
# Full test suite
./test.sh

# Detailed functionality validation
./scripts/validate-services.sh
```

### Continuous Integration
The test scripts are designed to work in CI environments:
- Exit codes indicate success/failure
- Comprehensive logging for debugging
- Timeout protection prevents hanging builds
- Clean isolation using Docker

## Configuration

### Environment Variables

Test scripts respect the following environment variables:

- `TEST_TIMEOUT`: Maximum test execution time (default: 300 seconds)
- `RETRY_COUNT`: Number of retries for external services (default: 3)
- `RETRY_DELAY`: Delay between retries (default: 5 seconds)

### Service Credentials

Test scripts use the default POC credentials:
- Neo4j: No authentication required (disabled for local development)
- Grafana: `admin` / `contextmemory`

## Security Considerations

⚠️ **PROOF OF CONCEPT ONLY**: This testing framework is designed for local development and testing environments only. It uses default credentials and makes network requests that are not suitable for production environments.

## Future Enhancements

Planned improvements for the testing framework:
- Performance benchmarking tests
- Load testing capabilities
- Integration with CI/CD pipelines
- Automated test report generation
- Test coverage metrics