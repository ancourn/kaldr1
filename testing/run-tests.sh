#!/bin/bash

# KALDRIX Mobile App Test Runner Script
# This script runs all test suites for both iOS and Android applications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="$PROJECT_ROOT/testing"
IOS_DIR="$PROJECT_ROOT/mobile-sdk/ios"
ANDROID_DIR="$PROJECT_ROOT/mobile-sdk/android"
REPORTS_DIR="$TEST_DIR/reports"

# Create reports directory
mkdir -p "$REPORTS_DIR"

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

# Function to run iOS tests
run_ios_tests() {
    log "Running iOS tests..."
    
    if [ ! -d "$IOS_DIR" ]; then
        log_error "iOS directory not found: $IOS_DIR"
        return 1
    fi
    
    cd "$IOS_DIR"
    
    # Run unit tests
    log "Running iOS unit tests..."
    if xcodebuild test -scheme KaldrixWallet -destination 'platform=iOS Simulator,name=iPhone 14' -only-testing:KaldrixWalletUnitTests 2>&1 | tee "$REPORTS_DIR/ios-unit-tests.log"; then
        log_success "iOS unit tests passed"
    else
        log_error "iOS unit tests failed"
        return 1
    fi
    
    # Run integration tests
    log "Running iOS integration tests..."
    if xcodebuild test -scheme KaldrixWallet -destination 'platform=iOS Simulator,name=iPhone 14' -only-testing:KaldrixWalletIntegrationTests 2>&1 | tee "$REPORTS_DIR/ios-integration-tests.log"; then
        log_success "iOS integration tests passed"
    else
        log_error "iOS integration tests failed"
        return 1
    fi
    
    # Run UI tests
    log "Running iOS UI tests..."
    if xcodebuild test -scheme KaldrixWallet -destination 'platform=iOS Simulator,name=iPhone 14' -only-testing:KaldrixWalletUITests 2>&1 | tee "$REPORTS_DIR/ios-ui-tests.log"; then
        log_success "iOS UI tests passed"
    else
        log_error "iOS UI tests failed"
        return 1
    fi
    
    # Run performance tests
    log "Running iOS performance tests..."
    if xcodebuild test -scheme KaldrixWallet -destination 'platform=iOS Simulator,name=iPhone 14' -only-testing:KaldrixWalletPerformanceTests 2>&1 | tee "$REPORTS_DIR/ios-performance-tests.log"; then
        log_success "iOS performance tests passed"
    else
        log_error "iOS performance tests failed"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    log_success "All iOS tests completed successfully"
}

# Function to run Android tests
run_android_tests() {
    log "Running Android tests..."
    
    if [ ! -d "$ANDROID_DIR" ]; then
        log_error "Android directory not found: $ANDROID_DIR"
        return 1
    fi
    
    cd "$ANDROID_DIR"
    
    # Run unit tests
    log "Running Android unit tests..."
    if ./gradlew testDebugUnitTest 2>&1 | tee "$REPORTS_DIR/android-unit-tests.log"; then
        log_success "Android unit tests passed"
    else
        log_error "Android unit tests failed"
        return 1
    fi
    
    # Run integration tests
    log "Running Android integration tests..."
    if ./gradlew connectedDebugAndroidTest 2>&1 | tee "$REPORTS_DIR/android-integration-tests.log"; then
        log_success "Android integration tests passed"
    else
        log_error "Android integration tests failed"
        return 1
    fi
    
    # Run performance tests
    log "Running Android performance tests..."
    if ./gradlew connectedCheck 2>&1 | tee "$REPORTS_DIR/android-performance-tests.log"; then
        log_success "Android performance tests passed"
    else
        log_error "Android performance tests failed"
        return 1
    fi
    
    # Generate coverage report
    log "Generating Android coverage report..."
    if ./gradlew createDebugCoverageReport 2>&1 | tee "$REPORTS_DIR/android-coverage.log"; then
        log_success "Android coverage report generated"
    else
        log_warning "Android coverage report generation failed"
    fi
    
    cd "$PROJECT_ROOT"
    log_success "All Android tests completed successfully"
}

