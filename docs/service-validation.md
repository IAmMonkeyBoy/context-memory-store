# Service Validation Guide

This document provides comprehensive guidance for validating the Context Memory Store infrastructure and ensuring all services are functioning correctly.

## Overview

The Context Memory Store validation framework provides multiple levels of testing and validation to ensure system reliability and functionality. This guide covers all validation procedures implemented during Phase 2: Service Integration Testing & Validation.

## Validation Levels

### Level 1: Health Checks (Basic)
Quick verification that services are running and responding to basic requests.

### Level 2: Functionality Validation (Standard)
Validation of core service capabilities and operations.

### Level 3: Comprehensive Testing (Advanced)
In-depth testing of service functionality, inter-service communication, and end-to-end workflows.

## Testing Scripts Reference

### 1. Quick Health Check (`scripts/health-check.sh`)

**Purpose**: Fast verification of service availability

**Usage**:
```bash
./scripts/health-check.sh
```

**What it validates**:
- Service health endpoints respond
- Basic connectivity to all services
- External dependencies (Ollama) availability

**When to use**:
- Quick status check during development
- Debugging service availability
- After service restarts
- As a pre-commit check

**Expected output**:
```
🔍 Context Memory Store - Health Check
=====================================
✅ Qdrant health endpoint accessible
✅ Neo4j health endpoint accessible  
✅ Prometheus health endpoint accessible
✅ Grafana health endpoint accessible
⚠️  Ollama service not accessible (optional)
✅ All critical services are healthy! 🎉
```

### 2. Service Functionality Validation (`scripts/validate-services.sh`)

**Purpose**: Validate actual service capabilities beyond health checks

**Usage**:
```bash
./scripts/validate-services.sh
```

**What it validates**:

#### Qdrant Validation
- ✅ Collection creation and listing
- ✅ Vector insertion operations
- ✅ Basic vector search functionality
- ✅ Collection management

#### Neo4j Validation
- ✅ Authentication and basic queries
- ✅ APOC procedures availability (436+ procedures expected)
- ✅ Graph node creation and querying
- ✅ Metrics endpoint functionality

#### Prometheus Validation
- ✅ Target configuration and discovery
- ✅ Query engine functionality
- ✅ Rules endpoint accessibility
- ✅ Service monitoring

#### Grafana Validation
- ✅ Authentication system
- ✅ Data source configuration
- ✅ Dashboard API accessibility
- ✅ Anonymous access functionality

#### Ollama Validation (Optional)
- ✅ Version endpoint access
- ✅ Model listing availability
- ✅ Required models presence (llama3, mxbai-embed-large)

**Expected output**:
```
🔍 Context Memory Store - Service Functionality Validation
=========================================================
✅ Qdrant: Collection creation, listing, vector insertion working
✅ Neo4j: Authentication, queries, APOC procedures (436 available)
✅ Prometheus: Target configuration and query engine working
✅ Grafana: Data sources and dashboard API accessible
⚠️  Ollama: Service not accessible (optional)
✅ All service functionality validations passed! 🎉
```

### 3. Comprehensive Service Testing (`scripts/comprehensive-service-tests.sh`)

**Purpose**: Advanced functional testing with 100% coverage of service capabilities

**Usage**:
```bash
./scripts/comprehensive-service-tests.sh
```

**What it validates**:

#### Comprehensive Qdrant Testing
- ✅ Collection creation with 4-dimensional vectors
- ✅ Collection info retrieval and validation
- ✅ Batch vector insertion with metadata payloads
- ✅ Vector similarity search with payload return
- ✅ Filter-based vector search by metadata categories
- ✅ Collection statistics accuracy

#### Comprehensive Prometheus Testing
- ✅ Service target validation for all services
- ✅ Metrics collection from configured targets
- ✅ Query functionality with aggregation
- ✅ API response format validation

#### Comprehensive Grafana Testing
- ✅ Prometheus data source configuration
- ✅ Data source health check validation
- ✅ Query proxy functionality to Prometheus
- ✅ Dashboard API endpoint validation

#### End-to-End Integration Testing
- ✅ Grafana → Prometheus → Service metrics flow
- ✅ Neo4j and Qdrant concurrent operations
- ✅ Inter-service communication validation
- ✅ Service connectivity chains

#### Test Coverage Validation (Addresses Issue #12)
- ✅ Data persistence verification
- ✅ Functional operations beyond health checks
- ✅ 100% functional test coverage achievement

**Expected output**:
```
🔍 Comprehensive Qdrant Vector Operations Testing
============================================================
✅ Qdrant collection creation successful
✅ Qdrant collection info retrieval working
✅ Qdrant batch vector insertion successful
✅ Qdrant vector search with payload return working
✅ Qdrant filter-based search working
✅ Qdrant collection statistics accurate

🔍 Comprehensive Prometheus Metrics Collection Testing
============================================================
✅ Prometheus target 'qdrant' configured
✅ Prometheus target 'grafana' configured
✅ Prometheus aggregation queries working

🔍 Comprehensive Grafana Dashboard and Data Source Testing
============================================================
✅ Grafana Prometheus data source properly configured
✅ Grafana query proxy to Prometheus working

🔍 End-to-End Service Connectivity Testing
============================================================
✅ Neo4j and Qdrant concurrent operation readiness confirmed

🔍 Test Coverage Validation (Addresses Issue #12)
============================================================
✅ Test data persisted correctly in Qdrant
✅ Test coverage validation passed: 100% functional tests working

✅ All comprehensive service functionality tests passed! 🎉
```

