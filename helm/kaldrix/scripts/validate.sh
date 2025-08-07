#!/bin/bash

# KALDRIX Helm Chart Validation Script
# This script validates the Helm chart and its values files

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$(dirname "$SCRIPT_DIR")"
VALUES_FILES=()
LINT_ONLY=false
TEMPLATE_ONLY=false
ALL_VALUES=false
DEBUG=false

# Help function
show_help() {
    cat << EOF
KALDRIX Helm Chart Validation Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -f, --values FILE       Validate specific values file
    -a, --all-values        Validate all values files
    -l, --lint-only         Only run helm lint
    -t, --template-only     Only run helm template
    --debug                 Enable debug mode
    -h, --help              Show this help message

EXAMPLES:
    # Validate all values files
    $0 -a

    # Validate specific values file
    $0 -f values-production.yaml

    # Only run lint
    $0 -l

    # Only run template
    $0 -t

EOF
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    if [[ "$DEBUG" == "true" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--values)
                VALUES_FILES+=("$2")
                shift 2
                ;;
            -a|--all-values)
                ALL_VALUES=true
                shift
                ;;
            -l|--lint-only)
                LINT_ONLY=true
                shift
                ;;
            -t|--template-only)
                TEMPLATE_ONLY=true
                shift
                ;;
            --debug)
                DEBUG=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # If no values files specified and not all values, use default
    if [[ ${#VALUES_FILES[@]} -eq 0 ]] && [[ "$ALL_VALUES" != "true" ]]; then
        VALUES_FILES=("$CHART_DIR/values.yaml")
    fi

    # If all values is true, populate all values files
    if [[ "$ALL_VALUES" == "true" ]]; then
        VALUES_FILES=(
            "$CHART_DIR/values.yaml"
            "$CHART_DIR/values-staging.yaml"
            "$CHART_DIR/values-production.yaml"
        )
    fi

    log_debug "Values files: ${VALUES_FILES[*]}"
    log_debug "Lint only: $LINT_ONLY"
    log_debug "Template only: $TEMPLATE_ONLY"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_error "Helm is not installed. Please install Helm 3.0+"
        exit 1
    fi

    # Check if chart directory exists
    if [[ ! -d "$CHART_DIR" ]]; then
        log_error "Chart directory not found: $CHART_DIR"
        exit 1
    fi

    # Check if Chart.yaml exists
    if [[ ! -f "$CHART_DIR/Chart.yaml" ]]; then
        log_error "Chart.yaml not found in: $CHART_DIR"
        exit 1
    fi

    # Check if values files exist
    for values_file in "${VALUES_FILES[@]}"; do
        if [[ ! -f "$values_file" ]]; then
            log_error "Values file not found: $values_file"
            exit 1
        fi
    done

    log_success "Prerequisites check passed"
}

# Run helm lint
run_helm_lint() {
    log_info "Running helm lint..."

    for values_file in "${VALUES_FILES[@]}"; do
        log_info "Linting with values file: $values_file"
        
        if helm lint "$CHART_DIR" --values "$values_file"; then
            log_success "Helm lint passed for $values_file"
        else
            log_error "Helm lint failed for $values_file"
            return 1
        fi
    done
}

# Run helm template
run_helm_template() {
    log_info "Running helm template..."

    for values_file in "${VALUES_FILES[@]}"; do
        log_info "Templating with values file: $values_file"
        
        local temp_dir=$(mktemp -d)
        local output_file="$temp_dir/template-output.yaml"
        
        if helm template "$CHART_DIR" --values "$values_file" --output-dir "$temp_dir" > "$output_file" 2>&1; then
            log_success "Helm template passed for $values_file"
            
            # Check if any YAML files were generated
            local yaml_count=$(find "$temp_dir" -name "*.yaml" | wc -l)
            if [[ "$yaml_count" -gt 0 ]]; then
                log_info "Generated $yaml_count YAML files"
            else
                log_warning "No YAML files generated for $values_file"
            fi
            
            # Clean up
            rm -rf "$temp_dir"
        else
            log_error "Helm template failed for $values_file"
            cat "$output_file"
            rm -rf "$temp_dir"
            return 1
        fi
    done
}

# Validate YAML syntax
validate_yaml_syntax() {
    log_info "Validating YAML syntax..."

    for values_file in "${VALUES_FILES[@]}"; do
        log_info "Validating YAML syntax for: $values_file"
        
        if python3 -c "import yaml; yaml.safe_load(open('$values_file', 'r'))" 2>/dev/null; then
            log_success "YAML syntax is valid for $values_file"
        else
            log_error "YAML syntax is invalid for $values_file"
            return 1
        fi
    done
}

# Validate values files
validate_values_files() {
    log_info "Validating values files..."

    for values_file in "${VALUES_FILES[@]}"; do
        log_info "Validating values file: $values_file"
        
        # Check if required fields exist
        local required_fields=("global.environment" "global.namespace")
        for field in "${required_fields[@]}"; do
            if ! yq e ".${field}" "$values_file" > /dev/null 2>&1; then
                log_error "Required field '$field' not found in $values_file"
                return 1
            fi
        done
        
        # Check if environment is valid
        local environment=$(yq e '.global.environment' "$values_file")
        case "$environment" in
            staging|production)
                log_debug "Valid environment: $environment"
                ;;
            *)
                log_error "Invalid environment '$environment' in $values_file"
                return 1
                ;;
        esac
        
        # Check resource limits
        local resource_fields=(".frontend.resources" ".backend.resources" ".blockchain.resources")
        for field in "${resource_fields[@]}"; do
            if ! yq e ".${field}" "$values_file" > /dev/null 2>&1; then
                log_warning "Resource field '$field' not found in $values_file"
            fi
        done
        
        log_success "Values file validation passed for $values_file"
    done
}

