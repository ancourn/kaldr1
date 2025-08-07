#!/bin/bash

# Development Docker Compose Helper Script
# Usage: ./scripts/dev-compose.sh [command] [profile]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default profile
PROFILE="full"
COMPOSE_FILE="docker-compose.full.yml"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    echo "Quantum DAG Blockchain Development Compose Helper"
    echo ""
    echo "Usage: $0 [command] [profile]"
    echo ""
    echo "Commands:"
    echo "  up [profile]     - Start services with specified profile"
    echo "  down [profile]   - Stop and remove services"
    echo "  restart [profile]- Restart services"
    echo "  logs [profile]   - View logs"
    echo "  status [profile] - Show service status"
    echo "  clean [profile]  - Clean up volumes and containers"
    echo "  test [profile]   - Run tests"
    echo "  backup [profile] - Create backup"
    echo "  restore [profile]- Restore from backup"
    echo "  help             - Show this help message"
    echo ""
    echo "Profiles:"
    echo "  full             - All services (default)"
    echo "  backend          - Blockchain backend only"
    echo "  frontend         - Frontend only"
    echo "  database         - Database services only"
    echo "  monitoring       - Monitoring stack only"
    echo "  nginx            - NGINX reverse proxy"
    echo "  caddy            - Caddy reverse proxy"
    echo "  cache            - Redis cache only"
    echo "  tracing          - Jaeger tracing only"
    echo "  tools            - Development tools only"
    echo ""
    echo "Examples:"
    echo "  $0 up full                    # Start all services"
    echo "  $0 up backend                 # Start backend only"
    echo "  $0 logs monitoring            # View monitoring logs"
    echo "  $0 clean full                 # Clean up all services"
}

# Function to validate profile
validate_profile() {
    local profile=$1
    case $profile in
        full|backend|frontend|database|monitoring|nginx|caddy|cache|tracing|tools)
            return 0
            ;;
        *)
            print_error "Invalid profile: $profile"
            show_help
            exit 1
            ;;
    esac
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker."
        exit 1
    fi
}

# Function to start services
start_services() {
    local profile=$1
    print_status "Starting services with profile: $profile"
    
    if [ "$profile" = "full" ]; then
        docker-compose -f $COMPOSE_FILE --profile full up -d
    else
        docker-compose -f $COMPOSE_FILE --profile $profile up -d
    fi
    
    print_success "Services started successfully"
    print_status "Waiting for services to be ready..."
    
    # Wait for health checks
    sleep 10
    
    # Show service status
    show_status "$profile"
}

# Function to stop services
stop_services() {
    local profile=$1
    print_status "Stopping services with profile: $profile"
    
    if [ "$profile" = "full" ]; then
        docker-compose -f $COMPOSE_FILE --profile full down
    else
        docker-compose -f $COMPOSE_FILE --profile $profile down
    fi
    
    print_success "Services stopped successfully"
}

# Function to restart services
restart_services() {
    local profile=$1
    print_status "Restarting services with profile: $profile"
    
    stop_services "$profile"
    sleep 5
    start_services "$profile"
}

# Function to view logs
view_logs() {
    local profile=$1
    print_status "Showing logs for profile: $profile"
    
    if [ "$profile" = "full" ]; then
        docker-compose -f $COMPOSE_FILE --profile full logs -f --tail=100
    else
        docker-compose -f $COMPOSE_FILE --profile $profile logs -f --tail=100
    fi
}

# Function to show status
show_status() {
    local profile=$1
    print_status "Service status for profile: $profile"
    
    if [ "$profile" = "full" ]; then
        docker-compose -f $COMPOSE_FILE --profile full ps
    else
        docker-compose -f $COMPOSE_FILE --profile $profile ps
    fi
}

