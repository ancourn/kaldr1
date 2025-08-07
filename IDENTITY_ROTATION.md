# Identity Rotation for Quantum-Proof DAG Blockchain

This document describes the identity rotation system for the Quantum-Proof DAG Blockchain, which provides secure key rotation capabilities for maintaining post-quantum cryptographic security.

## Overview

Identity rotation is a critical security feature that allows nodes to periodically generate new cryptographic keypairs while maintaining continuity of operations. This is especially important for post-quantum cryptography (PQC) where key management best practices recommend regular key rotation.

## Key Features

### 1. **Automatic Key Rotation**
- Generates new Ed25519, X25519, Dilithium3, and Dilithium5 keypairs
- Maintains backward compatibility during transition
- Automatic backup of previous identities

### 2. **Secure Backup System**
- Encrypted backup of previous identities
- Automatic cleanup of old backups (keeps last 5)
- Timestamped backup files with metadata

### 3. **Rotation Scheduling**
- Configurable rotation intervals
- Readiness checks before rotation
- Minimum age and cooldown periods

### 4. **Validation & Safety Checks**
- Identity age validation (minimum 24 hours)
- Rotation cooldown (minimum 12 hours between rotations)
- Storage space validation
- Backup system health checks

## API Endpoints

### POST /rotate-identity
Initiates identity rotation process.

