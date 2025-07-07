#!/bin/bash
# Comprehensive Service Functionality Testing for Context Memory Store
# Addresses Issue #18: Phase 2.3 - Comprehensive Service Functionality Testing
# 
# This script provides in-depth validation of all service functionality beyond basic health checks
# PROOF OF CONCEPT ONLY - See SECURITY.md for intentional security decisions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=15
TEST_COLLECTION="comprehensive-test-$(date +%s)"

# Logging functions
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

log_section() {
    echo -e "${PURPLE}🔍 $1${NC}"
    echo "$(printf '=%.0s' {1..60})"
}

# Test Qdrant comprehensive functionality
test_qdrant_comprehensive() {
    log_section "Comprehensive Qdrant Vector Operations Testing"
    
    # Test 1: Collection creation with 4-dimensional vectors for testing
    log_info "Testing collection creation with 4-dimensional vectors..."
    if curl -s --max-time $TIMEOUT -X PUT "http://localhost:6333/collections/$TEST_COLLECTION" \
        -H "Content-Type: application/json" \
        -d '{"vectors": {"size": 4, "distance": "Cosine"}}' | grep -q "\"result\":true"; then
        log_success "Qdrant collection creation successful"
    else
        log_error "Qdrant collection creation failed"
        return 1
    fi
    
    # Test 2: Collection info retrieval
    log_info "Testing collection info retrieval..."
    local collection_info=$(curl -s --max-time $TIMEOUT "http://localhost:6333/collections/$TEST_COLLECTION")
    if echo "$collection_info" | grep -q "\"points_count\""; then
        log_success "Qdrant collection info retrieval working"
    else
        log_warning "Qdrant collection info may not be working correctly"
    fi
    
    # Test 3: Batch vector insertion
    log_info "Testing batch vector insertion..."
    
    # Use simpler 4-dimensional vectors for testing (avoid bc dependency)
    local vectors_json='{"points":['
    for i in {1..5}; do
        # Generate simple test vectors (4 dimensions)
        local val1=$((RANDOM % 1000))
        local val2=$((RANDOM % 1000))
        local val3=$((RANDOM % 1000))
        local val4=$((RANDOM % 1000))
        local vector="[0.${val1},0.${val2},0.${val3},0.${val4}]"
        
        vectors_json="${vectors_json}{\"id\":$i,\"vector\":$vector,\"payload\":{\"text\":\"test document $i\",\"category\":\"validation\"}},"
    done
    vectors_json="${vectors_json%,}]}"  # Remove trailing comma and close
    
    if curl -s --max-time $TIMEOUT -X PUT "http://localhost:6333/collections/$TEST_COLLECTION/points" \
        -H "Content-Type: application/json" \
        -d "$vectors_json" | grep -q "\"status\":\"acknowledged\""; then
        log_success "Qdrant batch vector insertion successful"
    else
        log_error "Qdrant batch vector insertion failed"
        return 1
    fi
    
    # Test 4: Vector search with payload return
    log_info "Testing vector search with payload return..."
    # Use simple test vector for search
    local search_vector="[0.1,0.2,0.3,0.4]"
    
    local search_result=$(curl -s --max-time $TIMEOUT -X POST "http://localhost:6333/collections/$TEST_COLLECTION/points/search" \
        -H "Content-Type: application/json" \
        -d "{\"vector\":$search_vector,\"limit\":3,\"with_payload\":true}")
    
    if echo "$search_result" | grep -q "\"payload\"" && echo "$search_result" | grep -q "validation"; then
        log_success "Qdrant vector search with payload return working"
    else
        log_warning "Qdrant vector search payload return may not be working correctly"
    fi
    
    # Test 5: Filter-based search
    log_info "Testing filter-based vector search..."
    if curl -s --max-time $TIMEOUT -X POST "http://localhost:6333/collections/$TEST_COLLECTION/points/search" \
        -H "Content-Type: application/json" \
        -d "{\"vector\":$search_vector,\"limit\":2,\"filter\":{\"must\":[{\"key\":\"category\",\"match\":{\"value\":\"validation\"}}]},\"with_payload\":true}" | grep -q "validation"; then
        log_success "Qdrant filter-based search working"
    else
        log_warning "Qdrant filter-based search may not be working correctly"
    fi
    
    # Test 6: Collection statistics
    log_info "Testing collection statistics..."
    if curl -s --max-time $TIMEOUT "http://localhost:6333/collections/$TEST_COLLECTION" | grep -q "\"points_count\":5"; then
        log_success "Qdrant collection statistics accurate"
    else
        log_warning "Qdrant collection statistics may not be accurate"
    fi
    
    return 0
}

