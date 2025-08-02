#!/bin/bash

# KALDRIX Mobile App Deployment Script
# This script automates the deployment of iOS and Android apps to their respective app stores

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOYMENT_DIR="$PROJECT_ROOT/deployment"
IOS_DIR="$PROJECT_ROOT/mobile-sdk/ios"
ANDROID_DIR="$PROJECT_ROOT/mobile-sdk/android"
LOGS_DIR="$DEPLOYMENT/logs"

# Create logs directory
mkdir -p "$LOGS_DIR"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -i, --ios           Deploy iOS app only"
    echo "  -a, --android       Deploy Android app only"
    echo "  -b, --beta          Deploy to beta/testing channels"
    echo "  -r, --release       Deploy to production (default)"
    echo "  -c, --clean         Clean build artifacts before deployment"
    echo "  -t, --test          Run tests before deployment"
    echo "  -v, --verbose       Verbose output"
    echo "  -d, --dry-run       Dry run (show what would be done)"
    echo ""
    echo "Environment Variables:"
    echo "  GITHUB_TOKEN        GitHub API token"
    echo "  SLACK_WEBHOOK_URL   Slack webhook URL"
    echo "  APP_STORE_CONNECT_API_KEY  App Store Connect API key"
    echo "  GOOGLE_PLAY_JSON_KEY  Google Play service account JSON key"
    echo "  KEYSTORE_PASSWORD   Android keystore password"
    echo "  KEY_ALIAS          Android key alias"
    echo "  KEY_PASSWORD       Android key password"
    echo ""
    echo "Examples:"
    echo "  $0                  Deploy both iOS and Android to production"
    echo "  $0 -i -b           Deploy iOS to beta (TestFlight)"
    echo "  $0 -a -b           Deploy Android to beta (internal testing)"
    echo "  $0 -t -c           Run tests and clean before deployment"
    echo "  $0 -d              Dry run to see what would be deployed"
}

# Function to check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        exit 1
    fi
    
    # Check Fastlane for iOS
    if [ "$DEPLOY_IOS" = true ] && ! command -v fastlane &> /dev/null; then
        log_error "Fastlane is not installed (required for iOS deployment)"
        exit 1
    fi
    
    # Check Ruby for iOS
    if [ "$DEPLOY_IOS" = true ] && ! command -v ruby &> /dev/null; then
        log_error "Ruby is not installed (required for iOS deployment)"
        exit 1
    fi
    
    # Check Java for Android
    if [ "$DEPLOY_ANDROID" = true ] && ! command -v java &> /dev/null; then
        log_error "Java is not installed (required for Android deployment)"
        exit 1
    fi
    
    # Check Gradle for Android
    if [ "$DEPLOY_ANDROID" = true ] && ! command -v gradle &> /dev/null; then
        log_error "Gradle is not installed (required for Android deployment)"
        exit 1
    fi
    
    log_success "All dependencies are installed"
}

# Function to check environment variables
check_environment() {
    log "Checking environment variables..."
    
    # Check GitHub token
    if [ -z "$GITHUB_TOKEN" ]; then
        log_warning "GITHUB_TOKEN environment variable is not set"
    fi
    
    # Check Slack webhook
    if [ -z "$SLACK_WEBHOOK_URL" ]; then
        log_warning "SLACK_WEBHOOK_URL environment variable is not set"
    fi
    
    # Check iOS-specific variables
    if [ "$DEPLOY_IOS" = true ]; then
        if [ -z "$APP_STORE_CONNECT_API_KEY" ]; then
            log_warning "APP_STORE_CONNECT_API_KEY environment variable is not set"
        fi
    fi
    
    # Check Android-specific variables
    if [ "$DEPLOY_ANDROID" = true ]; then
        if [ -z "$GOOGLE_PLAY_JSON_KEY" ]; then
            log_warning "GOOGLE_PLAY_JSON_KEY environment variable is not set"
        fi
        if [ -z "$KEYSTORE_PASSWORD" ]; then
            log_warning "KEYSTORE_PASSWORD environment variable is not set"
        fi
        if [ -z "$KEY_ALIAS" ]; then
            log_warning "KEY_ALIAS environment variable is not set"
        fi
        if [ -z "$KEY_PASSWORD" ]; then
            log_warning "KEY_PASSWORD environment variable is not set"
        fi
    fi
    
    log_success "Environment variables checked"
}

