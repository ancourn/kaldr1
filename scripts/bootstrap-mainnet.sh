#!/bin/bash

# KALDRIX Mainnet Bootstrap Script
# This script bootstraps the KALDRIX Quantum DAG Blockchain mainnet

set -e

# Configuration
NETWORK="mainnet"
GENESIS_FILE="/etc/kaldrix/genesis.json"
CONFIG_DIR="/etc/kaldrix"
DATA_DIR="/var/lib/kaldrix"
LOG_DIR="/var/log/kaldrix"
BACKUP_DIR="/backup/kaldrix"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root"
   exit 1
fi

# Create necessary directories
log "Creating necessary directories..."
mkdir -p $CONFIG_DIR
mkdir -p $DATA_DIR
mkdir -p $LOG_DIR
mkdir -p $BACKUP_DIR

# Set permissions
chown -R kaldrix:kaldrix $CONFIG_DIR
chown -R kaldrix:kaldrix $DATA_DIR
chown -R kaldrix:kaldrix $LOG_DIR
chown -R kaldrix:kaldrix $BACKUP_DIR
chmod 750 $CONFIG_DIR
chmod 750 $DATA_DIR
chmod 750 $LOG_DIR
chmod 750 $BACKUP_DIR

# Function to generate quantum-resistant key pair
generate_quantum_keys() {
    local key_type=$1
    local output_file=$2
    
    log "Generating $key_type quantum-resistant key pair..."
    
    # Generate Dilithium3 key pair
    kaldrix-node generate-keys \
        --key-type $key_type \
        --output $output_file \
        --encrypt
    
    if [[ $? -eq 0 ]]; then
        log_success "Generated $key_type keys: $output_file"
    else
        log_error "Failed to generate $key_type keys"
        exit 1
    fi
}

# Function to create genesis configuration
create_genesis_config() {
    log "Creating mainnet genesis configuration..."
    
    cat > $GENESIS_FILE << 'EOF'
{
  "name": "kaldrix-mainnet",
  "network_id": "1",
  "chain_id": "kaldrix-mainnet-1",
  "genesis_time": "2024-12-15T00:00:00Z",
  "initial_validators": [
    {
      "id": "validator1",
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f8e8B4",
      "public_key": "dilithium3_pubkey_1",
      "stake": 1000000000000000000000,
      "commission_rate": 5,
      "description": "KALDRIX Foundation Validator 1"
    },
    {
      "id": "validator2", 
      "address": "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
      "public_key": "dilithium3_pubkey_2",
      "stake": 1000000000000000000000,
      "commission_rate": 5,
      "description": "KALDRIX Foundation Validator 2"
    },
    {
      "id": "validator3",
      "address": "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
      "public_key": "dilithium3_pubkey_3", 
      "stake": 1000000000000000000000,
      "commission_rate": 5,
      "description": "KALDRIX Foundation Validator 3"
    },
    {
      "id": "validator4",
      "address": "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
      "public_key": "dilithium3_pubkey_4",
      "stake": 1000000000000000000000,
      "commission_rate": 5,
      "description": "KALDRIX Foundation Validator 4"
    }
  ],
  "token_distribution": {
    "total_supply": "1000000000000000000000000000",
    "initial_distribution": [
      {
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f8e8B4",
        "amount": "200000000000000000000000000",
        "description": "Foundation Treasury"
      },
      {
        "address": "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
        "amount": "100000000000000000000000000",
        "description": "Ecosystem Development"
      },
      {
        "address": "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
        "amount": "50000000000000000000000000",
        "description": "Team Allocation"
      },
      {
        "address": "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
        "amount": "50000000000000000000000000",
        "description": "Community Rewards"
      }
    ]
  },
  "consensus_params": {
    "block_time": 2,
    "epoch_length": 86400,
    "validator_set_size": 4,
    "min_stake_amount": "1000000000000000000000",
    "max_validators": 100,
    "unbonding_period": 604800,
    "quantum_resistant": true,
    "key_rotation_interval": 7776000
  },
  "dag_params": {
    "max_parents": 8,
    "max_transactions_per_unit": 100,
    "conflict_resolution_threshold": 0.67,
    "finality_threshold": 0.8,
    "sync_batch_size": 1000
  },
  "governance_params": {
    "proposal_threshold": "10000000000000000000000",
    "voting_period": 604800,
    "execution_delay": 86400,
    "quorum_threshold": 0.5,
    "approval_threshold": 0.67,
    "veto_threshold": 0.33
  }
}
EOF

    log_success "Genesis configuration created: $GENESIS_FILE"
}