# Function to clean up
clean_services() {
    local profile=$1
    print_warning "This will remove containers, networks, and volumes for profile: $profile"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up services with profile: $profile"
        
        if [ "$profile" = "full" ]; then
            docker-compose -f $COMPOSE_FILE --profile full down -v --remove-orphans
        else
            docker-compose -f $COMPOSE_FILE --profile $profile down -v --remove-orphans
        fi
        
        print_success "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Function to run tests
run_tests() {
    local profile=$1
    print_status "Running tests for profile: $profile"
    
    # Start services if not running
    if ! docker-compose -f $COMPOSE_FILE --profile $profile ps | grep -q "Up"; then
        start_services "$profile"
        sleep 20
    fi
    
    # Run health checks
    print_status "Running health checks..."
    
    # Backend health check
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
    fi
    
    # Frontend health check
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
    fi
    
    # Prometheus health check
    if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
        print_success "Prometheus health check passed"
    else
        print_error "Prometheus health check failed"
    fi
    
    # Grafana health check
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        print_success "Grafana health check passed"
    else
        print_error "Grafana health check failed"
    fi
    
    print_success "Tests completed"
}

# Function to create backup
create_backup() {
    local profile=$1
    print_status "Creating backup for profile: $profile"
    
    # Create backup directory
    mkdir -p ./backups
    
    # Backup timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="./backups/backup_${TIMESTAMP}"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if [ -f "./db/custom.db" ]; then
        cp ./db/custom.db "$BACKUP_DIR/blockchain.db"
        print_success "Database backed up"
    fi
    
    # Backup volumes
    docker-compose -f $COMPOSE_FILE --profile $profile exec sqlite sqlite3 /data/blockchain.db ".backup $BACKUP_DIR/blockchain_volume.db"
    
    # Backup configuration files
    cp -r ./monitoring "$BACKUP_DIR/"
    cp -r ./ssl "$BACKUP_DIR/" 2>/dev/null || true
    cp ./*.yml "$BACKUP_DIR/" 2>/dev/null || true
    cp ./*.conf "$BACKUP_DIR/" 2>/dev/null || true
    
    # Create backup info
    cat > "$BACKUP_DIR/backup_info.txt" << EOF
Backup created: $(date)
Profile: $profile
Services: $(docker-compose -f $COMPOSE_FILE --profile $profile ps --services)
EOF
    
    print_success "Backup created: $BACKUP_DIR"
}

# Function to restore backup
restore_backup() {
    local profile=$1
    print_status "Restore from backup for profile: $profile"
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t ./backups | head -n1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        print_error "No backup found"
        exit 1
    fi
    
    BACKUP_DIR="./backups/$LATEST_BACKUP"
    print_status "Restoring from: $BACKUP_DIR"
    
    # Stop services
    stop_services "$profile"
    
    # Restore database
    if [ -f "$BACKUP_DIR/blockchain.db" ]; then
        cp "$BACKUP_DIR/blockchain.db" ./db/custom.db
        print_success "Database restored"
    fi
    
    # Restore configuration
    if [ -d "$BACKUP_DIR/monitoring" ]; then
        cp -r "$BACKUP_DIR/monitoring"/* ./monitoring/
        print_success "Monitoring configuration restored"
    fi
    
    # Start services
    start_services "$profile"
    
    print_success "Restore completed"
}

# Main script logic
main() {
    check_docker
    
    case $1 in
        up)
            validate_profile "${2:-$PROFILE}"
            start_services "${2:-$PROFILE}"
            ;;
        down)
            validate_profile "${2:-$PROFILE}"
            stop_services "${2:-$PROFILE}"
            ;;
        restart)
            validate_profile "${2:-$PROFILE}"
            restart_services "${2:-$PROFILE}"
            ;;
        logs)
            validate_profile "${2:-$PROFILE}"
            view_logs "${2:-$PROFILE}"
            ;;
        status)
            validate_profile "${2:-$PROFILE}"
            show_status "${2:-$PROFILE}"
            ;;
        clean)
            validate_profile "${2:-$PROFILE}"
            clean_services "${2:-$PROFILE}"
            ;;
        test)
            validate_profile "${2:-$PROFILE}"
            run_tests "${2:-$PROFILE}"
            ;;
        backup)
            validate_profile "${2:-$PROFILE}"
            create_backup "${2:-$PROFILE}"
            ;;
        restore)
            validate_profile "${2:-$PROFILE}"
            restore_backup "${2:-$PROFILE}"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"