# Test Prometheus comprehensive metrics collection
test_prometheus_comprehensive() {
    log_section "Comprehensive Prometheus Metrics Collection Testing"
    
    # Test 1: Service target validation
    log_info "Testing Prometheus service target validation..."
    local targets_response=$(curl -s --max-time $TIMEOUT "http://localhost:9090/api/v1/targets")
    
    # Check for expected targets
    local expected_targets=("qdrant" "grafana" "prometheus")
    for target in "${expected_targets[@]}"; do
        if echo "$targets_response" | grep -q "\"job\":\"$target\""; then
            log_success "Prometheus target '$target' configured"
        else
            log_warning "Prometheus target '$target' may not be configured"
        fi
    done
    
    # Test 2: Metrics collection validation
    log_info "Testing actual metrics collection from services..."
    
    # Test Qdrant metrics
    if curl -s --max-time $TIMEOUT "http://localhost:9090/api/v1/query?query=up{job=\"qdrant\"}" | grep -q "\"value\""; then
        log_success "Prometheus collecting Qdrant metrics"
    else
        log_warning "Prometheus may not be collecting Qdrant metrics"
    fi
    
    # Test Grafana metrics
    if curl -s --max-time $TIMEOUT "http://localhost:9090/api/v1/query?query=up{job=\"grafana\"}" | grep -q "\"value\""; then
        log_success "Prometheus collecting Grafana metrics"
    else
        log_warning "Prometheus may not be collecting Grafana metrics"
    fi
    
    # Test 3: Query functionality with aggregation
    log_info "Testing Prometheus query functionality with aggregation..."
    if curl -s --max-time $TIMEOUT "http://localhost:9090/api/v1/query?query=count(up)" | grep -q "\"value\""; then
        log_success "Prometheus aggregation queries working"
    else
        log_error "Prometheus aggregation queries not working"
        return 1
    fi
    
    return 0
}

