#!/bin/bash
# Basic connectivity test script for Context Memory Store
# WARNING: PROOF OF CONCEPT ONLY - NOT FOR PRODUCTION USE

set -e

echo "🧪 Starting Context Memory Store connectivity tests..."
echo ""

# Run the test services
echo "🚀 Starting test environment..."
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Check the exit code of the test runner
TEST_EXIT_CODE=$?

# Cleanup
echo ""
echo "🧹 Cleaning up test environment..."
docker-compose -f docker-compose.test.yml down -v

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
    exit 0
else
    echo ""
    echo "❌ Tests failed!"
    exit 1
fi