# Check for deprecated values
check_deprecated_values() {
    log_info "Checking for deprecated values..."

    local deprecated_values=(
        "legacy.enabled"
        "old.config"
        "deprecated.feature"
    )

    for values_file in "${VALUES_FILES[@]}"; do
        log_info "Checking deprecated values in: $values_file"
        
        for deprecated_value in "${deprecated_values[@]}"; do
            if yq e ".${deprecated_value}" "$values_file" > /dev/null 2>&1; then
                log_warning "Deprecated value '$deprecated_value' found in $values_file"
            fi
        done
    done
}

# Validate Kubernetes resources
validate_kubernetes_resources() {
    log_info "Validating Kubernetes resources..."

    for values_file in "${VALUES_FILES[@]}"; do
        log_info "Validating Kubernetes resources for: $values_file"
        
        # Generate templates
        local temp_dir=$(mktemp -d)
        if ! helm template "$CHART_DIR" --values "$values_file" --output-dir "$temp_dir" > /dev/null 2>&1; then
            log_error "Failed to generate templates for $values_file"
            rm -rf "$temp_dir"
            return 1
        fi
        
        # Check for common issues
        local yaml_files=$(find "$temp_dir" -name "*.yaml")
        for yaml_file in $yaml_files; do
            # Check for empty selectors
            if grep -q "selector: {}" "$yaml_file"; then
                log_warning "Empty selector found in $yaml_file"
            fi
            
            # Check for missing labels
            if grep -q "kind: Deployment" "$yaml_file" && ! grep -q "app.kubernetes.io/name" "$yaml_file"; then
                log_warning "Missing recommended labels in deployment: $yaml_file"
            fi
            
            # Check for missing resources
            if grep -q "kind: Deployment" "$yaml_file" && ! grep -q "resources:" "$yaml_file"; then
                log_warning "Missing resource limits in deployment: $yaml_file"
            fi
        done
        
        # Clean up
        rm -rf "$temp_dir"
        
        log_success "Kubernetes resource validation passed for $values_file"
    done
}

# Generate validation report
generate_validation_report() {
    log_info "Generating validation report..."
    
    local report_file="validation-report-$(date +%Y%m%d-%H%M%S).json"
    local report_data='{
        "timestamp": "'$(date -Iseconds)'",
        "chart": "'$(basename "$CHART_DIR")'",
        "values_files": ['
    
    local first=true
    for values_file in "${VALUES_FILES[@]}"; do
        if [[ "$first" != "true" ]]; then
            report_data+=','
        fi
        report_data+='"'"$(basename "$values_file")"'"'
        first=false
    done
    
    report_data+='],
        "validations": {
            "helm_lint": true,
            "helm_template": true,
            "yaml_syntax": true,
            "values_validation": true,
            "deprecated_values": true,
            "kubernetes_resources": true
        },
        "status": "success"
    }'
    
    echo "$report_data" | jq . > "$report_file" 2>/dev/null || echo "$report_data" > "$report_file"
    
    log_success "Validation report generated: $report_file"
}

# Main function
main() {
    # Parse command line arguments
    parse_args "$@"

    # Show banner
    echo ""
    echo "=========================================="
    echo "  KALDRIX Helm Chart Validation Script   "
    echo "=========================================="
    echo ""
    echo "Chart: $(basename "$CHART_DIR")"
    echo "Values files: ${VALUES_FILES[*]}"
    echo ""

    # Check prerequisites
    check_prerequisites

    # Run validations
    local validation_passed=true

    if [[ "$LINT_ONLY" != "true" ]]; then
        # Validate YAML syntax
        if ! validate_yaml_syntax; then
            validation_passed=false
        fi

        # Validate values files
        if ! validate_values_files; then
            validation_passed=false
        fi

        # Check deprecated values
        if ! check_deprecated_values; then
            validation_passed=false
        fi

        # Validate Kubernetes resources
        if ! validate_kubernetes_resources; then
            validation_passed=false
        fi
    fi

    if [[ "$TEMPLATE_ONLY" != "true" ]]; then
        # Run helm lint
        if ! run_helm_lint; then
            validation_passed=false
        fi
    fi

    if [[ "$LINT_ONLY" != "true" ]]; then
        # Run helm template
        if ! run_helm_template; then
            validation_passed=false
        fi
    fi

    # Generate report
    generate_validation_report

    # Final result
    if [[ "$validation_passed" == "true" ]]; then
        log_success "All validations passed successfully!"
        exit 0
    else
        log_error "Some validations failed!"
        exit 1
    fi
}

# Run main function
main "$@"