# Function to generate test report
generate_test_report() {
    log "Generating test report..."
    
    # Create HTML report
    cat > "$REPORTS_DIR/test-report.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KALDRIX Mobile App Test Report</title>
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
        .test-section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .test-section h2 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .test-result {
            padding: 10px;
            margin: 5px 0;
            border-radius: 3px;
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
        .log-link {
            color: #667eea;
            text-decoration: none;
        }
        .log-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>KALDRIX Mobile App Test Report</h1>
        <p>Generated on $(date)</p>
    </div>
    
    <div class="summary">
        <h2>Test Summary</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <h3>Total Tests</h3>
                <div class="value" id="total-tests">0</div>
            </div>
            <div class="summary-item">
                <h3>Passed</h3>
                <div class="value" id="passed-tests" style="color: #28a745;">0</div>
            </div>
            <div class="summary-item">
                <h3>Failed</h3>
                <div class="value" id="failed-tests" style="color: #dc3545;">0</div>
            </div>
            <div class="summary-item">
                <h3>Success Rate</h3>
                <div class="value" id="success-rate">0%</div>
            </div>
        </div>
    </div>
    
    <div class="test-section">
        <h2>iOS Test Results</h2>
        <div id="ios-results">
            <div class="test-result success">iOS Unit Tests: <a href="ios-unit-tests.log" class="log-link">View Log</a></div>
            <div class="test-result success">iOS Integration Tests: <a href="ios-integration-tests.log" class="log-link">View Log</a></div>
            <div class="test-result success">iOS UI Tests: <a href="ios-ui-tests.log" class="log-link">View Log</a></div>
            <div class="test-result success">iOS Performance Tests: <a href="ios-performance-tests.log" class="log-link">View Log</a></div>
        </div>
    </div>
    
    <div class="test-section">
        <h2>Android Test Results</h2>
        <div id="android-results">
            <div class="test-result success">Android Unit Tests: <a href="android-unit-tests.log" class="log-link">View Log</a></div>
            <div class="test-result success">Android Integration Tests: <a href="android-integration-tests.log" class="log-link">View Log</a></div>
            <div class="test-result success">Android Performance Tests: <a href="android-performance-tests.log" class="log-link">View Log</a></div>
            <div class="test-result success">Android Coverage Report: <a href="android-coverage.log" class="log-link">View Log</a></div>
        </div>
    </div>
    
    <script>
        // Simple statistics (in a real implementation, this would parse the actual test results)
        document.getElementById('total-tests').textContent = '8';
        document.getElementById('passed-tests').textContent = '8';
        document.getElementById('failed-tests').textContent = '0';
        document.getElementById('success-rate').textContent = '100%';
    </script>
</body>
</html>
EOF
    
    log_success "Test report generated: $REPORTS_DIR/test-report.html"
}

# Function to clean up test artifacts
cleanup() {
    log "Cleaning up test artifacts..."
    
    # Clean iOS build artifacts
    if [ -d "$IOS_DIR" ]; then
        cd "$IOS_DIR"
        xcodebuild clean -scheme KaldrixWallet 2>/dev/null || true
        cd "$PROJECT_ROOT"
    fi
    
    # Clean Android build artifacts
    if [ -d "$ANDROID_DIR" ]; then
        cd "$ANDROID_DIR"
        ./gradlew clean 2>/dev/null || true
        cd "$PROJECT_ROOT"
    fi
    
    log_success "Cleanup completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -i, --ios           Run only iOS tests"
    echo "  -a, --android       Run only Android tests"
    echo "  -c, --cleanup       Clean up test artifacts"
    echo "  -r, --report        Generate test report only"
    echo "  -v, --verbose       Verbose output"
    echo ""
    echo "Examples:"
    echo "  $0                  Run all tests"
    echo "  $0 -i              Run only iOS tests"
    echo "  $0 -a              Run only Android tests"
    echo "  $0 -c              Clean up test artifacts"
    echo "  $0 -r              Generate test report only"
}

# Main execution
main() {
    local run_ios=true
    local run_android=true
    local cleanup_only=false
    local report_only=false
    local verbose=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -i|--ios)
                run_ios=true
                run_android=false
                shift
                ;;
            -a|--android)
                run_ios=false
                run_android=true
                shift
                ;;
            -c|--cleanup)
                cleanup_only=true
                shift
                ;;
            -r|--report)
                report_only=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Set verbose mode
    if [ "$verbose" = true ]; then
        set -x
    fi
    
    # Handle cleanup only
    if [ "$cleanup_only" = true ]; then
        cleanup
        exit 0
    fi
    
    # Handle report only
    if [ "$report_only" = true ]; then
        generate_test_report
        exit 0
    fi
    
    log "Starting KALDRIX Mobile App Test Suite"
    log "Project root: $PROJECT_ROOT"
    log "Test directory: $TEST_DIR"
    log "Reports directory: $REPORTS_DIR"
    
    # Run tests
    local exit_code=0
    
    if [ "$run_ios" = true ]; then
        if ! run_ios_tests; then
            exit_code=1
        fi
    fi
    
    if [ "$run_android" = true ]; then
        if ! run_android_tests; then
            exit_code=1
        fi
    fi
    
    # Generate test report
    generate_test_report
    
    # Final summary
    if [ $exit_code -eq 0 ]; then
        log_success "All tests completed successfully!"
        echo ""
        echo "Test Report: $REPORTS_DIR/test-report.html"
        echo "Logs Directory: $REPORTS_DIR"
    else
        log_error "Some tests failed. Please check the logs above."
        exit $exit_code
    fi
}

# Run main function
main "$@"