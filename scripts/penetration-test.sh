#!/bin/bash

# KALDRIX Blockchain Penetration Testing Script
# Comprehensive security testing for blockchain infrastructure

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
TARGET=${1:-"localhost"}
PORT=${2:-"443"}
OUTPUT_DIR="/tmp/kaldrix-pentest-$(date +%Y%m%d_%H%M%S)"
REPORT_FILE="$OUTPUT_DIR/pentest-report.md"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Logging function
log() {
    echo -e "$1" | tee -a "$OUTPUT_DIR/pentest.log"
}

# Check if tools are available
check_tools() {
    log "${BLUE}Checking for required tools...${NC}"
    
    local tools=("curl" "nmap" "nikto" "sqlmap" "openssl" "jq" "wget")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
            log "${RED}✗ Missing: $tool${NC}"
        else
            log "${GREEN}✓ Available: $tool${NC}"
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log "${YELLOW}Warning: Missing tools: ${missing_tools[*]}${NC}"
        log "${YELLOW}Some tests may be skipped.${NC}"
    fi
}

# Initialize report
init_report() {
    cat > "$REPORT_FILE" << EOF
# KALDRIX Blockchain Penetration Testing Report

**Date:** $(date)  
**Target:** $TARGET:$PORT  
**Auditor:** $(whoami)  
**System:** $(uname -a)

## Executive Summary

This penetration test assesses the security posture of the KALDRIX blockchain infrastructure.
The test includes network scanning, web application testing, API security testing, and cryptographic analysis.

## Test Scope

- **Target:** $TARGET:$PORT
- **Components Tested:**
  - Web application and API endpoints
  - Network services and ports
  - Cryptographic implementations
  - Authentication and authorization mechanisms
  - Input validation and sanitization

## Testing Methodology

The penetration test follows the OWASP Testing Guide and includes:
1. Information Gathering
2. Network Scanning
3. Web Application Testing
4. API Security Testing
5. Cryptographic Analysis
6. Authentication Testing
7. Authorization Testing
8. Input Validation Testing

EOF
}

