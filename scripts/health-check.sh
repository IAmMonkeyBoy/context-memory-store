#!/bin/bash
# Quick Health Check Script for Context Memory Store Services
# WARNING: PROOF OF CONCEPT ONLY - NOT FOR PRODUCTION USE

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=10

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

check_service() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    log_info "Checking $name..."
    
    if curl -s --max-time $TIMEOUT -w "%{http_code}" -o /dev/null "$url" | grep -q "$expected_status"; then
        log_success "$name is healthy"
        return 0
    else
        log_error "$name is not responding"
        return 1
    fi
}

check_external_service() {
    local url=$1
    local name=$2
    
    log_info "Checking external $name..."
    
    if curl -s --max-time $TIMEOUT "$url" > /dev/null 2>&1; then
        log_success "External $name is accessible"
        return 0
    else
        log_warning "External $name is not accessible"
        return 1
    fi
}

main() {
    echo "🏥 Context Memory Store - Quick Health Check"
    echo "==========================================="
    echo ""
    
    local failed_services=0
    
    # Check core services
    log_info "Checking core infrastructure services..."
    echo ""
    
    check_service "http://localhost:6333/health" "Qdrant" || ((failed_services++))
    check_service "http://localhost:7474/" "Neo4j Web Interface" || ((failed_services++))
    check_service "http://localhost:9090/-/healthy" "Prometheus" || ((failed_services++))
    check_service "http://localhost:3000/api/health" "Grafana" || ((failed_services++))
    
    echo ""
    
    # Check metrics endpoints
    log_info "Checking metrics endpoints..."
    echo ""
    
    check_service "http://localhost:6333/metrics" "Qdrant Metrics" || ((failed_services++))
    check_service "http://localhost:2004/metrics" "Neo4j Metrics" || ((failed_services++))
    check_service "http://localhost:9090/metrics" "Prometheus Metrics" || ((failed_services++))
    check_service "http://localhost:3000/metrics" "Grafana Metrics" || ((failed_services++))
    
    echo ""
    
    # Check external services
    log_info "Checking external dependencies..."
    echo ""
    
    if check_external_service "http://localhost:11434/api/version" "Ollama"; then
        check_external_service "http://localhost:11434/api/tags" "Ollama API"
    fi
    
    echo ""
    echo "=========================================="
    
    if [ $failed_services -eq 0 ]; then
        log_success "All core services are healthy! 🎉"
        exit 0
    else
        log_error "$failed_services core service(s) failed health checks"
        echo ""
        echo "Troubleshooting tips:"
        echo "1. Ensure Docker containers are running: docker-compose ps"
        echo "2. Check container logs: docker-compose logs [service-name]"
        echo "3. Restart services: docker-compose restart"
        echo "4. For Ollama: ensure it's installed and running on the host"
        exit 1
    fi
}

# Handle script interruption
trap 'log_warning "Health check interrupted"; exit 130' INT TERM

# Check if curl is available
if ! command -v curl &> /dev/null; then
    log_error "curl is not installed. Please install curl to run health checks."
    exit 1
fi

# Run main function
main "$@"