# Function to setup TLS certificates
setup_tls_certificates() {
    log "Setting up TLS certificates..."
    
    # Create TLS directory
    mkdir -p $CONFIG_DIR/tls
    
    # Generate self-signed certificates for initial setup
    openssl req -x509 -newkey rsa:4096 -keyout $CONFIG_DIR/tls/key.pem \
        -out $CONFIG_DIR/tls/cert.pem -days 365 -nodes \
        -subj "/C=US/ST=California/L=San Francisco/O=KALDRIX/CN=kaldrix.com"
    
    # Set permissions
    chmod 600 $CONFIG_DIR/tls/key.pem
    chmod 644 $CONFIG_DIR/tls/cert.pem
    chown kaldrix:kaldrix $CONFIG_DIR/tls/key.pem
    chown kaldrix:kaldrix $CONFIG_DIR/tls/cert.pem
    
    log_success "TLS certificates setup completed"
}

# Function to create node configuration
create_node_config() {
    local node_type=$1
    local node_id=$2
    
    log "Creating configuration for $node_type node: $node_id"
    
    cat > $CONFIG_DIR/${node_id}.toml << EOF
[network]
network_id = "1"
chain_id = "kaldrix-mainnet-1"
bootstrap_nodes = [
    "bootstrap1.mainnet.kaldrix.com:8443",
    "bootstrap2.mainnet.kaldrix.com:8443", 
    "bootstrap3.mainnet.kaldrix.com:8443"
]
listen_address = "0.0.0.0:8443"
public_address = "${node_id}.mainnet.kaldrix.com:8443"
max_peers = 50
min_peers = 10

[consensus]
validator_enabled = true
block_production_enabled = true
voting_enabled = true
quantum_resistant = true
key_rotation_enabled = true

[security]
tls_enabled = true
tls_cert_path = "/etc/kaldrix/tls/cert.pem"
tls_key_path = "/etc/kaldrix/tls/key.pem"
quantum_resistant = true

[storage]
data_dir = "/var/lib/kaldrix"
max_storage_size = "1000GB"
backup_enabled = true
backup_schedule = "0 2 * * *"

[monitoring]
metrics_enabled = true
metrics_port = 9090
log_level = "info"
log_rotation = "daily"
log_retention = "7d"

[validator]
id = "$node_id"
enabled = true
stake_amount = "1000000000000000000000"
commission_rate = 5
description = "KALDRIX Mainnet Validator"

[governance]
enabled = true
voting_enabled = true
proposal_creation_enabled = true
EOF

    log_success "Configuration created for $node_id"
}

# Function to generate validator keys
generate_validator_keys() {
    log "Generating validator keys..."
    
    for validator_id in validator1 validator2 validator3 validator4; do
        generate_quantum_keys "dilithium3" "$CONFIG_DIR/${validator_id}_keys.json"
    done
    
    log_success "All validator keys generated"
}

# Function to create systemd service
create_systemd_service() {
    local node_id=$1
    
    log "Creating systemd service for $node_id"
    
    cat > /etc/systemd/system/kaldrix-${node_id}.service << EOF
[Unit]
Description=KALDRIX Mainnet Node - $node_id
After=network.target

[Service]
Type=simple
User=kaldrix
Group=kaldrix
ExecStart=/usr/local/bin/kaldrix-node \\
    --config /etc/kaldrix/${node_id}.toml \\
    --genesis /etc/kaldrix/genesis.json \\
    --validator-keys /etc/kaldrix/${node_id}_keys.json \\
    --data-dir /var/lib/kaldrix/${node_id}
Restart=always
RestartSec=10
LimitNOFILE=65536

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/lib/kaldrix/${node_id}
ReadWritePaths=/var/log/kaldrix
ProtectHome=true
RemoveIPC=true

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable kaldrix-${node_id}
    
    log_success "Systemd service created for $node_id"
}

# Function to initialize blockchain state
initialize_blockchain() {
    log "Initializing blockchain state..."
    
    # Create data directory for each validator
    for validator_id in validator1 validator2 validator3 validator4; do
        mkdir -p $DATA_DIR/${validator_id}
        chown kaldrix:kaldrix $DATA_DIR/${validator_id}
    done
    
    # Initialize genesis block
    kaldrix-node init-genesis \
        --genesis-file $GENESIS_FILE \
        --data-dir $DATA_DIR \
        --network mainnet
    
    if [[ $? -eq 0 ]]; then
        log_success "Blockchain state initialized"
    else
        log_error "Failed to initialize blockchain state"
        exit 1
    fi
}

# Function to setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create Prometheus configuration
    mkdir -p /etc/prometheus
    cat > /etc/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/etc/prometheus/alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - localhost:9093

