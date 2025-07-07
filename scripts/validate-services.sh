#!/bin/bash
# Service Functionality Validation Script for Context Memory Store
# Tests actual service functionality beyond basic health checks
# WARNING: PROOF OF CONCEPT ONLY - NOT FOR PRODUCTION USE

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=15
# Neo4j authentication disabled for local development
# Grafana authentication disabled for local development (anonymous access enabled)

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

validate_qdrant() {
    log_info "Validating Qdrant functionality..."
    
    # Test collection creation
    local collection_name="validation-test-$(date +%s)"
    
    if curl -s --max-time $TIMEOUT -X PUT "http://localhost:6333/collections/$collection_name" \
        -H "Content-Type: application/json" \
        -d '{"vectors": {"size": 4, "distance": "Cosine"}}' > /dev/null; then
        log_success "Qdrant collection creation successful"
    else
        log_error "Qdrant collection creation failed"
        return 1
    fi
    
    # Test collection listing
    if curl -s --max-time $TIMEOUT "http://localhost:6333/collections" | grep -q "$collection_name"; then
        log_success "Qdrant collection listing working"
    else
        log_warning "Qdrant collection not found in listing"
    fi
    
    # Test vector insertion
    if curl -s --max-time $TIMEOUT -X PUT "http://localhost:6333/collections/$collection_name/points" \
        -H "Content-Type: application/json" \
        -d '{
            "points": [
                {
                    "id": 1,
                    "vector": [0.1, 0.2, 0.3, 0.4],
                    "payload": {"test": "validation"}
                }
            ]
        }' > /dev/null; then
        log_success "Qdrant vector insertion successful"
    else
        log_error "Qdrant vector insertion failed"
        return 1
    fi
    
    # Test vector search
    if curl -s --max-time $TIMEOUT -X POST "http://localhost:6333/collections/$collection_name/points/search" \
        -H "Content-Type: application/json" \
        -d '{
            "vector": [0.1, 0.2, 0.3, 0.4],
            "limit": 1
        }' | grep -q "validation"; then
        log_success "Qdrant vector search working"
    else
        log_warning "Qdrant vector search may not be working correctly"
    fi
    
    # Cleanup test collection
    curl -s --max-time $TIMEOUT -X DELETE "http://localhost:6333/collections/$collection_name" > /dev/null
    
    return 0
}

validate_neo4j() {
    log_info "Validating Neo4j functionality..."
    
    # Test basic authentication and connectivity
    if curl -s --max-time $TIMEOUT \
        -H "Content-Type: application/json" \
        -X POST "http://localhost:7474/db/neo4j/tx/commit" \
        -d '{"statements":[{"statement":"RETURN 1 as test"}]}' | grep -q "test"; then
        log_success "Neo4j authentication and basic queries working"
    else
        log_error "Neo4j authentication or query execution failed"
        return 1
    fi
    
    # Test APOC availability
    if curl -s --max-time $TIMEOUT \
        -H "Content-Type: application/json" \
        -X POST "http://localhost:7474/db/neo4j/tx/commit" \
        -d '{"statements":[{"statement":"CALL apoc.help(\"apoc\") YIELD name RETURN count(name) as apoc_procedures"}]}' | grep -q "apoc_procedures"; then
        
        local apoc_response=$(curl -s --max-time $TIMEOUT \
            -H "Content-Type: application/json" \
            -X POST "http://localhost:7474/db/neo4j/tx/commit" \
            -d '{"statements":[{"statement":"CALL apoc.help(\"apoc\") YIELD name RETURN count(name) as apoc_procedures"}]}')
        
        local apoc_count=$(echo "$apoc_response" | grep -o '"row":\[[0-9]*\]' | grep -o '[0-9]*' | head -1)
        
        if [ -n "$apoc_count" ] && [ "$apoc_count" -gt 400 ]; then
            log_success "Neo4j APOC procedures are available ($apoc_count procedures)"
        else
            log_success "Neo4j APOC procedures are available"
        fi
    else
        log_error "Neo4j APOC procedures not available"
        return 1
    fi
    
    # Test APOC utility functions
    if curl -s --max-time $TIMEOUT \
        -H "Content-Type: application/json" \
        -X POST "http://localhost:7474/db/neo4j/tx/commit" \
        -d '{"statements":[{"statement":"RETURN apoc.version() as version"}]}' | grep -q "version"; then
        log_success "Neo4j APOC utility functions working"
    else
        log_error "Neo4j APOC utility functions not working"
        return 1
    fi
    
    # Test graph operations
    local test_label="ValidationTest$(date +%s)"
    
    # Create test node
    if curl -s --max-time $TIMEOUT \
        -H "Content-Type: application/json" \
        -X POST "http://localhost:7474/db/neo4j/tx/commit" \
        -d "{\"statements\":[{\"statement\":\"CREATE (n:$test_label {name: 'test', timestamp: timestamp()}) RETURN n.name as name\"}]}" | grep -q "test"; then
        log_success "Neo4j node creation successful"
    else
        log_error "Neo4j node creation failed"
        return 1
    fi
    
    # Query test node
    if curl -s --max-time $TIMEOUT \
        -H "Content-Type: application/json" \
        -X POST "http://localhost:7474/db/neo4j/tx/commit" \
        -d "{\"statements\":[{\"statement\":\"MATCH (n:$test_label) RETURN n.name as name\"}]}" | grep -q "test"; then
        log_success "Neo4j node querying working"
    else
        log_warning "Neo4j node querying may not be working correctly"
    fi
    
    # Cleanup test nodes
    curl -s --max-time $TIMEOUT \
        -H "Content-Type: application/json" \
        -X POST "http://localhost:7474/db/neo4j/tx/commit" \
        -d "{\"statements\":[{\"statement\":\"MATCH (n:$test_label) DELETE n\"}]}" > /dev/null
    
    # Test metrics endpoint
    if curl -s --max-time $TIMEOUT "http://localhost:2004/metrics" | grep -q "neo4j"; then
        log_success "Neo4j metrics endpoint working"
    else
        log_warning "Neo4j metrics endpoint may not be properly configured"
    fi
    
    return 0
}

