-- Quantum DAG Blockchain Database Initialization Script

-- Create database if not exists
-- This is handled by Docker environment variables

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create blockchain nodes table
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id VARCHAR(255) UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    ip_address INET,
    port INTEGER,
    last_seen TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_hash VARCHAR(255) UNIQUE NOT NULL,
    previous_hash VARCHAR(255),
    height BIGINT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    nonce BIGINT,
    difficulty INTEGER DEFAULT 1,
    transactions_count INTEGER DEFAULT 0,
    size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_hash VARCHAR(255) UNIQUE NOT NULL,
    block_id UUID REFERENCES blocks(id),
    sender_id UUID REFERENCES users(id),
    recipient_id UUID REFERENCES users(id),
    amount DECIMAL(20, 8) NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    signature TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Create identity keys table
CREATE TABLE IF NOT EXISTS identity_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_type VARCHAR(50) NOT NULL, -- 'ed25519', 'dilithium3', 'dilithium5'
    public_key TEXT NOT NULL,
    private_key_encrypted TEXT NOT NULL,
    key_id VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    rotated_at TIMESTAMP WITH TIME ZONE
);

-- Create backups table
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'differential'
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT,
    checksum_sha256 VARCHAR(64),
    status VARCHAR(50) DEFAULT 'created',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(20, 8) NOT NULL,
    metric_tags JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blocks_height ON blocks(height);
CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_nodes_node_id ON nodes(node_id);
CREATE INDEX IF NOT EXISTS idx_nodes_active ON nodes(is_active);
CREATE INDEX IF NOT EXISTS idx_identity_keys_key_type ON identity_keys(key_type);
CREATE INDEX IF NOT EXISTS idx_identity_keys_active ON identity_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_backups_type ON backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nodes_updated_at BEFORE UPDATE ON nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password should be changed immediately)
INSERT INTO users (username, email, password_hash) 
VALUES ('admin', 'admin@quantum-dag.local', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK3a7LjJQlBdFJLzJ4T9Y6J6J6J6')
ON CONFLICT (email) DO NOTHING;

-- Insert default node
INSERT INTO nodes (node_id, public_key, ip_address, port, is_active)
VALUES ('default-node', 'default-public-key', '127.0.0.1', 8080, true)
ON CONFLICT (node_id) DO NOTHING;

-- Create view for blockchain statistics
CREATE OR REPLACE VIEW blockchain_stats AS
SELECT 
    COUNT(*) as total_blocks,
    MAX(height) as current_height,
    COUNT(CASE WHEN timestamp >= CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 1 END) as blocks_last_hour,
    COUNT(CASE WHEN timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 1 END) as blocks_last_24h,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_transactions,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
    COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 1 END) as transactions_last_hour
FROM blocks b
LEFT JOIN transactions t ON b.id = t.block_id;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO quantum_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO quantum_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO quantum_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO quantum_user;

-- Set default permissions for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO quantum_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO quantum_user;

-- Create function to clean up old backups
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM backups 
    WHERE expires_at < CURRENT_TIMESTAMP 
    OR (created_at < CURRENT_TIMESTAMP - INTERVAL '30 days' AND status = 'created');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get node health metrics
CREATE OR REPLACE FUNCTION get_node_health_metrics()
RETURNS TABLE(
    node_id VARCHAR,
    is_active BOOLEAN,
    last_seen TIMESTAMP,
    uptime_hours DECIMAL,
    blocks_processed INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.node_id,
        n.is_active,
        n.last_seen,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - n.last_seen)) / 3600 as uptime_hours,
        COUNT(b.id) as blocks_processed
    FROM nodes n
    LEFT JOIN blocks b ON n.node_id = b.block_hash -- Adjust based on actual node-block relationship
    GROUP BY n.node_id, n.is_active, n.last_seen;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate network difficulty
CREATE OR REPLACE FUNCTION calculate_network_difficulty()
RETURNS DECIMAL AS $$
DECLARE
    avg_difficulty DECIMAL;
BEGIN
    SELECT AVG(difficulty) INTO avg_difficulty
    FROM blocks
    WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours';
    
    RETURN COALESCE(avg_difficulty, 1.0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get transaction throughput
CREATE OR REPLACE FUNCTION get_transaction_throughput(interval_hours INTEGER DEFAULT 24)
RETURNS DECIMAL AS $$
DECLARE
    throughput DECIMAL;
BEGIN
    SELECT COUNT(*)::DECIMAL / interval_hours INTO throughput
    FROM transactions
    WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour' * interval_hours;
    
    RETURN COALESCE(throughput, 0.0);
END;
$$ LANGUAGE plpgsql;