scrape_configs:
  - job_name: 'kaldrix-nodes'
    static_configs:
      - targets: ['localhost:9090', 'localhost:9091', 'localhost:9092', 'localhost:9093']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
EOF

    # Create alert rules
    cat > /etc/prometheus/alert_rules.yml << 'EOF'
groups:
- name: kaldrix-alerts
  rules:
  - alert: NodeDown
    expr: up == 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Node is down"
      description: "Node {{ $labels.instance }} has been down for more than 5 minutes"

  - alert: HighMemoryUsage
    expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage"
      description: "Memory usage is above 90% on {{ $labels.instance }}"

  - alert: BlockProductionStopped
    expr: rate(kaldrix_blocks_produced_total[5m]) == 0
    for: 10m
    labels:
      severity: critical
    annotations:
      summary: "Block production stopped"
      description: "No blocks have been produced in the last 10 minutes"
EOF

    log_success "Monitoring setup completed"
}

# Function to start services
start_services() {
    log "Starting KALDRIX services..."
    
    # Start validator nodes
    for validator_id in validator1 validator2 validator3 validator4; do
        log "Starting $validator_id..."
        systemctl start kaldrix-${validator_id}
        
        # Wait for service to start
        sleep 5
        
        # Check service status
        if systemctl is-active --quiet kaldrix-${validator_id}; then
            log_success "$validator_id started successfully"
        else
            log_error "Failed to start $validator_id"
            systemctl status kaldrix-${validator_id}
        fi
    done
    
    # Start monitoring services
    systemctl start prometheus
    systemctl start grafana-server
    systemctl start alertmanager
    
    log_success "All services started"
}

# Function to verify bootstrap
verify_bootstrap() {
    log "Verifying bootstrap completion..."
    
    # Wait for nodes to sync
    sleep 30
    
    # Check node status
    for validator_id in validator1 validator2 validator3 validator4; do
        status=$(systemctl is-active kaldrix-${validator_id})
        if [[ $status == "active" ]]; then
            log_success "$validator_id is running"
        else
            log_error "$validator_id is not running"
        fi
    done
    
    # Check blockchain status
    log "Checking blockchain status..."
    kaldrix-node status --config /etc/kaldrix/validator1.toml
    
    # Check network connectivity
    log "Checking network connectivity..."
    for validator_id in validator1 validator2 validator3 validator4; do
        kaldrix-node network-status --config /etc/kaldrix/${validator_id}.toml
    done
    
    log_success "Bootstrap verification completed"
}

# Main execution
main() {
    log "Starting KALDRIX Mainnet Bootstrap..."
    log "Network: $NETWORK"
    log "Genesis File: $GENESIS_FILE"
    
    # Step 1: Create genesis configuration
    create_genesis_config
    
    # Step 2: Setup TLS certificates
    setup_tls_certificates
    
    # Step 3: Generate validator keys
    generate_validator_keys
    
    # Step 4: Create node configurations
    for validator_id in validator1 validator2 validator3 validator4; do
        create_node_config "validator" $validator_id
    done
    
    # Step 5: Create systemd services
    for validator_id in validator1 validator2 validator3 validator4; do
        create_systemd_service $validator_id
    done
    
    # Step 6: Initialize blockchain state
    initialize_blockchain
    
    # Step 7: Setup monitoring
    setup_monitoring
    
    # Step 8: Start services
    start_services
    
    # Step 9: Verify bootstrap
    verify_bootstrap
    
    log_success "KALDRIX Mainnet Bootstrap completed successfully!"
    log "Mainnet is now live and operational."
    
    # Display important information
    echo ""
    echo "=== KALDRIX MAINNET BOOTSTRAP SUMMARY ==="
    echo "Network: kaldrix-mainnet-1"
    echo "Chain ID: 1"
    echo "Genesis Time: 2024-12-15T00:00:00Z"
    echo "Validators: 4"
    echo "Total Supply: 1,000,000,000 KALD"
    echo ""
    echo "Validator Nodes:"
    for validator_id in validator1 validator2 validator3 validator4; do
        echo "  - $validator_id: systemctl status kaldrix-${validator_id}"
    done
    echo ""
    echo "Monitoring:"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3000"
    echo "  - Alertmanager: http://localhost:9093"
    echo ""
    echo "Next Steps:"
    echo "1. Setup DNS records for domain names"
    echo "2. Configure load balancers"
    echo "3. Deploy API gateway nodes"
    echo "4. Start transaction broadcasting"
    echo "5. Monitor validator heartbeat"
    echo ""
}

# Execute main function
main "$@"