### 4. Docker-based Integration Testing (`test.sh`)

**Purpose**: Complete infrastructure validation in isolated Docker environment

**Usage**:
```bash
./test.sh
```

**What it provides**:
- ✅ Isolated test environment using `docker-compose.test.yml`
- ✅ Dependency validation and service startup
- ✅ Comprehensive functionality testing
- ✅ External service integration (Ollama)
- ✅ Automatic cleanup and reporting

**Extended testing profiles**:
```bash
# Run with extended validation containers
docker-compose -f docker-compose.test.yml --profile extended-tests up --abort-on-container-exit

# Run comprehensive testing container
docker-compose -f docker-compose.test.yml --profile comprehensive-tests up comprehensive-validator --abort-on-container-exit
```

## Testing Workflow for Different Scenarios

### Pre-Commit Validation
```bash
# Quick verification before committing changes
./scripts/health-check.sh

# Full validation for infrastructure changes
./scripts/validate-services.sh
```

### Development Testing
```bash
# During active development
./scripts/health-check.sh        # Fast feedback

# After configuration changes
./scripts/validate-services.sh   # Functional verification

# For major infrastructure work
./scripts/comprehensive-service-tests.sh  # Full validation
```

### Release Validation
```bash
# Complete test suite before release
./test.sh                                    # Full Docker-based testing
./scripts/comprehensive-service-tests.sh     # Advanced functionality testing
```

### Debugging and Troubleshooting
```bash
# 1. Quick status check
docker-compose ps
./scripts/health-check.sh

# 2. Service functionality check
./scripts/validate-services.sh

# 3. Advanced diagnostics
./scripts/comprehensive-service-tests.sh

# 4. Container-level debugging
docker-compose logs [service-name]
```

## Validation Success Criteria

### Basic Health Check Success
- ✅ All critical services respond to health endpoints
- ✅ No connection timeouts or errors
- ✅ Basic connectivity established

### Functional Validation Success
- ✅ Qdrant: Vector operations working
- ✅ Neo4j: APOC procedures available (436+)
- ✅ Prometheus: Metrics collection active
- ✅ Grafana: Data sources configured

### Comprehensive Testing Success
- ✅ 100% functional test coverage achieved
- ✅ All service operations validated
- ✅ End-to-end connectivity confirmed
- ✅ Data persistence verified
- ✅ Inter-service communication working

## Continuous Integration Integration

### Environment Variables
```bash
export TEST_TIMEOUT=300      # Maximum test duration (seconds)
export RETRY_COUNT=3         # Number of retries for external services
export RETRY_DELAY=5         # Delay between retries (seconds)
```

### CI/CD Pipeline Integration
```yaml
# Example GitHub Actions workflow
- name: Infrastructure Validation
  run: |
    ./scripts/health-check.sh
    ./scripts/validate-services.sh
    ./test.sh

- name: Comprehensive Testing
  run: ./scripts/comprehensive-service-tests.sh
```

### Exit Codes and Automation
- **0**: All tests passed successfully
- **1**: Test failures detected
- **130**: Tests interrupted (Ctrl+C)

## Security Considerations

⚠️ **PROOF OF CONCEPT ONLY**: This validation framework is designed for local development and testing environments only. It uses:
- Default credentials for simplicity
- Disabled authentication for ease of testing
- Unrestricted network access for POC purposes

## Troubleshooting Validation Issues

### Common Validation Failures

#### 1. Service Startup Issues
**Symptoms**: Health checks fail, containers not running
**Solutions**:
```bash
# Check container status
docker-compose ps

# Review startup logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]
```

#### 2. APOC Procedures Not Available
**Symptoms**: Neo4j validation reports fewer than 436 procedures
**Solutions**:
```bash
# Check APOC installation
docker logs context-memory-neo4j | grep -i apoc

# Restart Neo4j with APOC downloader
docker-compose restart neo4j-apoc-downloader neo4j
```

#### 3. Metrics Collection Issues
**Symptoms**: Prometheus validation fails, targets not configured
**Solutions**:
```bash
# Check Prometheus configuration
curl http://localhost:9090/api/v1/targets

# Verify service metrics endpoints
curl http://localhost:6333/metrics
curl http://localhost:2004/metrics
```

#### 4. Comprehensive Test Failures
**Symptoms**: Advanced functionality tests fail
**Solutions**:
```bash
# Run individual validation steps
./scripts/validate-services.sh

# Check service logs for errors
docker-compose logs --tail=50

# Verify data persistence
docker exec -it context-memory-qdrant ls -la /qdrant/storage
```

## Future Enhancements

### Planned Validation Improvements
- Performance benchmarking tests
- Load testing capabilities
- Automated test report generation
- Integration with monitoring systems
- Test coverage metrics and reporting

### Metric-Based Validation
- Response time thresholds
- Resource utilization limits
- Error rate monitoring
- Service availability SLAs

## Summary

The Context Memory Store validation framework provides comprehensive testing capabilities across multiple levels:

1. **Health Checks** for quick status verification
2. **Functionality Validation** for core service capabilities
3. **Comprehensive Testing** for complete functional coverage
4. **Integration Testing** for end-to-end validation

This multi-layered approach ensures system reliability and provides confidence in the infrastructure's ability to support the Context Memory Store application.