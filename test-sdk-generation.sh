#!/bin/bash

# Simple SDK Generation Test
set -e

echo "🚀 Testing SDK generation..."

# Get the project root
PROJECT_ROOT="$(pwd)"
OPENAPI_FILE="$PROJECT_ROOT/openapi.yaml"
NODE_MODULES_BIN="$PROJECT_ROOT/node_modules/.bin/openapi-generator-cli"

# Check if OpenAPI file exists
if [ ! -f "$OPENAPI_FILE" ]; then
    echo "❌ OpenAPI file not found: $OPENAPI_FILE"
    exit 1
fi

echo "📄 Using OpenAPI specification: $OPENAPI_FILE"

# Check if generator exists
if [ ! -f "$NODE_MODULES_BIN" ]; then
    echo "❌ openapi-generator-cli not found at: $NODE_MODULES_BIN"
    exit 1
fi

echo "✅ Found openapi-generator-cli"

# Create test directories
mkdir -p test-sdk/rust test-sdk/typescript

echo "🦀 Generating Rust SDK..."
"$NODE_MODULES_BIN" generate \
    -i "$OPENAPI_FILE" \
    -g rust \
    -o test-sdk/rust \
    --additional-properties=packageName=test_rust_client,crateName=test_rust_client \
    --skip-validate-spec \
    --verbose

echo "📝 Generating TypeScript SDK..."
"$NODE_MODULES_BIN" generate \
    -i "$OPENAPI_FILE" \
    -g typescript-axios \
    -o test-sdk/typescript \
    --additional-properties=packageName=@kaldrix/test-client,useSingleRequestParameter=true \
    --skip-validate-spec \
    --verbose

echo "✅ SDK generation completed!"
echo "📁 Generated files:"
echo "   Rust SDK: test-sdk/rust/"
echo "   TypeScript SDK: test-sdk/typescript/"