validate_prometheus() {
    log_info "Validating Prometheus functionality..."
    
    # Test targets
    if curl -s --max-time $TIMEOUT "http://localhost:9090/api/v1/targets" | grep -q "neo4j\|qdrant\|grafana"; then
        log_success "Prometheus has configured targets"
    else
        log_warning "Prometheus targets may not be fully configured"
    fi
    
    # Test query capability
    if curl -s --max-time $TIMEOUT "http://localhost:9090/api/v1/query?query=up" | grep -q "metric"; then
        log_success "Prometheus query engine working"
    else
        log_error "Prometheus query engine not working"
        return 1
    fi
    
    # Test rules (if any)
    curl -s --max-time $TIMEOUT "http://localhost:9090/api/v1/rules" > /dev/null
    if [ $? -eq 0 ]; then
        log_success "Prometheus rules endpoint accessible"
    else
        log_warning "Prometheus rules endpoint may have issues"
    fi
    
    return 0
}

validate_grafana() {
    log_info "Validating Grafana functionality..."
    
    # Test anonymous access
    if curl -s --max-time $TIMEOUT \
        "http://localhost:3000/api/org" | grep -q "Main Org"; then
        log_success "Grafana anonymous access working"
    else
        log_error "Grafana anonymous access failed"
        return 1
    fi
    
    # Test data sources
    if curl -s --max-time $TIMEOUT \
        "http://localhost:3000/api/datasources" | grep -q "prometheus"; then
        log_success "Grafana data sources configured"
    else
        log_warning "Grafana data sources may not be properly configured"
    fi
    
    # Test dashboard API
    if curl -s --max-time $TIMEOUT \
        "http://localhost:3000/api/search" > /dev/null; then
        log_success "Grafana dashboard API accessible"
    else
        log_warning "Grafana dashboard API may have issues"
    fi
    
    return 0
}

validate_ollama() {
    log_info "Validating Ollama functionality..."
    
    # Test version endpoint
    if curl -s --max-time $TIMEOUT "http://localhost:11434/api/version" | grep -q "version"; then
        log_success "Ollama version endpoint accessible"
    else
        log_warning "Ollama service not accessible - this is optional"
        return 1
    fi
    
    # Test model listing
    if curl -s --max-time $TIMEOUT "http://localhost:11434/api/tags" | grep -q "models"; then
        log_success "Ollama model listing working"
        
        # Check for required models
        local models_response=$(curl -s --max-time $TIMEOUT "http://localhost:11434/api/tags")
        if echo "$models_response" | grep -q "llama3"; then
            log_success "Ollama has llama3 model available"
        else
            log_warning "llama3 model not found in Ollama"
        fi
        
        if echo "$models_response" | grep -q "mxbai-embed-large"; then
            log_success "Ollama has mxbai-embed-large model available"
        else
            log_warning "mxbai-embed-large model not found in Ollama"
        fi
    else
        log_warning "Ollama model listing not working or no models installed"
    fi
    
    return 0
}

main() {
    echo "🔍 Context Memory Store - Service Functionality Validation"
    echo "========================================================="
    echo ""
    
    local failed_validations=0
    
    # Validate each service
    validate_qdrant || ((failed_validations++))
    echo ""
    
    validate_neo4j || ((failed_validations++))
    echo ""
    
    validate_prometheus || ((failed_validations++))
    echo ""
    
    validate_grafana || ((failed_validations++))
    echo ""
    
    # Ollama is optional
    validate_ollama || log_info "Ollama validation skipped (service not available)"
    echo ""
    
    echo "========================================================"
    
    if [ $failed_validations -eq 0 ]; then
        log_success "All service functionality validations passed! 🎉"
        exit 0
    else
        log_error "$failed_validations service(s) failed functionality validation"
        echo ""
        echo "Troubleshooting recommendations:"
        echo "1. Check service logs: docker-compose logs [service-name]"
        echo "2. Verify service configuration files in config/ directory"
        echo "3. Restart failing services: docker-compose restart [service-name]"
        echo "4. For Neo4j APOC issues, check NEO4J_PLUGINS environment variable"
        exit 1
    fi
}

# Handle script interruption
trap 'log_warning "Validation interrupted"; exit 130' INT TERM

# Check dependencies
for cmd in curl; do
    if ! command -v $cmd &> /dev/null; then
        log_error "$cmd is not installed. Please install required dependencies."
        exit 1
    fi
done

# Run main function
main "$@"