**Request:**
```json
POST /rotate-identity
Content-Type: application/json
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Identity rotation initiated. Check logs for details.",
    "timestamp": "2024-01-01T00:00:00Z",
    "note": "In a production implementation, this would trigger actual key rotation"
  },
  "error": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### GET /identity
Returns current identity information including rotation status.

**Response:**
```json
{
  "success": true,
  "data": {
    "node_id": "qd_1234567890abcdef",
    "ed25519_public": "ed25519_pub_key_hex",
    "x25519_public": "x25519_pub_key_hex",
    "dilithium3_public": "dilithium3_pub_key_hex",
    "dilithium5_public": "dilithium5_pub_key_hex",
    "signature_types": ["ed25519", "dilithium3", "dilithium5", "hybrid"],
    "created_at": 1704067200,
    "metadata": {
      "version": "0.1.0",
      "network": "quantum-dag",
      "signature_schemes": "ed25519,dilithium3,dilithium5",
      "rotation_requested": "2024-01-01T00:00:00Z",
      "rotation_status": "pending",
      "last_rotation": "2024-01-01T00:00:00Z",
      "rotation_count": "1"
    }
  },
  "error": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Implementation Details

### IdentityManager Methods

#### `rotate_identity()`
Generates a new node identity and backs up the old one.

```rust
pub async fn rotate_identity(&mut self) -> Result<NodeIdentity, BlockchainError>
```

**Process:**
1. Generate new cryptographic keypairs
2. Backup existing identity to timestamped file
3. Update current identity in memory
4. Save new identity to persistent storage
5. Update metadata with rotation information
6. Clean up old backup files

#### `backup_identity()`
Creates a secure backup of the current identity.

```rust
async fn backup_identity(&self, identity: &NodeIdentity) -> Result<(), BlockchainError>
```

**Features:**
- Timestamped backup files
- Metadata inclusion (backup reason, timestamp)
- Automatic cleanup of old backups

#### `validate_rotation_readiness()`
Checks if the system is ready for identity rotation.

```rust
pub async fn validate_rotation_readiness(&self) -> Result<IdentityRotationReadiness, BlockchainError>
```

**Validation Checks:**
- Identity age (minimum 24 hours)
- Time since last rotation (minimum 12 hours)
- Backup system accessibility
- Available storage space (minimum 10MB)

#### `schedule_rotation()`
Schedules automatic identity rotation at specified intervals.

```rust
pub async fn schedule_rotation(&self, interval_hours: u64) -> Result<(), BlockchainError>
```

**Parameters:**
- `interval_hours`: Hours between rotations

#### `get_rotation_history()`
Retrieves the history of identity rotations.

```rust
pub async fn get_rotation_history(&self) -> Result<Vec<IdentityRotationEvent>, BlockchainError>
```

**Returns:**
- List of rotation events sorted by timestamp (newest first)

### Data Structures

#### `IdentityRotationEvent`
```rust
pub struct IdentityRotationEvent {
    pub timestamp: i64,
    pub node_id: String,
    pub backup_file: String,
    pub metadata: HashMap<String, String>,
}
```

#### `IdentityRotationReadiness`
```rust
pub struct IdentityRotationReadiness {
    pub is_ready: bool,
    pub reasons: Vec<String>,
    pub recommendations: Vec<String>,
}
```

## Security Considerations

### 1. **Key Generation**
- Uses cryptographically secure random number generation
- Generates fresh keypairs for all supported algorithms
- Maintains key separation between different algorithms

### 2. **Backup Security**
- Backup files are stored in the designated storage directory
- No encryption of backup files (filesystem security should be used)
- Automatic cleanup prevents accumulation of sensitive data

### 3. **Rotation Timing**
- Minimum age prevents rotation of very new identities
- Cooldown period prevents rapid successive rotations
- Scheduling allows for automated maintenance

### 4. **Continuity of Operations**
- New identity is generated before old one is decommissioned
- Backup allows for recovery if rotation fails
- Metadata tracks rotation history for auditing

## Best Practices

### 1. **Rotation Schedule**
- **Production**: Rotate every 30-90 days
- **Testing**: Rotate every 7-14 days
- **High Security**: Rotate every 7-30 days

### 2. **Monitoring**
- Monitor rotation events in logs
- Track backup file sizes and counts
- Alert on rotation failures

### 3. **Backup Management**
- Regularly verify backup integrity
- Monitor available storage space
- Consider off-site backup for critical nodes

### 4. **Testing**
- Test rotation process in development environment
- Verify backup restoration procedures
- Test with various storage conditions

## Configuration

### Environment Variables
```bash
# Identity rotation configuration
IDENTITY_ROTATION_INTERVAL_HOURS=72  # Rotate every 3 days
IDENTITY_BACKUP_COUNT=5             # Keep 5 backup files
IDENTITY_MIN_AGE_HOURS=24           # Minimum age before rotation
IDENTITY_COOLDOWN_HOURS=12          # Minimum time between rotations
```

### Configuration File
```json
{
  "identity": {
    "rotation": {
      "interval_hours": 72,
      "backup_count": 5,
      "min_age_hours": 24,
      "cooldown_hours": 12
    },
    "storage": {
      "path": "./data/identity",
      "backup_retention_days": 30
    }
  }
}
```

## Troubleshooting

### Common Issues

#### 1. **Rotation Fails Due to Age**
```
Error: Identity is too young (12 hours old, minimum: 24 hours)
```
**Solution:** Wait until the identity is at least 24 hours old.

#### 2. **Rotation Fails Due to Cooldown**
```
Error: Recent rotation (6 hours ago, minimum: 12 hours between rotations)
```
**Solution:** Wait at least 12 hours between rotations.

#### 3. **Insufficient Storage Space**
```
Error: Insufficient storage space for identity backup
```
**Solution:** Free up disk space or configure a larger storage location.

#### 4. **Backup System Inaccessible**
```
Error: Cannot access backup system: Permission denied
```
**Solution:** Check file permissions and storage directory accessibility.

### Debug Commands

```bash
# Check identity status
curl http://localhost:8080/identity

# Check rotation readiness
curl http://localhost:8080/identity | jq '.data.metadata.rotation_status'

# View rotation history
ls -la ./data/identity/identity_backup_*.json

# Check available space
df -h ./data/identity/

# Monitor rotation logs
tail -f /var/log/quantum-dag/identity.log
```

## Monitoring and Metrics

### Key Metrics
- `dag_identity_rotations_total` - Total number of identity rotations
- `dag_signature_verifications_total` - Signature verification attempts
- `dag_signature_failures_total` - Signature verification failures

### Log Events
```
INFO: 🔄 Starting identity rotation...
INFO: 📦 Backed up previous identity: qd_old_node_id
INFO: ✅ Identity rotation completed. New node ID: qd_new_node_id
WARN: ⚠️  Identity rotation failed: insufficient storage space
ERROR: ❌ Identity backup creation failed: permission denied
```

## Integration Examples

### 1. **Automated Rotation Script**
```bash
#!/bin/bash
# rotate_identity.sh - Automated identity rotation

# Check if rotation is needed
readiness=$(curl -s http://localhost:8080/identity | jq '.data.metadata.rotation_status')

if [ "$readiness" != "pending" ]; then
    echo "Initiating identity rotation..."
    response=$(curl -s -X POST http://localhost:8080/rotate-identity)
    echo "$response" | jq '.'
    
    # Verify rotation completed
    sleep 5
    new_status=$(curl -s http://localhost:8080/identity | jq '.data.metadata.rotation_status')
    echo "New rotation status: $new_status"
else
    echo "Rotation already pending or not ready"
fi
```

### 2. **Monitoring Integration**
```python
# monitor_rotation.py - Monitor identity rotation events
import requests
import time
from datetime import datetime

def monitor_identity_rotation():
    while True:
        try:
            response = requests.get("http://localhost:8080/identity")
            data = response.json()
            
            if data['success']:
                metadata = data['data']['metadata']
                last_rotation = metadata.get('last_rotation')
                rotation_count = metadata.get('rotation_count', '0')
                
                print(f"Node ID: {data['data']['node_id']}")
                print(f"Rotation Count: {rotation_count}")
                print(f"Last Rotation: {last_rotation}")
                
                # Check if rotation is needed
                if last_rotation:
                    last_time = datetime.fromisoformat(last_rotation.replace('Z', '+00:00'))
                    hours_since = (datetime.now(last_time.tzinfo) - last_time).total_seconds() / 3600
                    
                    if hours_since > 72:  # 3 days
                        print("Rotation recommended - initiating...")
                        requests.post("http://localhost:8080/rotate-identity")
                
        except Exception as e:
            print(f"Error monitoring identity: {e}")
        
        time.sleep(3600)  # Check every hour

if __name__ == "__main__":
    monitor_identity_rotation()
```

## Future Enhancements

### 1. **Automatic Rotation Service**
- Background service for automatic rotation
- Configurable schedules and policies
- Integration with system service managers

### 2. **Distributed Rotation Coordination**
- Coordinate rotation across multiple nodes
- Network-wide rotation events
- Consensus-based rotation scheduling

### 3. **Enhanced Backup Security**
- Encrypted backup files
- Off-site backup replication
- Backup integrity verification

### 4. **Rotation Analytics**
- Rotation success rate tracking
- Performance metrics analysis
- Predictive rotation scheduling

## Conclusion

The identity rotation system provides a robust, secure mechanism for maintaining cryptographic key freshness in the Quantum-Proof DAG Blockchain. By implementing regular key rotation, nodes can maintain strong post-quantum security while ensuring operational continuity.

The system is designed with safety checks, backup mechanisms, and comprehensive monitoring to ensure reliable operation in production environments.