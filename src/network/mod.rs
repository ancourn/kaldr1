//! Network layer for P2P communication

use crate::{BlockchainError, TransactionId};
use async_trait::async_trait;
use libp2p::{Multiaddr, PeerId};
use std::collections::HashMap;
use tokio::sync::RwLock;

/// Network configuration
#[derive(Debug, Clone)]
pub struct NetworkConfig {
    pub listen_addr: String,
    pub bootstrap_nodes: Vec<String>,
    pub max_peers: u32,
}

/// Network layer implementation
pub struct NetworkLayer {
    config: NetworkConfig,
    peers: HashMap<PeerId, PeerInfo>,
    is_running: bool,
}

/// Peer information
#[derive(Debug, Clone)]
pub struct PeerInfo {
    pub id: PeerId,
    pub address: Multiaddr,
    pub connected_since: std::time::Instant,
    pub reputation: f64,
}

impl NetworkLayer {
    /// Create a new network layer
    pub async fn new(config: &NetworkConfig) -> Result<Self, BlockchainError> {
        Ok(Self {
            config: config.clone(),
            peers: HashMap::new(),
            is_running: false,
        })
    }

    /// Start the network layer
    pub async fn start(&mut self) -> Result<(), BlockchainError> {
        println!("🌐 Starting network layer on {}", self.config.listen_addr);
        
        // Initialize libp2p (simplified for prototype)
        self.is_running = true;
        
        // Start background tasks
        self.start_discovery().await;
        self.start_maintenance().await;
        
        Ok(())
    }

    /// Stop the network layer
    pub async fn stop(&mut self) -> Result<(), BlockchainError> {
        println!("🌐 Stopping network layer");
        self.is_running = false;
        self.peers.clear();
        Ok(())
    }

    /// Propagate transaction to network
    pub async fn propagate_transaction(&self, tx_id: &TransactionId) -> Result<(), BlockchainError> {
        if !self.is_running {
            return Err(BlockchainError::Network(NetworkError::NotRunning));
        }

        println!("📦 Propagating transaction {} to {} peers", tx_id, self.peers.len());
        
        // In a real implementation, this would serialize and send the transaction
        // to all connected peers
        
        Ok(())
    }

    /// Get number of connected peers
    pub fn peer_count(&self) -> u32 {
        self.peers.len() as u32
    }

    /// Start peer discovery
    async fn start_discovery(&self) {
        // Simplified discovery - in real implementation would use libp2p discovery
        tokio::spawn(async {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
            
            while interval.tick().await.is_some() {
                // Simulate discovering new peers
                println!("🔍 Discovering peers...");
            }
        });
    }

    /// Start network maintenance
    async fn start_maintenance(&self) {
        tokio::spawn(async {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60);
            
            while interval.tick().await.is_some() {
                // Simulate network maintenance
                println!("🔧 Network maintenance check");
            }
        });
    }
}

/// Network error types
#[derive(Debug, thiserror::Error)]
pub enum NetworkError {
    #[error("Network layer is not running")]
    NotRunning,
    #[error("Peer not found: {0}")]
    PeerNotFound(String),
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    #[error("Protocol error: {0}")]
    ProtocolError(String),
}

/// Network trait for extensibility
#[async_trait]
pub trait NetworkService: Send + Sync {
    async fn start(&mut self) -> Result<(), BlockchainError>;
    async fn stop(&mut self) -> Result<(), BlockchainError>;
    async fn propagate_transaction(&self, tx_id: &TransactionId) -> Result<(), BlockchainError>;
    fn peer_count(&self) -> u32;
}

#[async_trait]
impl NetworkService for NetworkLayer {
    async fn start(&mut self) -> Result<(), BlockchainError> {
        self.start().await
    }

    async fn stop(&mut self) -> Result<(), BlockchainError> {
        self.stop().await
    }

    async fn propagate_transaction(&self, tx_id: &TransactionId) -> Result<(), BlockchainError> {
        self.propagate_transaction(tx_id).await
    }

    fn peer_count(&self) -> u32 {
        self.peer_count()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_network_layer_creation() {
        let config = NetworkConfig {
            listen_addr: "/ip4/127.0.0.1/tcp/0".to_string(),
            bootstrap_nodes: vec![],
            max_peers: 10,
        };

        let network = NetworkLayer::new(&config).await;
        assert!(network.is_ok());
    }

    #[tokio::test]
    async fn test_network_start_stop() {
        let config = NetworkConfig {
            listen_addr: "/ip4/127.0.0.1/tcp/0".to_string(),
            bootstrap_nodes: vec![],
            max_peers: 10,
        };

        let mut network = NetworkLayer::new(&config).await.unwrap();
        
        // Test start
        assert!(network.start().await.is_ok());
        assert!(network.is_running);
        
        // Test stop
        assert!(network.stop().await.is_ok());
        assert!(!network.is_running);
    }

    #[tokio::test]
    async fn test_peer_count() {
        let config = NetworkConfig {
            listen_addr: "/ip4/127.0.0.1/tcp/0".to_string(),
            bootstrap_nodes: vec![],
            max_peers: 10,
        };

        let network = NetworkLayer::new(&config).await.unwrap();
        assert_eq!(network.peer_count(), 0);
    }
}