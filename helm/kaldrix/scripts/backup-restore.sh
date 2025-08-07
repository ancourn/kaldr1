#!/bin/bash

# KALDRIX Helm Chart Backup and Restore Script
# This script handles backup and restore operations for KALDRIX deployments

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
RELEASE_NAME=""
NAMESPACE=""
ACTION=""
BACKUP_DIR=""
BACKUP_NAME=""
RESTORE_SOURCE=""
DRY_RUN=false
DEBUG=false
FORCE=false

# Default values
DEFAULT_RELEASE_NAME="kaldrix"
DEFAULT_NAMESPACE="kaldrix"
DEFAULT_BACKUP_DIR="./backups"

# Help function
show_help() {
    cat << EOF
KALDRIX Helm Chart Backup and Restore Script

USAGE:
    $0 [ACTION] [OPTIONS]

ACTIONS:
    backup                  Create backup of deployment
    restore                 Restore deployment from backup
    list                    List available backups
    delete                  Delete a backup

OPTIONS:
    -r, --release NAME      Release name (default: kaldrix)
    -n, --namespace NAME     Kubernetes namespace (default: kaldrix)
    -b, --backup-dir DIR    Backup directory (default: ./backups)
    -N, --backup-name NAME  Backup name (default: auto-generated)
    -s, --source SOURCE     Restore source (backup name or file)
    -f, --force             Force operation without confirmation
    -d, --dry-run           Dry run (show what would be done)
    --debug                 Enable debug mode
    -h, --help              Show this help message

EXAMPLES:
    # Create backup
    $0 backup

    # Create backup with custom name
    $0 backup -N "production-backup-2024"

    # List backups
    $0 list

    # Restore from backup
    $0 restore -s "production-backup-2024"

    # Delete backup
    $0 delete -s "production-backup-2024"

    # Dry run backup
    $0 backup -d

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
    if [[ $# -eq 0 ]]; then
        log_error "No action specified"
        show_help
        exit 1
    fi

    ACTION="$1"
    shift

    while [[ $# -gt 0 ]]; do
        case $1 in
            -r|--release)
                RELEASE_NAME="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -b|--backup-dir)
                BACKUP_DIR="$2"
                shift 2
                ;;
            -N|--backup-name)
                BACKUP_NAME="$2"
                shift 2
                ;;
            -s|--source)
                RESTORE_SOURCE="$2"
                shift 2
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
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

    # Set default values
    if [[ -z "$RELEASE_NAME" ]]; then
        RELEASE_NAME="$DEFAULT_RELEASE_NAME"
    fi

    if [[ -z "$NAMESPACE" ]]; then
        NAMESPACE="$DEFAULT_NAMESPACE"
    fi

    if [[ -z "$BACKUP_DIR" ]]; then
        BACKUP_DIR="$DEFAULT_BACKUP_DIR"
    fi

    if [[ -z "$BACKUP_NAME" ]]; then
        BACKUP_NAME="${RELEASE_NAME}-backup-$(date +%Y%m%d-%H%M%S)"
    fi

    # Validate action
    case "$ACTION" in
        backup|restore|list|delete)
            ;;
        *)
            log_error "Invalid action: $ACTION"
            show_help
            exit 1
            ;;
    esac

    # Validate required parameters for specific actions
    if [[ "$ACTION" == "restore" || "$ACTION" == "delete" ]]; then
        if [[ -z "$RESTORE_SOURCE" ]]; then
            log_error "Source is required for $ACTION action"
            exit 1
        fi
    fi

    log_debug "Action: $ACTION"
    log_debug "Release name: $RELEASE_NAME"
    log_debug "Namespace: $NAMESPACE"
    log_debug "Backup directory: $BACKUP_DIR"
    log_debug "Backup name: $BACKUP_NAME"
    log_debug "Restore source: $RESTORE_SOURCE"
    log_debug "Dry run: $DRY_RUN"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl"
        exit 1
    fi

    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_error "Helm is not installed. Please install Helm 3.0+"
        exit 1
    fi

    # Check if connected to Kubernetes cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Not connected to Kubernetes cluster"
        exit 1
    fi

    # Create backup directory if it doesn't exist
    if [[ ! -d "$BACKUP_DIR" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "DRY RUN: Would create backup directory: $BACKUP_DIR"
        else
            mkdir -p "$BACKUP_DIR"
            log_success "Backup directory created: $BACKUP_DIR"
        fi
    fi

    # Check if release exists for backup action
    if [[ "$ACTION" == "backup" ]]; then
        if ! helm status "$RELEASE_NAME" --namespace "$NAMESPACE" &> /dev/null; then
            log_error "Release $RELEASE_NAME not found in namespace $NAMESPACE"
            exit 1
        fi
    fi

    log_success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log_info "Creating backup: $BACKUP_NAME"

    local backup_path="$BACKUP_DIR/$BACKUP_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would create backup at: $backup_path"
        return
    fi

    # Create backup directory
    mkdir -p "$backup_path"

    # Backup Helm release
    log_info "Backing up Helm release..."
    helm get values "$RELEASE_NAME" --namespace "$NAMESPACE" > "$backup_path/values.yaml"
    helm get manifest "$RELEASE_NAME" --namespace "$NAMESPACE" > "$backup_path/manifest.yaml"
    helm status "$RELEASE_NAME" --namespace "$NAMESPACE" > "$backup_path/status.txt"

    # Backup Kubernetes resources
    log_info "Backing up Kubernetes resources..."
    
    # Backup ConfigMaps
    kubectl get configmaps -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" -o yaml > "$backup_path/configmaps.yaml"
    
    # Backup Secrets
    kubectl get secrets -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" -o yaml > "$backup_path/secrets.yaml"
    
    # Backup PVCs
    kubectl get pvc -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" -o yaml > "$backup_path/pvcs.yaml"
    
    # Backup Deployments
    kubectl get deployments -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" -o yaml > "$backup_path/deployments.yaml"
    
    # Backup Services
    kubectl get services -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" -o yaml > "$backup_path/services.yaml"
    
    # Backup Ingress
    kubectl get ingress -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" -o yaml > "$backup_path/ingress.yaml"

    # Backup database data (if PostgreSQL is enabled)
    if kubectl get pods -n "$NAMESPACE" -l "app=postgresql" &> /dev/null; then
        log_info "Backing up PostgreSQL data..."
        local postgres_pod=$(kubectl get pods -n "$NAMESPACE" -l "app=postgresql" -o jsonpath='{.items[0].metadata.name}')
        kubectl exec -n "$NAMESPACE" "$postgres_pod" -- pg_dump -U kaldrix kaldrix_prod > "$backup_path/postgres-backup.sql"
    fi

    # Backup Redis data (if Redis is enabled)
    if kubectl get pods -n "$NAMESPACE" -l "app=redis" &> /dev/null; then
        log_info "Backing up Redis data..."
        local redis_pod=$(kubectl get pods -n "$NAMESPACE" -l "app=redis" -o jsonpath='{.items[0].metadata.name}')
        kubectl exec -n "$NAMESPACE" "$redis_pod" -- redis-cli SAVE
        kubectl cp "$NAMESPACE/$redis_pod:/data/dump.rdb" "$backup_path/redis-backup.rdb"
    fi

    # Create backup metadata
    cat > "$backup_path/metadata.json" << EOF
{
    "backup_name": "$BACKUP_NAME",
    "release_name": "$RELEASE_NAME",
    "namespace": "$NAMESPACE",
    "timestamp": "$(date -Iseconds)",
    "kubernetes_version": "$(kubectl version --client -o json | jq -r '.clientVersion.gitVersion')",
    "helm_version": "$(helm version --client --short)",
    "backup_size": "$(du -sh "$backup_path" | cut -f1)"
}
EOF

    # Create backup archive
    log_info "Creating backup archive..."
    tar -czf "$backup_path.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
    rm -rf "$backup_path"

    log_success "Backup created successfully: $backup_path.tar.gz"
}

# List backups
list_backups() {
    log_info "Available backups:"

    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_warning "Backup directory not found: $BACKUP_DIR"
        return
    fi

    local backups=($(find "$BACKUP_DIR" -name "*.tar.gz" -type f | sort))

    if [[ ${#backups[@]} -eq 0 ]]; then
        log_info "No backups found"
        return
    fi

    echo ""
    printf "%-40s %-20s %-15s %s\n" "Backup Name" "Size" "Date" "Release"
    echo "--------------------------------------------------------------------------------"

    for backup in "${backups[@]}"; do
        local backup_name=$(basename "$backup" .tar.gz)
        local backup_size=$(du -h "$backup" | cut -f1)
        local backup_date=$(date -r "$backup" "+%Y-%m-%d %H:%M:%S")
        local release_name=$(echo "$backup_name" | cut -d'-' -f1)
        
        printf "%-40s %-20s %-15s %s\n" "$backup_name" "$backup_size" "$backup_date" "$release_name"
    done
}

# Restore backup
restore_backup() {
    log_info "Restoring from backup: $RESTORE_SOURCE"

    local backup_file="$BACKUP_DIR/$RESTORE_SOURCE.tar.gz"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would restore from backup: $backup_file"
        return
    fi

    # Extract backup
    log_info "Extracting backup..."
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"

    local backup_name=$(basename "$backup_file" .tar.gz)
    local backup_path="$temp_dir/$backup_name"

    # Check if backup metadata exists
    if [[ ! -f "$backup_path/metadata.json" ]]; then
        log_error "Backup metadata not found"
        rm -rf "$temp_dir"
        exit 1
    fi

    # Load backup metadata
    local release_name=$(jq -r '.release_name' "$backup_path/metadata.json")
    local namespace=$(jq -r '.namespace' "$backup_path/metadata.json")

    # Confirm restore operation
    if [[ "$FORCE" != "true" ]]; then
        echo ""
        log_warning "This will restore the deployment from backup: $backup_name"
        log_warning "Release: $release_name"
        log_warning "Namespace: $namespace"
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Restore operation cancelled"
            rm -rf "$temp_dir"
            exit 0
        fi
    fi

    # Restore Kubernetes resources
    log_info "Restoring Kubernetes resources..."

    # Restore ConfigMaps
    if [[ -f "$backup_path/configmaps.yaml" ]]; then
        kubectl apply -f "$backup_path/configmaps.yaml"
    fi

    # Restore Secrets
    if [[ -f "$backup_path/secrets.yaml" ]]; then
        kubectl apply -f "$backup_path/secrets.yaml"
    fi

    # Restore PVCs
    if [[ -f "$backup_path/pvcs.yaml" ]]; then
        kubectl apply -f "$backup_path/pvcs.yaml"
    fi

    # Restore Services
    if [[ -f "$backup_path/services.yaml" ]]; then
        kubectl apply -f "$backup_path/services.yaml"
    fi

    # Restore Ingress
    if [[ -f "$backup_path/ingress.yaml" ]]; then
        kubectl apply -f "$backup_path/ingress.yaml"
    fi

    # Restore Helm release
    log_info "Restoring Helm release..."
    if [[ -f "$backup_path/values.yaml" ]]; then
        helm upgrade "$release_name" "$CHART_DIR" --namespace "$namespace" --values "$backup_path/values.yaml" --install
    fi

    # Restore database data
    if [[ -f "$backup_path/postgres-backup.sql" ]]; then
        log_info "Restoring PostgreSQL data..."
        local postgres_pod=$(kubectl get pods -n "$namespace" -l "app=postgresql" -o jsonpath='{.items[0].metadata.name}')
        kubectl exec -i -n "$namespace" "$postgres_pod" -- psql -U kaldrix kaldrix_prod < "$backup_path/postgres-backup.sql"
    fi

    # Restore Redis data
    if [[ -f "$backup_path/redis-backup.rdb" ]]; then
        log_info "Restoring Redis data..."
        local redis_pod=$(kubectl get pods -n "$namespace" -l "app=redis" -o jsonpath='{.items[0].metadata.name}')
        kubectl cp "$backup_path/redis-backup.rdb" "$namespace/$redis_pod:/data/dump.rdb"
        kubectl exec -n "$namespace" "$redis_pod" -- redis-cli BGREWRITEAOF
    fi

    # Clean up
    rm -rf "$temp_dir"

    log_success "Restore completed successfully from backup: $backup_name"
}

# Delete backup
delete_backup() {
    log_info "Deleting backup: $RESTORE_SOURCE"

    local backup_file="$BACKUP_DIR/$RESTORE_SOURCE.tar.gz"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would delete backup: $backup_file"
        return
    fi

    # Confirm delete operation
    if [[ "$FORCE" != "true" ]]; then
        echo ""
        log_warning "This will permanently delete the backup: $RESTORE_SOURCE"
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Delete operation cancelled"
            exit 0
        fi
    fi

    rm -f "$backup_file"
    log_success "Backup deleted successfully: $RESTORE_SOURCE"
}

# Main function
main() {
    # Parse command line arguments
    parse_args "$@"

    # Show banner
    echo ""
    echo "=========================================="
    echo "  KALDRIX Backup and Restore Script       "
    echo "=========================================="
    echo ""
    echo "Action: $ACTION"
    echo "Release: $RELEASE_NAME"
    echo "Namespace: $NAMESPACE"
    echo "Backup directory: $BACKUP_DIR"
    echo ""

    # Check prerequisites
    check_prerequisites

    # Execute requested action
    case "$ACTION" in
        backup)
            create_backup
            ;;
        list)
            list_backups
            ;;
        restore)
            restore_backup
            ;;
        delete)
            delete_backup
            ;;
    esac

    log_success "Script completed successfully"
}

# Run main function
main "$@"