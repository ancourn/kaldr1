#!/bin/bash

# KALDRIX Security Audit Script
# This script performs comprehensive security audits of the blockchain

set -e

echo "🔒 KALDRIX Security Audit"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Audit configuration
BASE_URL="http://localhost:8080"
AUDIT_LOG="security-audit-$(date +%Y%m%d_%H%M%S).log"
REPORT_FILE="security-audit-report-$(date +%Y%m%d_%H%M%S).md"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[AUDIT]${NC} $1" | tee -a "$AUDIT_LOG"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$AUDIT_LOG"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$AUDIT_LOG"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$AUDIT_LOG"
}

# Function to check if blockchain is running
check_blockchain_status() {
    print_status "Checking blockchain status..."
    
    if curl -s -f "$BASE_URL/health" > /dev/null 2>&1; then
        print_success "Blockchain is accessible"
        return 0
    else
        print_error "Blockchain is not accessible at $BASE_URL"
        return 1
    fi
}

# Function to audit cryptographic security
audit_cryptography() {
    print_status "Auditing cryptographic security..."
    
    local crypto_score=0
    local max_score=100
    
    # Check PQC implementation
    print_status "Checking Post-Quantum Cryptography implementation..."
    
    if curl -s "$BASE_URL/api/identity/generate" -H "Content-Type: application/json" -d '{"algorithm":"dilithium3"}' | grep -q "public_key"; then
        print_success "Dilithium3 key generation working"
        crypto_score=$((crypto_score + 20))
    else
        print_error "Dilithium3 key generation failed"
    fi
    
    if curl -s "$BASE_URL/api/identity/generate" -H "Content-Type: application/json" -d '{"algorithm":"dilithium5"}' | grep -q "public_key"; then
        print_success "Dilithium5 key generation working"
        crypto_score=$((crypto_score + 20))
    else
        print_error "Dilithium5 key generation failed"
    fi
    
    # Check key rotation
    print_status "Checking key rotation functionality..."
    
    local temp_key=$(curl -s "$BASE_URL/api/identity/generate" -H "Content-Type: application/json" -d '{"algorithm":"ed25519"}' | jq -r '.public_key')
    
    if curl -s "$BASE_URL/api/identity/rotate" -H "Content-Type: application/json" -d "{\"current_public_key\":\"$temp_key\",\"new_algorithm\":\"dilithium3\"}" | grep -q "rotation_success"; then
        print_success "Key rotation functionality working"
        crypto_score=$((crypto_score + 20))
    else
        print_error "Key rotation functionality failed"
    fi
    
    # Check quantum resistance score
    print_status "Checking quantum resistance metrics..."
    
    local qr_score=$(curl -s "$BASE_URL/api/blockchain/status" | jq -r '.quantum_resistance_score // 0')
    if (( $(echo "$qr_score > 0.8" | bc -l) 2>/dev/null || [ "$qr_score" = "true" ] )); then
        print_success "Quantum resistance score: $qr_score (good)"
        crypto_score=$((crypto_score + 20))
    else
        print_warning "Quantum resistance score: $qr_score (needs improvement)"
        crypto_score=$((crypto_score + 10))
    fi
    
    # Check signature verification
    print_status "Checking signature verification..."
    
    if curl -s "$BASE_URL/api/identity/verify" -H "Content-Type: application/json" -d '{"public_key":"test","signature":"test","message":"test"}' | grep -q "verification_result"; then
        print_success "Signature verification endpoint accessible"
        crypto_score=$((crypto_score + 20))
    else
        print_error "Signature verification endpoint not accessible"
    fi
    
    print_status "Cryptography Security Score: $crypto_score/$max_score"
    return $crypto_score
}