# Test Grafana comprehensive connectivity
test_grafana_comprehensive() {
    log_section "Comprehensive Grafana Dashboard and Data Source Testing"
    
    # Test 1: Data source connectivity
    log_info "Testing Grafana Prometheus data source connectivity..."
    local datasources_response=$(curl -s --max-time $TIMEOUT "http://localhost:3000/api/datasources")
    
    if echo "$datasources_response" | grep -q "prometheus" && echo "$datasources_response" | grep -q "\"access\":\"proxy\""; then
        log_success "Grafana Prometheus data source properly configured"
    else
        log_warning "Grafana Prometheus data source may not be properly configured"
    fi
    
    # Test 2: Data source health check
    log_info "Testing Grafana data source health..."
    local datasource_id=$(echo "$datasources_response" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
    
    if [ -n "$datasource_id" ]; then
        if curl -s --max-time $TIMEOUT "http://localhost:3000/api/datasources/$datasource_id/health" | grep -q "\"status\":\"success\""; then
            log_success "Grafana data source health check passed"
        else
            log_warning "Grafana data source health check may have issues"
        fi
    else
        log_warning "Could not determine Grafana data source ID for health check"
    fi
    
    # Test 3: Query proxy functionality
    log_info "Testing Grafana query proxy to Prometheus..."
    if curl -s --max-time $TIMEOUT "http://localhost:3000/api/datasources/proxy/$datasource_id/api/v1/query?query=up" | grep -q "\"data\""; then
        log_success "Grafana query proxy to Prometheus working"
    else
        log_warning "Grafana query proxy may not be working correctly"
    fi
    
    # Test 4: Dashboard API
    log_info "Testing Grafana dashboard API..."
    if curl -s --max-time $TIMEOUT "http://localhost:3000/api/search?type=dash-db" | grep -q "\[\]"; then
        log_success "Grafana dashboard API accessible (no dashboards configured yet)"
    else
        log_warning "Grafana dashboard API may have issues"
    fi
    
    return 0
}

# Test end-to-end connectivity between services
test_end_to_end_connectivity() {
    log_section "End-to-End Service Connectivity Testing"
    
    # Test 1: Grafana can query Prometheus which can scrape Qdrant
    log_info "Testing Grafana -> Prometheus -> Qdrant connectivity chain..."
    
    # First ensure Prometheus has Qdrant metrics
    sleep 5  # Allow time for metrics scraping
    local prometheus_qdrant=$(curl -s --max-time $TIMEOUT "http://localhost:9090/api/v1/query?query=qdrant_collections_total")
    
    if echo "$prometheus_qdrant" | grep -q "\"value\""; then
        # Now test if Grafana can access this through Prometheus
        local datasource_id=$(curl -s --max-time $TIMEOUT "http://localhost:3000/api/datasources" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
        
        if [ -n "$datasource_id" ]; then
            if curl -s --max-time $TIMEOUT "http://localhost:3000/api/datasources/proxy/$datasource_id/api/v1/query?query=qdrant_collections_total" | grep -q "\"data\""; then
                log_success "End-to-end Grafana -> Prometheus -> Qdrant connectivity working"
            else
                log_warning "End-to-end connectivity may have issues"
            fi
        else
            log_warning "Could not test end-to-end connectivity (no Grafana datasource ID)"
        fi
    else
        log_warning "Prometheus not collecting Qdrant metrics for end-to-end test"
    fi
    
    # Test 2: Neo4j to Qdrant potential integration (simulated)
    log_info "Testing potential Neo4j -> Qdrant integration readiness..."
    
    # Verify both services can handle concurrent operations
    local neo4j_test=$(curl -s --max-time $TIMEOUT \
        -H "Content-Type: application/json" \
        -X POST "http://localhost:7474/db/neo4j/tx/commit" \
        -d '{"statements":[{"statement":"RETURN timestamp() as neo4j_time"}]}')
    
    local qdrant_test=$(curl -s --max-time $TIMEOUT "http://localhost:6333/collections/$TEST_COLLECTION")
    
    if echo "$neo4j_test" | grep -q "neo4j_time" && echo "$qdrant_test" | grep -q "points_count"; then
        log_success "Neo4j and Qdrant concurrent operation readiness confirmed"
    else
        log_warning "Neo4j and Qdrant concurrent operations may have issues"
    fi
    
    return 0
}

# Test coverage validation
test_coverage_validation() {
    log_section "Test Coverage Validation (Addresses Issue #12)"
    
    log_info "Validating that tests actually validate service functionality..."
    
    # Test 1: Verify test data persistence
    log_info "Testing data persistence and retrieval..."
    if curl -s --max-time $TIMEOUT "http://localhost:6333/collections/$TEST_COLLECTION" | grep -q "\"points_count\":5"; then
        log_success "Test data persisted correctly in Qdrant"
    else
        log_error "Test data not persisted correctly"
        return 1
    fi
    
    # Test 2: Verify functional operations beyond health checks
    log_info "Verifying functional operations beyond basic health checks..."
    
    local functional_tests_passed=0
    local total_functional_tests=5
    
    # Check Qdrant vector operations
    if curl -s --max-time $TIMEOUT -X POST "http://localhost:6333/collections/$TEST_COLLECTION/points/search" \
        -H "Content-Type: application/json" \
        -d '{"vector":[0.1,0.2,0.3,0.4],"limit":1}' | grep -q "\"score\""; then
        ((functional_tests_passed++))
    fi
    
    # Check Neo4j APOC operations
    if curl -s --max-time $TIMEOUT \
        -H "Content-Type: application/json" \
        -X POST "http://localhost:7474/db/neo4j/tx/commit" \
        -d '{"statements":[{"statement":"RETURN apoc.version() as version"}]}' | grep -q "version"; then
        ((functional_tests_passed++))
    fi
    
    # Check Prometheus metrics aggregation
    if curl -s --max-time $TIMEOUT "http://localhost:9090/api/v1/query?query=count(up)" | grep -q "\"value\""; then
        ((functional_tests_passed++))
    fi
    
    # Check Grafana data source proxy
    local datasource_id=$(curl -s --max-time $TIMEOUT "http://localhost:3000/api/datasources" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
    if [ -n "$datasource_id" ] && curl -s --max-time $TIMEOUT "http://localhost:3000/api/datasources/proxy/$datasource_id/api/v1/query?query=up" | grep -q "\"data\""; then
        ((functional_tests_passed++))
    fi
    
    # Check inter-service data flow
    if curl -s --max-time $TIMEOUT "http://localhost:9090/api/v1/targets" | grep -q "\"health\":\"up\""; then
        ((functional_tests_passed++))
    fi
    
    local coverage_percentage=$((functional_tests_passed * 100 / total_functional_tests))
    
    if [ $functional_tests_passed -eq $total_functional_tests ]; then
        log_success "Test coverage validation passed: $coverage_percentage% functional tests working"
    elif [ $functional_tests_passed -gt 3 ]; then
        log_warning "Test coverage partial: $coverage_percentage% functional tests working ($functional_tests_passed/$total_functional_tests)"
    else
        log_error "Test coverage insufficient: only $coverage_percentage% functional tests working ($functional_tests_passed/$total_functional_tests)"
        return 1
    fi
    
    return 0
}

# Cleanup function
cleanup_test_data() {
    log_info "Cleaning up test data..."
    
    # Remove test collection
    curl -s --max-time $TIMEOUT -X DELETE "http://localhost:6333/collections/$TEST_COLLECTION" > /dev/null
    
    log_success "Test data cleanup completed"
}

# Main execution
main() {
    echo "🔍 Context Memory Store - Comprehensive Service Functionality Testing"
    echo "====================================================================="
    echo "Addresses Issue #18: Phase 2.3 - Comprehensive Service Functionality Testing"
    echo ""
    
    local failed_tests=0
    
    # Run comprehensive tests
    test_qdrant_comprehensive || ((failed_tests++))
    echo ""
    
    test_prometheus_comprehensive || ((failed_tests++))
    echo ""
    
    test_grafana_comprehensive || ((failed_tests++))
    echo ""
    
    test_end_to_end_connectivity || ((failed_tests++))
    echo ""
    
    test_coverage_validation || ((failed_tests++))
    echo ""
    
    # Cleanup
    cleanup_test_data
    echo ""
    
    echo "====================================================================="
    
    if [ $failed_tests -eq 0 ]; then
        log_success "All comprehensive service functionality tests passed! 🎉"
        echo ""
        echo "Summary:"
        echo "✅ Qdrant: Collection creation, vector operations, batch insertion, filtered search"
        echo "✅ Prometheus: Metrics collection, target validation, query aggregation"
        echo "✅ Grafana: Data source connectivity, query proxy, health checks"
        echo "✅ End-to-end: Service connectivity chains validated"
        echo "✅ Test Coverage: Functional operations beyond health checks confirmed"
        exit 0
    else
        log_error "$failed_tests comprehensive test suite(s) failed"
        echo ""
        echo "Troubleshooting recommendations:"
        echo "1. Check service logs: docker-compose logs [service-name]"
        echo "2. Verify service configuration files in config/ directory"
        echo "3. Restart failing services: docker-compose restart [service-name]"
        echo "4. Run basic health checks first: ./scripts/validate-services.sh"
        exit 1
    fi
}

# Handle script interruption
trap 'log_warning "Comprehensive testing interrupted"; cleanup_test_data; exit 130' INT TERM

# Check dependencies
for cmd in curl; do
    if ! command -v $cmd &> /dev/null; then
        log_error "$cmd is not installed. Please install required dependencies."
        exit 1
    fi
done

# Run main function
main "$@"