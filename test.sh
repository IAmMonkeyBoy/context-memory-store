#!/bin/bash
# Comprehensive Infrastructure Test Script for Context Memory Store
# WARNING: PROOF OF CONCEPT ONLY - NOT FOR PRODUCTION USE

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RETRY_COUNT=3
RETRY_DELAY=5
TEST_TIMEOUT=300

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

check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    log_success "All dependencies are available"
}

check_ollama_external() {
    log_info "Checking external Ollama service..."
    
    for i in $(seq 1 $RETRY_COUNT); do
        if curl -s --max-time 10 http://localhost:11434/api/version > /dev/null; then
            log_success "External Ollama service is running"
            return 0
        fi
        
        if [ $i -lt $RETRY_COUNT ]; then
            log_warning "Ollama not responding, retrying in ${RETRY_DELAY}s... (attempt $i/$RETRY_COUNT)"
            sleep $RETRY_DELAY
        fi
    done
    
    log_warning "External Ollama service is not running - some tests may be skipped"
    return 1
}

pre_test_validation() {
    log_info "Running pre-test validation..."
    
    # Check if any containers are already running
    if docker-compose -f docker-compose.test.yml ps -q | grep -q .; then
        log_warning "Test containers are already running, cleaning up..."
        docker-compose -f docker-compose.test.yml down -v
    fi
    
    # Check if main containers are running (they shouldn't be for isolated testing)
    if docker-compose ps -q | grep -q .; then
        log_warning "Main containers are running - this may interfere with testing"
        echo "Consider running 'docker-compose down' before testing"
    fi
    
    log_success "Pre-test validation complete"
}

run_infrastructure_tests() {
    log_info "Starting infrastructure tests..."
    echo ""
    
    # Start test environment with timeout
    log_info "🚀 Starting test environment (timeout: ${TEST_TIMEOUT}s)..."
    
    timeout $TEST_TIMEOUT docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
    TEST_EXIT_CODE=$?
    
    if [ $TEST_EXIT_CODE -eq 124 ]; then
        log_error "Tests timed out after ${TEST_TIMEOUT} seconds"
        return 1
    fi
    
    return $TEST_EXIT_CODE
}

post_test_cleanup() {
    log_info "🧹 Cleaning up test environment..."
    
    # Stop and remove containers, networks, and volumes
    docker-compose -f docker-compose.test.yml down -v --remove-orphans
    
    # Remove any dangling images from the test
    if docker images -q -f dangling=true | grep -q .; then
        log_info "Removing dangling images..."
        docker images -q -f dangling=true | xargs docker rmi
    fi
    
    log_success "Cleanup complete"
}

show_logs_on_failure() {
    log_error "Test failure detected. Showing last 50 lines of logs from each service:"
    echo ""
    
    for service in qdrant neo4j prometheus grafana test-runner; do
        echo -e "${YELLOW}=== $service logs ===${NC}"
        docker-compose -f docker-compose.test.yml logs --tail=50 $service 2>/dev/null || echo "No logs available for $service"
        echo ""
    done
}

main() {
    echo "🧪 Context Memory Store - Comprehensive Infrastructure Testing"
    echo "============================================================"
    echo ""
    
    # Pre-flight checks
    check_dependencies
    OLLAMA_AVAILABLE=$(check_ollama_external && echo "true" || echo "false")
    pre_test_validation
    
    # Run tests
    echo ""
    if run_infrastructure_tests; then
        log_success "All infrastructure tests passed!"
        post_test_cleanup
        exit 0
    else
        log_error "Infrastructure tests failed!"
        show_logs_on_failure
        post_test_cleanup
        exit 1
    fi
}

# Handle script interruption
trap 'log_warning "Test interrupted by user"; post_test_cleanup; exit 130' INT TERM

# Run main function
main "$@"