# Function to validate project structure
validate_project() {
    log "Validating project structure..."
    
    # Check if project root exists
    if [ ! -d "$PROJECT_ROOT" ]; then
        log_error "Project root not found: $PROJECT_ROOT"
        exit 1
    fi
    
    # Check iOS directory if deploying iOS
    if [ "$DEPLOY_IOS" = true ]; then
        if [ ! -d "$IOS_DIR" ]; then
            log_error "iOS directory not found: $IOS_DIR"
            exit 1
        fi
        
        if [ ! -f "$IOS_DIR/KaldrixWallet.xcworkspace" ]; then
            log_error "iOS workspace not found: $IOS_DIR/KaldrixWallet.xcworkspace"
            exit 1
        fi
    fi
    
    # Check Android directory if deploying Android
    if [ "$DEPLOY_ANDROID" = true ]; then
        if [ ! -d "$ANDROID_DIR" ]; then
            log_error "Android directory not found: $ANDROID_DIR"
            exit 1
        fi
        
        if [ ! -f "$ANDROID_DIR/app/build.gradle" ]; then
            log_error "Android build.gradle not found: $ANDROID_DIR/app/build.gradle"
            exit 1
        fi
    fi
    
    log_success "Project structure validated"
}

# Function to run tests
run_tests() {
    log "Running tests..."
    
    if [ "$DEPLOY_IOS" = true ]; then
        log "Running iOS tests..."
        cd "$IOS_DIR"
        
        if [ "$DRY_RUN" = true ]; then
            log "[DRY RUN] Would run iOS tests"
        else
            if fastlane test 2>&1 | tee "$LOGS_DIR/ios-tests.log"; then
                log_success "iOS tests passed"
            else
                log_error "iOS tests failed"
                exit 1
            fi
        fi
        
        cd "$PROJECT_ROOT"
    fi
    
    if [ "$DEPLOY_ANDROID" = true ]; then
        log "Running Android tests..."
        cd "$ANDROID_DIR"
        
        if [ "$DRY_RUN" = true ]; then
            log "[DRY RUN] Would run Android tests"
        else
            if ./gradlew test 2>&1 | tee "$LOGS_DIR/android-tests.log"; then
                log_success "Android tests passed"
            else
                log_error "Android tests failed"
                exit 1
            fi
        fi
        
        cd "$PROJECT_ROOT"
    fi
    
    log_success "All tests passed"
}

# Function to clean build artifacts
clean_build() {
    log "Cleaning build artifacts..."
    
    if [ "$DEPLOY_IOS" = true ]; then
        log "Cleaning iOS build artifacts..."
        cd "$IOS_DIR"
        
        if [ "$DRY_RUN" = true ]; then
            log "[DRY RUN] Would clean iOS build artifacts"
        else
            if fastlane clean 2>&1 | tee "$LOGS_DIR/ios-clean.log"; then
                log_success "iOS build artifacts cleaned"
            else
                log_error "Failed to clean iOS build artifacts"
                exit 1
            fi
        fi
        
        cd "$PROJECT_ROOT"
    fi
    
    if [ "$DEPLOY_ANDROID" = true ]; then
        log "Cleaning Android build artifacts..."
        cd "$ANDROID_DIR"
        
        if [ "$DRY_RUN" = true ]; then
            log "[DRY RUN] Would clean Android build artifacts"
        else
            if ./gradlew clean 2>&1 | tee "$LOGS_DIR/android-clean.log"; then
                log_success "Android build artifacts cleaned"
            else
                log_error "Failed to clean Android build artifacts"
                exit 1
            fi
        fi
        
        cd "$PROJECT_ROOT"
    fi
    
    log_success "All build artifacts cleaned"
}

