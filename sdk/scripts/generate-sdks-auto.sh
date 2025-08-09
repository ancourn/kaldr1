#!/bin/bash

# Non-interactive SDK Generation Script for Testing
# This script generates both Rust and TypeScript client SDKs from the OpenAPI specification

set -e

echo "🚀 Starting SDK generation..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OPENAPI_FILE="$PROJECT_ROOT/../openapi.yaml"

# Check if OpenAPI file exists
if [ ! -f "$OPENAPI_FILE" ]; then
    echo "❌ OpenAPI file not found: $OPENAPI_FILE"
    exit 1
fi

echo "📄 Using OpenAPI specification: $OPENAPI_FILE"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get openapi-generator-cli path
get_openapi_generator() {
    # Check if globally installed
    if command_exists openapi-generator-cli; then
        echo "openapi-generator-cli"
        return
    fi
    
    # Check if locally installed in project
    local local_generator="$PROJECT_ROOT/../node_modules/.bin/openapi-generator-cli"
    if [ -f "$local_generator" ]; then
        echo "$local_generator"
        return
    fi
    
    # Not found
    echo ""
}

# Function to generate Rust SDK
generate_rust_sdk() {
    echo "🦀 Generating Rust SDK..."
    
    cd "$PROJECT_ROOT/rust-client"
    
    GENERATOR=$(get_openapi_generator)
    if [ -n "$GENERATOR" ]; then
        echo "✅ Found openapi-generator-cli, generating Rust client..."
        
        # Clean previous generated files
        rm -rf src/generated
        
        # Generate Rust client
        "$GENERATOR" generate \
            -i "$OPENAPI_FILE" \
            -g rust \
            -o src/generated \
            --additional-properties=packageName=dev_assistant_client,crateName=dev_assistant_client \
            --skip-validate-spec \
            --verbose
        
        echo "✅ Rust SDK generated successfully!"
    else
        echo "⚠️  openapi-generator-cli not found. Using manual implementation."
        echo "   To install: npm install --save-dev @openapitools/openapi-generator-cli"
        
        # Build with manual implementation
        cargo build
    fi
}

# Function to generate TypeScript SDK
generate_typescript_sdk() {
    echo "📝 Generating TypeScript SDK..."
    
    cd "$PROJECT_ROOT/typescript-client"
    
    GENERATOR=$(get_openapi_generator)
    if [ -n "$GENERATOR" ]; then
        echo "✅ Found openapi-generator-cli, generating TypeScript client..."
        
        # Clean previous generated files
        rm -rf src/generated
        
        # Generate TypeScript client
        "$GENERATOR" generate \
            -i "$OPENAPI_FILE" \
            -g typescript-axios \
            -o src/generated \
            --additional-properties=packageName=@kaldrix/dev-assistant-client,useSingleRequestParameter=true \
            --skip-validate-spec \
            --verbose
        
        echo "✅ TypeScript SDK generated successfully!"
    else
        echo "⚠️  openapi-generator-cli not found. Using manual implementation."
        echo "   To install: npm install --save-dev @openapitools/openapi-generator-cli"
        
        # Install dependencies and build
        npm install
        npm run build
    fi
}

# Main execution - generate both SDKs
echo "📋 Generating both SDKs..."

generate_rust_sdk
generate_typescript_sdk

echo "🎉 SDK generation completed successfully!"
echo ""
echo "📁 Generated files:"
echo "   Rust SDK: $PROJECT_ROOT/rust-client/"
echo "   TypeScript SDK: $PROJECT_ROOT/typescript-client/"
echo ""
echo "📚 Next steps:"
echo "   1. Review the generated SDKs"
echo "   2. Run tests to ensure everything works"
echo "   3. Build the SDKs for distribution"
echo "   4. Update documentation if needed"
echo ""
echo "💡 Tip: Install openapi-generator-cli for automatic generation:"
echo "   npm install --save-dev @openapitools/openapi-generator-cli"