# Function to audit network security
audit_network_security() {
    print_status "Auditing network security..."
    
    local network_score=0
    local max_score=100
    
    # Check HTTPS/TLS
    print_status "Checking HTTPS/TLS configuration..."
    
    if curl -s -k -I "$BASE_URL" | grep -i "HTTP/2"; then
        print_success "HTTP/2 support detected"
        network_score=$((network_score + 15))
    else
        print_warning "HTTP/2 not detected"
    fi
    
    if curl -s -k -I "$BASE_URL" | grep -i "strict-transport-security"; then
        print_success "HSTS header present"
        network_score=$((network_score + 15)
    else
        print_warning "HSTS header not present"
    fi
    
    # Check security headers
    print_status "Checking security headers..."
    
    local headers=$(curl -s -k -I "$BASE_URL")
    
    if echo "$headers" | grep -i "x-content-type-options"; then
        print_success "X-Content-Type-Options header present"
        network_score=$((network_score + 10))
    else
        print_warning "X-Content-Type-Options header missing"
    fi
    
    if echo "$headers" | grep -i "x-frame-options"; then
        print_success "X-Frame-Options header present"
        network_score=$((network_score + 10))
    else
        print_warning "X-Frame-Options header missing"
    fi
    
    if echo "$headers" | grep -i "content-security-policy"; then
        print_success "Content-Security-Policy header present"
        network_score=$((network_score + 15)
    else
        print_warning "Content-Security-Policy header missing"
    fi
    
    # Check rate limiting
    print_status "Checking rate limiting..."
    
    local request_count=0
    local rate_limited=false
    
    for i in {1..50}; do
        if ! curl -s "$BASE_URL/api/blockchain/status" > /dev/null 2>&1; then
            rate_limited=true
            break
        fi
        request_count=$((request_count + 1))
    done
    
    if [ "$rate_limited" = true ]; then
        print_success "Rate limiting is working (limited after $request_count requests)"
        network_score=$((network_score + 20))
    else
        print_warning "Rate limiting may not be working"
        network_score=$((network_score + 10))
    fi
    
    # Check CORS configuration
    print_status "Checking CORS configuration..."
    
    if curl -s -H "Origin: http://malicious.com" "$BASE_URL/api/blockchain/status" | grep -q "access-control-allow-origin"; then
        print_warning "CORS may be too permissive"
        network_score=$((network_score + 5))
    else
        print_success "CORS appears to be properly configured"
        network_score=$((network_score + 15))
    fi
    
    print_status "Network Security Score: $network_score/$max_score"
    return $network_score
}

# Function to audit application security
audit_application_security() {
    print_status "Auditing application security..."
    
    local app_score=0
    local max_score=100
    
    # Test input validation
    print_status "Testing input validation..."
    
    # Test SQL injection
    if curl -s "$BASE_URL/api/transactions" -H "Content-Type: application/json" -d '{"sender":"'\'' OR 1=1 --","receiver":"test","amount":100}' | grep -q "error"; then
        print_success "SQL injection protection working"
        app_score=$((app_score + 20))
    else
        print_error "SQL injection protection may not be working"
    fi
    
    # Test XSS
    if curl -s "$BASE_URL/api/transactions" -H "Content-Type: application/json" -d '{"sender":"<script>alert(1)</script>","receiver":"test","amount":100}' | grep -q "error"; then
        print_success "XSS protection working"
        app_score=$((app_score + 20))
    else
        print_error "XSS protection may not be working"
    fi
    
    # Test authentication
    print_status "Testing authentication..."
    
    if curl -s "$BASE_URL/api/admin/reset" | grep -q "401\|403"; then
        print_success "Protected endpoints require authentication"
        app_score=$((app_score + 20))
    else
        print_error "Protected endpoints may not require authentication"
    fi
    
    # Test error handling
    print_status "Testing error handling..."
    
    if curl -s "$BASE_URL/api/transactions/nonexistent" | grep -q "404"; then
        print_success "Proper 404 error handling"
        app_score=$((app_score + 10))
    else
        print_error "Improper 404 error handling"
    fi
    
    # Test parameter validation
    print_status "Testing parameter validation..."
    
    if curl -s "$BASE_URL/api/transactions" -H "Content-Type: application/json" -d '{"sender":"test","receiver":"test","amount":-100}' | grep -q "error"; then
        print_success "Negative amount validation working"
        app_score=$((app_score + 15))
    else
        print_error "Negative amount validation may not be working"
    fi
    
    # Test file upload protection
    print_status "Testing file upload protection..."
    
    if curl -s -X POST "$BASE_URL/api/transactions" -H "Content-Type: multipart/form-data" -F "file=@/dev/null" | grep -q "error"; then
        print_success "File upload protection working"
        app_score=$((app_score + 15))
    else
        print_warning "File upload protection may not be working"
    fi
    
    print_status "Application Security Score: $app_score/$max_score"
    return $app_score
}

# Function to audit data security
audit_data_security() {
    print_status "Auditing data security..."
    
    local data_score=0
    local max_score=100
    
    # Check data encryption
    print_status "Checking data encryption..."
    
    if curl -s "$BASE_URL/api/backup/create" -H "Content-Type: application/json" -d '{"backup_type":"full","encryption_enabled":true}' | grep -q "backup_success"; then
        print_success "Encrypted backup functionality working"
        data_score=$((data_score + 25))
    else
        print_error "Encrypted backup functionality not working"
    fi
    
    # Check data integrity
    print_status "Checking data integrity..."
    
    if curl -s "$BASE_URL/api/database/stats" | grep -q "database_size"; then
        print_success "Database integrity checking accessible"
        data_score=$((data_score + 25))
    else
        print_error "Database integrity checking not accessible"
    fi
    
    # Check secure storage
    print_status "Checking secure storage..."
    
    if curl -s "$BASE_URL/api/identity/generate" | grep -q "private_key"; then
        print_warning "Private keys returned in API response (should be handled securely)"
        data_score=$((data_score + 15))
    else
        print_success "Private keys not exposed in API responses"
        data_score=$((data_score + 25))
    fi
    
    # Check backup security
    print_status "Checking backup security..."
    
    if curl -s "$BASE_URL/api/backup/list" | grep -q "backup_id"; then
        print_success "Backup listing functionality working"
        data_score=$((data_score + 25))
    else
        print_error "Backup listing functionality not working"
    fi
    
    print_status "Data Security Score: $data_score/$max_score"
    return $data_score
}

# Function to generate security report
generate_security_report() {
    print_status "Generating security audit report..."
    
    cat > "$REPORT_FILE" << EOF
# KALDRIX Security Audit Report

**Generated:** $(date)
**Audit Duration:** $(echo $SECONDS) seconds
**Base URL:** $BASE_URL

## Executive Summary

This security audit report provides a comprehensive analysis of the KALDRIX blockchain's security posture. The audit covers cryptographic security, network security, application security, and data security.

## Audit Results

### Cryptographic Security Score: $crypto_score/100
- Post-Quantum Cryptography implementation
- Key rotation functionality
- Quantum resistance metrics
- Signature verification

### Network Security Score: $network_score/100
- HTTPS/TLS configuration
- Security headers
- Rate limiting
- CORS configuration

### Application Security Score: $app_score/100
- Input validation
- Authentication
- Error handling
- Parameter validation

### Data Security Score: $data_score/100
- Data encryption
- Data integrity
- Secure storage
- Backup security

## Detailed Findings

### Critical Issues
$(grep -A 5 -B 5 "\[FAIL\]" "$AUDIT_LOG" || echo "No critical issues found")

### Warnings
$(grep -A 5 -B 5 "\[WARN\]" "$AUDIT_LOG" || echo "No warnings found")

### Passed Checks
$(grep -A 5 -B 5 "\[PASS\]" "$AUDIT_LOG" | head -50 || echo "Security checks completed")

## Recommendations

### Immediate Actions
1. Address all critical issues identified in the audit
2. Implement all security warnings
3. Enhance security headers and configurations

### Short-term Improvements
1. Implement comprehensive logging and monitoring
2. Add additional input validation layers
3. Enhance rate limiting and DDoS protection

### Long-term Enhancements
1. Implement HSM integration for key management
2. Add multi-factor authentication
3. Conduct regular security audits and penetration testing

## System Information

### Environment
- **OS:** $(uname -a)
- **Rust Version:** $(rustc --version)
- **Audit Date:** $(date)

### Blockchain Status
$(curl -s "$BASE_URL/api/blockchain/status" | jq . 2>/dev/null || echo "Status check failed")

### Security Headers
$(curl -s -k -I "$BASE_URL" | grep -i "security\|strict\|content\|x-")

## Compliance Notes

This audit follows industry best practices for blockchain security:
- NIST Cybersecurity Framework
- OWASP Application Security Verification Standard
- ISO 27001 Security Controls

## Next Steps

1. **Remediate Critical Issues:** Address all critical security findings immediately
2. **Implement Monitoring:** Set up continuous security monitoring
3. **Regular Audits:** Schedule regular security audits and penetration testing
4. **Security Training:** Provide security training for development team

---

*This report was automatically generated by the KALDRIX security audit script.*
EOF

    print_success "Security audit report generated: $REPORT_FILE"
}

# Main execution
main() {
    print_status "Starting KALDRIX security audit..."
    
    # Check if blockchain is running
    if ! check_blockchain_status; then
        print_error "Blockchain is not running. Please start the blockchain first."
        exit 1
    fi
    
    # Initialize scores
    crypto_score=0
    network_score=0
    app_score=0
    data_score=0
    
    # Run security audits
    print_status "================================"
    print_status "Cryptographic Security Audit"
    print_status "================================"
    crypto_score=$(audit_cryptography)
    
    print_status "================================"
    print_status "Network Security Audit"
    print_status "================================"
    network_score=$(audit_network_security)
    
    print_status "================================"
    print_status "Application Security Audit"
    print_status "================================"
    app_score=$(audit_application_security)
    
    print_status "================================"
    print_status "Data Security Audit"
    print_status "================================"
    data_score=$(audit_data_security)
    
    # Calculate overall score
    total_score=$((crypto_score + network_score + app_score + data_score))
    max_score=400
    percentage=$((total_score * 100 / max_score))
    
    # Generate final report
    print_status "================================"
    print_status "Security Audit Summary"
    print_status "================================"
    print_status "Overall Security Score: $total_score/$max_score ($percentage%)"
    
    if [ $percentage -ge 90 ]; then
        print_success "Excellent security posture"
    elif [ $percentage -ge 70 ]; then
        print_warning "Good security posture with room for improvement"
    elif [ $percentage -ge 50 ]; then
        print_warning "Moderate security posture - improvements needed"
    else
        print_error "Poor security posture - immediate action required"
    fi
    
    # Generate detailed report
    generate_security_report
    
    print_status "Security audit completed. Detailed report saved to: $REPORT_FILE"
    print_status "Audit log saved to: $AUDIT_LOG"
    
    # Exit with appropriate code
    if [ $percentage -ge 70 ]; then
        exit 0
    else
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            BASE_URL="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --url URL     Blockchain base URL (default: http://localhost:8080)"
            echo "  --help, -h    Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"