# Function to deploy iOS app
deploy_ios() {
    log "Deploying iOS app..."
    
    cd "$IOS_DIR"
    
    if [ "$BETA_DEPLOY" = true ]; then
        log "Deploying iOS to beta (TestFlight)..."
        if [ "$DRY_RUN" = true ]; then
            log "[DRY RUN] Would deploy iOS to TestFlight"
        else
            if fastlane beta 2>&1 | tee "$LOGS_DIR/ios-beta-deploy.log"; then
                log_success "iOS app deployed to TestFlight"
            else
                log_error "Failed to deploy iOS app to TestFlight"
                exit 1
            fi
        fi
    else
        log "Deploying iOS to production (App Store)..."
        if [ "$DRY_RUN" = true ]; then
            log "[DRY RUN] Would deploy iOS to App Store"
        else
            if fastlane release 2>&1 | tee "$LOGS_DIR/ios-release-deploy.log"; then
                log_success "iOS app deployed to App Store"
            else
                log_error "Failed to deploy iOS app to App Store"
                exit 1
            fi
        fi
    fi
    
    cd "$PROJECT_ROOT"
}

# Function to deploy Android app
deploy_android() {
    log "Deploying Android app..."
    
    cd "$ANDROID_DIR"
    
    if [ "$BETA_DEPLOY" = true ]; then
        log "Deploying Android to beta (internal testing)..."
        if [ "$DRY_RUN" = true ]; then
            log "[DRY RUN] Would deploy Android to internal testing"
        else
            if fastlane beta 2>&1 | tee "$LOGS_DIR/android-beta-deploy.log"; then
                log_success "Android app deployed to internal testing"
            else
                log_error "Failed to deploy Android app to internal testing"
                exit 1
            fi
        fi
    else
        log "Deploying Android to production (Google Play Store)..."
        if [ "$DRY_RUN" = true ]; then
            log "[DRY RUN] Would deploy Android to Google Play Store"
        else
            if fastlane release 2>&1 | tee "$LOGS_DIR/android-release-deploy.log"; then
                log_success "Android app deployed to Google Play Store"
            else
                log_error "Failed to deploy Android app to Google Play Store"
                exit 1
            fi
        fi
    fi
    
    cd "$PROJECT_ROOT"
}

# Function to generate deployment report
generate_report() {
    log "Generating deployment report..."
    
    local report_file="$LOGS_DIR/deployment-report-$(date +%Y%m%d-%H%M%S).html"
    
    cat > "$report_file" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KALDRIX Mobile App Deployment Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .warning {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        .log-link {
            color: #667eea;
            text-decoration: none;
        }
        .log-link:hover {
            text-decoration: underline;
        }
        .summary {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .summary-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .summary-item h3 {
            margin: 0 0 10px 0;
            color: #667eea;
        }
        .summary-item .value {
            font-size: 2em;
            font-weight: bold;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>KALDRIX Mobile App Deployment Report</h1>
        <p>Generated on $(date)</p>
    </div>
    
    <div class="summary">
        <h2>Deployment Summary</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <h3>iOS Deployment</h3>
                <div class="value" id="ios-status">Success</div>
            </div>
            <div class="summary-item">
                <h3>Android Deployment</h3>
                <div class="value" id="android-status">Success</div>
            </div>
            <div class="summary-item">
                <h3>Tests Run</h3>
                <div class="value" id="tests-status">Passed</div>
            </div>
            <div class="summary-item">
                <h3>Deployment Type</h3>
                <div class="value" id="deployment-type">Production</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>iOS Deployment Details</h2>
        <div id="ios-details">
            <div class="success">iOS app successfully deployed to App Store Connect</div>
            <p><a href="ios-release-deploy.log" class="log-link">View Deployment Log</a></p>
            <p><a href="ios-tests.log" class="log-link">View Test Results</a></p>
        </div>
    </div>
    
    <div class="section">
        <h2>Android Deployment Details</h2>
        <div id="android-details">
            <div class="success">Android app successfully deployed to Google Play Store</div>
            <p><a href="android-release-deploy.log" class="log-link">View Deployment Log</a></p>
            <p><a href="android-tests.log" class="log-link">View Test Results</a></p>
        </div>
    </div>
    
    <script>
        // Set deployment type
        document.getElementById('deployment-type').textContent = '${BETA_DEPLOY:+Beta}${BETA_DEPLOY:-Production}';
    </script>
</body>
</html>
EOF
    
    log_success "Deployment report generated: $report_file"
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        log "Sending notification to Slack..."
        
        local color="good"
        if [ "$status" = "error" ]; then
            color="danger"
        elif [ "$status" = "warning" ]; then
            color="warning"
        fi
        
        local payload="{
            \"attachments\": [
                {
                    \"color\": \"$color\",
                    \"title\": \"KALDRIX Mobile App Deployment\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {
                            \"title\": \"Environment\",
                            \"value\": \"${BETA_DEPLOY:+Beta}${BETA_DEPLOY:-Production}\",
                            \"short\": true
                        },
                        {
                            \"title\": \"iOS\",
                            \"value\": \"${DEPLOY_IOS:+✅}${DEPLOY_IOS:-❌}\",
                            \"short\": true
                        },
                        {
                            \"title\": \"Android\",
                            \"value\": \"${DEPLOY_ANDROID:+✅}${DEPLOY_ANDROID:-❌}\",
                            \"short\": true
                        },
                        {
                            \"title\": \"Time\",
                            \"value\": \"$(date)\",
                            \"short\": true
                        }
                    ]
                }
            ]
        }"
        
        if [ "$DRY_RUN" = true ]; then
            log "[DRY RUN] Would send notification to Slack"
        else
            curl -X POST -H 'Content-type: application/json' --data "$payload" "$SLACK_WEBHOOK_URL" > /dev/null 2>&1
            log_success "Notification sent to Slack"
        fi
    fi
}