# 1. Information Gathering
information_gathering() {
    log "${YELLOW}=== 1. INFORMATION GATHERING ===${NC}"
    
    cat >> "$REPORT_FILE" << 'EOF'

## 1. Information Gathering

### DNS Information
EOF
    
    # DNS information
    if command_exists dig; then
        log "${BLUE}Gathering DNS information...${NC}"
        dig "$TARGET" >> "$OUTPUT_DIR/dns-info.txt" 2>/dev/null
        echo "\`\`\`" >> "$REPORT_FILE"
        cat "$OUTPUT_DIR/dns-info.txt" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << 'EOF'

### SSL/TLS Certificate Information
EOF
    
    # SSL/TLS information
    if command_exists openssl; then
        log "${BLUE}Gathering SSL/TLS information...${NC}"
        openssl s_client -connect "$TARGET:$PORT" -showcerts </dev/null 2>/dev/null > "$OUTPUT_DIR/ssl-info.txt"
        echo "\`\`\`" >> "$REPORT_FILE"
        grep -E "(Subject:|Issuer:|Not Before|Not After|DNS:)" "$OUTPUT_DIR/ssl-info.txt" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
    fi
    
    # HTTP headers
    if command_exists curl; then
        log "${BLUE}Gathering HTTP headers...${NC}"
        curl -s -I "https://$TARGET:$PORT" > "$OUTPUT_DIR/http-headers.txt"
        
        cat >> "$REPORT_FILE" << 'EOF'

### HTTP Headers
\`\`\`
EOF
        cat "$OUTPUT_DIR/http-headers.txt" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
    fi
}

# 2. Network Scanning
network_scanning() {
    log "${YELLOW}=== 2. NETWORK SCANNING ===${NC}"
    
    cat >> "$REPORT_FILE" << 'EOF'

## 2. Network Scanning

### Port Scan Results
EOF
    
    if command_exists nmap; then
        log "${BLUE}Running NMAP port scan...${NC}"
        nmap -sS -T4 -p- "$TARGET" > "$OUTPUT_DIR/nmap-full.txt"
        nmap -sV -sC -p 80,443,8080,8999 "$TARGET" > "$OUTPUT_DIR/nmap-detailed.txt"
        
        echo "\`\`\`" >> "$REPORT_FILE"
        cat "$OUTPUT_DIR/nmap-detailed.txt" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        
        # Check for open ports
        open_ports=$(grep "open" "$OUTPUT_DIR/nmap-detailed.txt" | wc -l)
        log "${BLUE}Found $open_ports open ports${NC}"
    fi
}

# 3. Web Application Testing
web_application_testing() {
    log "${YELLOW}=== 3. WEB APPLICATION TESTING ===${NC}"
    
    cat >> "$REPORT_FILE" << 'EOF'

## 3. Web Application Testing

### Nikto Web Vulnerability Scan
EOF
    
    if command_exists nikto; then
        log "${BLUE}Running Nikto vulnerability scan...${NC}"
        nikto -h "https://$TARGET:$PORT" -output "$OUTPUT_DIR/nikto-report.txt" 2>/dev/null
        
        echo "\`\`\`" >> "$REPORT_FILE"
        cat "$OUTPUT_DIR/nikto-report.txt" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
    fi
    
    # Directory brute force
    log "${BLUE}Running directory brute force...${NC}"
    if command_exists curl; then
        local common_dirs=("admin" "api" "backup" "config" "logs" "test" "dev" "staging")
        
        cat >> "$REPORT_FILE" << 'EOF'

### Directory Discovery
EOF
        
        echo "\`\`\`" >> "$REPORT_FILE"
        for dir in "${common_dirs[@]}"; do
            if curl -s -o /dev/null -w "%{http_code}" "https://$TARGET:$PORT/$dir/" | grep -q "200\|403"; then
                echo "Found: /$dir/" | tee -a "$REPORT_FILE"
            fi
        done
        echo "\`\`\`" >> "$REPORT_FILE"
    fi
}

# 4. API Security Testing
api_security_testing() {
    log "${YELLOW}=== 4. API SECURITY TESTING ===${NC}"
    
    cat >> "$REPORT_FILE" << 'EOF'

## 4. API Security Testing

### API Endpoint Discovery
EOF
    
    if command_exists curl; then
        log "${BLUE}Testing API endpoints...${NC}"
        
        local endpoints=("/api/health" "/api/blockchain/status" "/api/transactions" "/api/validators")
        
        echo "\`\`\`" >> "$REPORT_FILE"
        for endpoint in "${endpoints[@]}"; do
            local status_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$TARGET:$PORT$endpoint")
            echo "GET $endpoint - Status: $status_code" | tee -a "$REPORT_FILE"
        done
        echo "\`\`\`" >> "$REPORT_FILE"
        
        cat >> "$REPORT_FILE" << 'EOF'

### Authentication Testing
EOF
        
        echo "\`\`\`" >> "$REPORT_FILE"
        # Test authentication bypass
        auth_result=$(curl -s "https://$TARGET:$PORT/api/blockchain/status" | jq -r '.status // "unauthorized"')
        echo "Authentication Test: $auth_result" | tee -a "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        
        cat >> "$REPORT_FILE" << 'EOF'

### Input Validation Testing
EOF
        
        echo "\`\`\`" >> "$REPORT_FILE"
        # Test SQL injection
        sql_injection_test=$(curl -s "https://$TARGET:$PORT/api/transactions?limit=1' OR '1'='1" | jq -r '.error // "no error"')
        echo "SQL Injection Test: $sql_injection_test" | tee -a "$REPORT_FILE"
        
        # Test XSS
        xss_test=$(curl -s "https://$TARGET:$PORT/api/transactions?search=<script>alert('XSS')</script>" | jq -r '.error // "no error"')
        echo "XSS Test: $xss_test" | tee -a "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
    fi
}

# 5. Cryptographic Analysis
cryptographic_analysis() {
    log "${YELLOW}=== 5. CRYPTOGRAPHIC ANALYSIS ===${NC}"
    
    cat >> "$REPORT_FILE" << 'EOF'

## 5. Cryptographic Analysis

### SSL/TLS Configuration
EOF
    
    if command_exists openssl; then
        log "${BLUE}Analyzing SSL/TLS configuration...${NC}"
        
        # Test SSL protocols
        echo "\`\`\`" >> "$REPORT_FILE"
        echo "SSL/TLS Protocol Support:" >> "$REPORT_FILE"
        
        protocols=("ssl2" "ssl3" "tls1" "tls1_1" "tls1_2" "tls1_3")
        for proto in "${protocols[@]}"; do
            if openssl s_client -connect "$TARGET:$PORT" -$proto </dev/null >/dev/null 2>&1; then
                echo "✓ $proto supported" >> "$REPORT_FILE"
            else
                echo "✗ $proto not supported" >> "$REPORT_FILE"
            fi
        done
        echo "\`\`\`" >> "$REPORT_FILE"
        
        # Test cipher suites
        log "${BLUE}Testing cipher suites...${NC}"
        openssl s_client -connect "$TARGET:$PORT" -cipher 'ALL:eNULL' </dev/null 2>/dev/null > "$OUTPUT_DIR/ciphers.txt"
        
        cat >> "$REPORT_FILE" << 'EOF'

### Cipher Suites
\`\`\`
EOF
        grep "Cipher" "$OUTPUT_DIR/ciphers.txt" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
    fi
    
    # Test quantum resistance
    log "${BLUE}Testing quantum resistance...${NC}"
    
    cat >> "$REPORT_FILE" << 'EOF'

### Quantum Resistance Analysis
EOF
    
    echo "\`\`\`" >> "$REPORT_FILE"
    # Check for PQC headers or endpoints
    if curl -s "https://$TARGET:$PORT/api/health" | grep -q "quantum"; then
        echo "✓ Quantum-resistant features detected" >> "$REPORT_FILE"
    else
        echo "⚠ Quantum-resistant features not explicitly advertised" >> "$REPORT_FILE"
    fi
    echo "\`\`\`" >> "$REPORT_FILE"
}

# 6. Blockchain-Specific Testing
blockchain_testing() {
    log "${YELLOW}=== 6. BLOCKCHAIN-SPECIFIC TESTING ===${NC}"
    
    cat >> "$REPORT_FILE" << 'EOF'

## 6. Blockchain-Specific Testing

### Node Connectivity Test
EOF
    
    if command_exists curl; then
        log "${BLUE}Testing blockchain node connectivity...${NC}"
        
        echo "\`\`\`" >> "$REPORT_FILE"
        # Test node synchronization
        sync_status=$(curl -s "https://$TARGET:$PORT/api/blockchain/status" | jq -r '.sync_status // "unknown"')
        echo "Node Sync Status: $sync_status" >> "$REPORT_FILE"
        
        # Test network peers
        peers=$(curl -s "https://$TARGET:$PORT/api/blockchain/status" | jq -r '.network_peers // 0')
        echo "Network Peers: $peers" >> "$REPORT_FILE"
        
        # Test validator status
        validators=$(curl -s "https://$TARGET:$PORT/api/blockchain/status" | jq -r '.active_validators // 0')
        echo "Active Validators: $validators" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        
        cat >> "$REPORT_FILE" << 'EOF'

### Transaction Security Test
EOF
        
        echo "\`\`\`" >> "$REPORT_FILE"
        # Test transaction validation
        tx_test=$(curl -s -X POST "https://$TARGET:$PORT/api/transactions" \
            -H "Content-Type: application/json" \
            -d '{"sender": "test", "receiver": "test", "amount": 0}' | jq -r '.error // "no error"')
        echo "Transaction Validation Test: $tx_test" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
    fi
}

# 7. Generate Risk Assessment
generate_risk_assessment() {
    log "${YELLOW}=== 7. RISK ASSESSMENT ===${NC}"
    
    cat >> "$REPORT_FILE" << 'EOF'

## 7. Risk Assessment

### Critical Findings
EOF
    
    # Analyze results for critical issues
    local critical_issues=0
    local high_issues=0
    local medium_issues=0
    local low_issues=0
    
    # Check for critical issues
    if grep -q "SQL injection" "$OUTPUT_DIR/pentest.log"; then
        echo "- **CRITICAL**: Potential SQL injection vulnerability detected" >> "$REPORT_FILE"
        ((critical_issues++))
    fi
    
    if grep -q "XSS" "$OUTPUT_DIR/pentest.log"; then
        echo "- **CRITICAL**: Potential XSS vulnerability detected" >> "$REPORT_FILE"
        ((critical_issues++))
    fi
    
    if grep -q "ssl2\|ssl3\|tls1\|tls1_1" "$OUTPUT_DIR/pentest.log"; then
        echo "- **HIGH**: Weak SSL/TLS protocols supported" >> "$REPORT_FILE"
        ((high_issues++))
    fi
    
    if [ "$critical_issues" -eq 0 ]; then
        echo "- No critical security issues found" >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << 'EOF'

### Risk Rating
EOF
    
    # Calculate risk rating
    local total_issues=$((critical_issues + high_issues + medium_issues + low_issues))
    
    if [ "$critical_issues" -gt 0 ]; then
        echo "**Risk Rating: CRITICAL**" >> "$REPORT_FILE"
        echo "Immediate action required. Do not deploy to production." >> "$REPORT_FILE"
    elif [ "$high_issues" -gt 0 ]; then
        echo "**Risk Rating: HIGH**" >> "$REPORT_FILE"
        echo "Address high-priority issues before production deployment." >> "$REPORT_FILE"
    elif [ "$medium_issues" -gt 0 ]; then
        echo "**Risk Rating: MEDIUM**" >> "$REPORT_FILE"
        echo "Address medium-priority issues soon." >> "$REPORT_FILE"
    else
        echo "**Risk Rating: LOW**" >> "$REPORT_FILE"
        echo "System appears secure for production deployment." >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << 'EOF'

### Security Score
EOF
    
    # Calculate security score
    local security_score=$((100 - (critical_issues * 30) - (high_issues * 15) - (medium_issues * 5) - (low_issues * 1)))
    if [ "$security_score" -lt 0 ]; then
        security_score=0
    fi
    
    echo "**Security Score: $security_score/100**" >> "$REPORT_FILE"
    
    if [ "$security_score" -ge 90 ]; then
        echo "**Rating: EXCELLENT** - Ready for production" >> "$REPORT_FILE"
    elif [ "$security_score" -ge 80 ]; then
        echo "**Rating: GOOD** - Nearly ready for production" >> "$REPORT_FILE"
    elif [ "$security_score" -ge 70 ]; then
        echo "**Rating: SATISFACTORY** - Needs improvements" >> "$REPORT_FILE"
    else
        echo "**Rating: POOR** - Not ready for production" >> "$REPORT_FILE"
    fi
}

# 8. Generate Recommendations
generate_recommendations() {
    log "${YELLOW}=== 8. RECOMMENDATIONS ===${NC}"
    
    cat >> "$REPORT_FILE" << 'EOF'

## 8. Recommendations

### Immediate Actions (Critical)
EOF
    
    if grep -q "SQL injection\|XSS" "$OUTPUT_DIR/pentest.log"; then
        echo "- Patch all identified SQL injection and XSS vulnerabilities immediately" >> "$REPORT_FILE"
        echo "- Implement input validation and sanitization" >> "$REPORT_FILE"
        echo "- Use parameterized queries for database access" >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << 'EOF'

### Short-term Actions (High Priority)
EOF
    
    if grep -q "ssl2\|ssl3\|tls1\|tls1_1" "$OUTPUT_DIR/pentest.log"; then
        echo "- Disable weak SSL/TLS protocols (SSLv2, SSLv3, TLS 1.0, TLS 1.1)" >> "$REPORT_FILE"
        echo "- Enable TLS 1.2 and TLS 1.3 only" >> "$REPORT_FILE"
    fi
    
    echo "- Implement Web Application Firewall (WAF)" >> "$REPORT_FILE"
    echo "- Enable rate limiting on all API endpoints" >> "$REPORT_FILE"
    echo "- Implement comprehensive logging and monitoring" >> "$REPORT_FILE"
    
    cat >> "$REPORT_FILE" << 'EOF'

### Long-term Actions (Medium Priority)
- Implement HSM integration for key management
- Add multi-factor authentication for administrative access
- Conduct regular security audits and penetration tests
- Implement network segmentation and zero-trust architecture
- Add comprehensive audit logging for all blockchain operations

### Best Practices
- Keep all systems updated with latest security patches
- Use strong cryptographic algorithms (AES-256, SHA-256, etc.)
- Implement proper access controls and least privilege
- Regular backup testing and disaster recovery drills
- Security awareness training for all team members

### Blockchain-Specific Recommendations
- Implement quantum-resistant key rotation schedule
- Add additional validation for blockchain transactions
- Implement network-level DDoS protection
- Add comprehensive monitoring for blockchain-specific metrics
- Implement secure key backup and recovery procedures

EOF
}

# Main execution
main() {
    log "${PURPLE}KALDRIX Blockchain Penetration Testing${NC}"
    log "${BLUE}Target: $TARGET:$PORT${NC}"
    log "${BLUE}Output Directory: $OUTPUT_DIR${NC}"
    echo ""
    
    # Initialize
    check_tools
    init_report
    
    # Run tests
    information_gathering
    network_scanning
    web_application_testing
    api_security_testing
    cryptographic_analysis
    blockchain_testing
    
    # Generate assessment and recommendations
    generate_risk_assessment
    generate_recommendations
    
    # Finalize report
    cat >> "$REPORT_FILE" << EOF

---

**Report Generated:** $(date)  
**Next Recommended Test:** $(date -d "+30 days" +%Y-%m-%d)  
**Contact:** security@kaldrix.com

*This report contains sensitive security information and should be handled accordingly.*
EOF
    
    # Summary
    log "${GREEN}=== PENETRATION TEST COMPLETED ===${NC}"
    log "${BLUE}Report generated: $REPORT_FILE${NC}"
    log "${BLUE}Log file: $OUTPUT_DIR/pentest.log${NC}"
    
    echo ""
    echo "=== PENTEST SUMMARY ==="
    echo "Target: $TARGET:$PORT"
    echo "Report: $REPORT_FILE"
    echo ""
    
    # Display security score if available
    if [ -f "$REPORT_FILE" ]; then
        local score=$(grep "Security Score:" "$REPORT_FILE" | cut -d' ' -f3 | cut -d'/' -f1)
        if [ -n "$score" ]; then
            echo "Security Score: $score/100"
            
            if [ "$score" -ge 90 ]; then
                echo "🏆 EXCELLENT - Ready for production!"
            elif [ "$score" -ge 80 ]; then
                echo "✓ GOOD - Nearly ready for production"
            elif [ "$score" -ge 70 ]; then
                echo "⚠ SATISFACTORY - Needs improvements"
            else
                echo "🚨 POOR - Not ready for production"
            fi
        fi
    fi
}

# Execute main function
main "$@"