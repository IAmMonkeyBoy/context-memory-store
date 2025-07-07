#!/bin/bash
# Configuration validation script for Context Memory Store
# WARNING: PROOF OF CONCEPT ONLY - NOT FOR PRODUCTION USE

set -e

echo "🔍 Validating Context Memory Store configuration..."
echo ""

# Check if required files exist
echo "📁 Checking required configuration files..."
required_files=(
    "docker-compose.yml"
    "project/config.yaml"
    "config/neo4j.conf"
    "config/prometheus.yml"
    "config/qdrant.yaml"
    ".env.example"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

echo ""
echo "🔧 Validating YAML syntax..."

# Validate YAML files
yaml_files=(
    "docker-compose.yml"
    "project/config.yaml" 
    "config/prometheus.yml"
    "config/qdrant.yaml"
)

for file in "${yaml_files[@]}"; do
    if command -v python3 &> /dev/null; then
        python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✓ $file has valid YAML syntax"
        else
            echo "❌ $file has invalid YAML syntax"
            exit 1
        fi
    else
        echo "⚠️  Python3 not available, skipping YAML validation for $file"
    fi
done

echo ""
echo "🚀 Validating Docker Compose configuration..."

# Validate docker-compose file
docker-compose -f docker-compose.yml config > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ docker-compose.yml is valid"
else
    echo "❌ docker-compose.yml has configuration errors"
    exit 1
fi

echo ""
echo "🔍 Checking environment variables..."

# Check if .env file exists and has required variables
if [ -f ".env" ]; then
    echo "✓ .env file exists"
    
    required_vars=("NEO4J_PASSWORD" "GRAFANA_PASSWORD")
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env; then
            echo "✓ $var is defined in .env"
        else
            echo "⚠️  $var not found in .env (will use default)"
        fi
    done
else
    echo "⚠️  .env file not found (will use defaults from .env.example)"
fi

echo ""
echo "✅ Configuration validation completed successfully!"