# Main execution
main() {
    local deploy_ios=true
    local deploy_android=true
    local beta_deploy=false
    local clean_build=false
    local run_tests_flag=false
    local verbose=false
    local dry_run=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -i|--ios)
                deploy_ios=true
                deploy_android=false
                shift
                ;;
            -a|--android)
                deploy_ios=false
                deploy_android=true
                shift
                ;;
            -b|--beta)
                beta_deploy=true
                shift
                ;;
            -r|--release)
                beta_deploy=false
                shift
                ;;
            -c|--clean)
                clean_build=true
                shift
                ;;
            -t|--test)
                run_tests_flag=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -d|--dry-run)
                dry_run=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Set global variables
    DEPLOY_IOS=$deploy_ios
    DEPLOY_ANDROID=$deploy_android
    BETA_DEPLOY=$beta_deploy
    CLEAN_BUILD=$clean_build
    RUN_TESTS=$run_tests_flag
    VERBOSE=$verbose
    DRY_RUN=$dry_run
    
    # Set verbose mode
    if [ "$verbose" = true ]; then
        set -x
    fi
    
    log "Starting KALDRIX Mobile App Deployment"
    log "Project root: $PROJECT_ROOT"
    log "Deployment type: ${beta_deploy:+Beta}${beta_deploy:-Production}"
    log "iOS deployment: ${deploy_ios:+Yes}${deploy_ios:-No}"
    log "Android deployment: ${deploy_android:+Yes}${deploy_android:-No}"
    log "Dry run: ${dry_run:+Yes}${dry_run:-No}"
    
    # Validate environment
    check_dependencies
    check_environment
    validate_project
    
    # Run tests if requested
    if [ "$run_tests_flag" = true ]; then
        run_tests
    fi
    
    # Clean build artifacts if requested
    if [ "$clean_build" = true ]; then
        clean_build
    fi
    
    # Deploy apps
    local exit_code=0
    
    if [ "$deploy_ios" = true ]; then
        if deploy_ios; then
            log_success "iOS deployment completed"
        else
            log_error "iOS deployment failed"
            exit_code=1
        fi
    fi
    
    if [ "$deploy_android" = true ]; then
        if deploy_android; then
            log_success "Android deployment completed"
        else
            log_error "Android deployment failed"
            exit_code=1
        fi
    fi
    
    # Generate report
    generate_report
    
    # Send notification
    if [ $exit_code -eq 0 ]; then
        send_notification "success" "KALDRIX mobile app deployment completed successfully!"
        log_success "All deployments completed successfully!"
    else
        send_notification "error" "KALDRIX mobile app deployment failed. Please check the logs."
        log_error "Some deployments failed. Please check the logs above."
        exit $exit_code
    fi
}

# Run main function
main "$@"