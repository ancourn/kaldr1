//! Mobile client for Quantum DAG Blockchain network communication

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use serde::{Serialize, Deserialize};
use tokio::sync::RwLock;
use reqwest::{Client, Response, StatusCode};
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};
use tokio_tungstenite::tungstenite::Message;
use futures::{StreamExt, SinkExt};
use uuid::Uuid;

use crate::types::*;
use crate::crypto::CryptoService;
use crate::utils::retry;
use crate::{SDKConfig, NetworkConfig, SDKResult, SDKError};

/// Mobile client for blockchain communication
pub struct MobileClient {
    http_client: Client,
    ws_client: Option<Arc<RwLock<WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>>>>,
    config: NetworkConfig,
    crypto: Arc<CryptoService>,
    node_index: usize,
    connected_peers: Arc<RwLock<HashMap<String, Peer>>>,
}

impl MobileClient {
    /// Create new mobile client
    pub fn new(config: &NetworkConfig, crypto: Arc<CryptoService>) -> SDKResult<Self> {
        let http_client = Client::builder()
            .timeout(Duration::from_secs(config.timeout_secs))
            .build()
            .map_err(|e| SDKError::Network(e.to_string()))?;

        Ok(Self {
            http_client,
            ws_client: None,
            config: config.clone(),
            crypto,
            node_index: 0,
            connected_peers: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Get wallet balance
    pub async fn get_balance(&self, address: &str) -> SDKResult<u64> {
        let url = self.get_node_url("/api/balance");
        let params = serde_json::json!({"address": address});
        
        let response = self.post(&url, &params).await?;
        let balance_response: BalanceResponse = response.json().await
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        Ok(balance_response.balance)
    }

    /// Send transaction
    pub async fn send_transaction(&self, transaction: &Transaction) -> SDKResult<TransactionHash> {
        let url = self.get_node_url("/api/transactions");
        let tx_data = serde_json::to_value(transaction)
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        let response = self.post(&url, &tx_data).await?;
        let tx_response: TransactionResponse = response.json().await
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        Ok(tx_response.hash)
    }

    /// Get transaction status
    pub async fn get_transaction_status(&self, hash: &str) -> SDKResult<TransactionStatus> {
        let url = self.get_node_url(&format!("/api/transactions/{}/status", hash));
        
        let response = self.get(&url).await?;
        let status_response: TransactionStatusResponse = response.json().await
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        Ok(status_response.status)
    }

    /// Get blockchain status
    pub async fn get_blockchain_status(&self) -> SDKResult<BlockchainStatus> {
        let url = self.get_node_url("/api/status");
        
        let response = self.get(&url).await?;
        let status_response: BlockchainStatusResponse = response.json().await
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        Ok(BlockchainStatus {
            total_transactions: status_response.total_transactions,
            network_peers: status_response.network_peers,
            consensus_height: status_response.consensus_height,
            quantum_resistance_score: status_response.quantum_resistance_score,
            last_block_time: status_response.last_block_time,
            network_hashrate: status_response.network_hashrate,
            difficulty: status_response.difficulty,
        })
    }

    /// Get network info
    pub async fn get_network_info(&self) -> SDKResult<NetworkInfo> {
        let url = self.get_node_url("/api/network/info");
        
        let response = self.get(&url).await?;
        let network_response: NetworkInfoResponse = response.json().await
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        Ok(NetworkInfo {
            network_id: network_response.network_id,
            version: network_response.version,
            protocol_version: network_response.protocol_version,
            total_nodes: network_response.total_nodes,
            active_nodes: network_response.active_nodes,
            total_supply: network_response.total_supply,
            circulating_supply: network_response.circulating_supply,
            block_time: network_response.block_time,
            current_height: network_response.current_height,
        })
    }

    /// Check node health
    pub async fn check_node_health(&self) -> SDKResult<NodeHealth> {
        let url = self.get_node_url("/health");
        
        let response = self.get(&url).await?;
        let health_response: HealthResponse = response.json().await
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        Ok(NodeHealth {
            is_healthy: health_response.status == "healthy",
            uptime_seconds: health_response.uptime,
            last_block_height: health_response.last_block_height,
            connected_peers: health_response.connected_peers,
            memory_usage_mb: health_response.memory_usage,
            cpu_usage_percent: health_response.cpu_usage,
            disk_usage_gb: health_response.disk_usage,
            network_latency_ms: health_response.network_latency,
        })
    }

    /// Get connected peers
    pub async fn get_connected_peers(&self) -> SDKResult<Vec<Peer>> {
        let url = self.get_node_url("/api/network/peers");
        
        let response = self.get(&url).await?;
        let peers_response: PeersResponse = response.json().await
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        // Update connected peers cache
        {
            let mut peers = self.connected_peers.write().await;
            peers.clear();
            for peer in &peers_response.peers {
                peers.insert(peer.id.clone(), peer.clone());
            }
        }
        
        Ok(peers_response.peers)
    }

    /// Connect to WebSocket
    pub async fn connect_websocket(&self) -> SDKResult<()> {
        let ws_url = self.get_ws_url();
        
        let (ws_stream, _) = connect_async(&ws_url).await
            .map_err(|e| SDKError::Network(e.to_string()))?;
        
        let ws_client = Arc::new(RwLock::new(ws_stream));
        
        // Start listening for messages
        let client = ws_client.clone();
        let peers = self.connected_peers.clone();
        
        tokio::spawn(async move {
            if let Err(e) = Self::handle_websocket_messages(client, peers).await {
                eprintln!("WebSocket error: {}", e);
            }
        });
        
        Ok(())
    }

    /// Handle WebSocket messages
    async fn handle_websocket_messages(
        ws_client: Arc<RwLock<WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>>>,
        peers: Arc<RwLock<HashMap<String, Peer>>>,
    ) -> SDKResult<()> {
        let mut ws = ws_client.write().await;
        
        while let Some(msg) = ws.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Ok(event) = serde_json::from_str::<WebSocketEvent>(&text) {
                        match event.event_type.as_str() {
                            "new_transaction" => {
                                // Handle new transaction event
                                log::debug!("New transaction: {}", event.data);
                            },
                            "new_block" => {
                                // Handle new block event
                                log::debug!("New block: {}", event.data);
                            },
                            "peer_connected" => {
                                if let Ok(peer) = serde_json::from_value::<Peer>(event.data) {
                                    let mut peers_map = peers.write().await;
                                    peers_map.insert(peer.id.clone(), peer);
                                }
                            },
                            "peer_disconnected" => {
                                if let Ok(peer_id) = serde_json::from_value::<String>(event.data) {
                                    let mut peers_map = peers.write().await;
                                    peers_map.remove(&peer_id);
                                }
                            },
                            _ => {
                                log::debug!("Unknown event type: {}", event.event_type);
                            }
                        }
                    }
                },
                Ok(Message::Binary(_)) => {
                    // Handle binary messages if needed
                },
                Ok(Message::Close(_)) => {
                    log::info!("WebSocket connection closed");
                    break;
                },
                Err(e) => {
                    return Err(SDKError::Network(format!("WebSocket error: {}", e)));
                },
                _ => {}
            }
        }
        
        Ok(())
    }

    /// Subscribe to transaction events
    pub async fn subscribe_to_transactions(&self, address: &str) -> SDKResult<()> {
        let subscription = WebSocketSubscription {
            id: Uuid::new_v4().to_string(),
            event_type: "transactions".to_string(),
            filter: serde_json::json!({"address": address}),
        };
        
        self.send_websocket_message(&subscription).await
    }

    /// Subscribe to block events
    pub async fn subscribe_to_blocks(&self) -> SDKResult<()> {
        let subscription = WebSocketSubscription {
            id: Uuid::new_v4().to_string(),
            event_type: "blocks".to_string(),
            filter: serde_json::json!({}),
        };
        
        self.send_websocket_message(&subscription).await
    }

    /// Send WebSocket message
    async fn send_websocket_message<T: Serialize>(&self, message: &T) -> SDKResult<()> {
        if let Some(ref ws_client) = self.ws_client {
            let mut ws = ws_client.write().await;
            let json = serde_json::to_string(message)
                .map_err(|e| SDKError::Serialization(e.to_string()))?;
            
            ws.send(Message::Text(json)).await
                .map_err(|e| SDKError::Network(e.to_string()))?;
        } else {
            return Err(SDKError::Network("WebSocket not connected".to_string()));
        }
        
        Ok(())
    }

    /// Get current node URL
    fn get_node_url(&self, path: &str) -> String {
        let base_url = &self.config.node_urls[self.node_index];
        format!("{}{}", base_url, path)
    }

    /// Get WebSocket URL
    fn get_ws_url(&self) -> String {
        let base_url = &self.config.ws_urls[self.node_index];
        base_url.clone()
    }

    /// Switch to next node
    async fn switch_node(&mut self) {
        self.node_index = (self.node_index + 1) % self.config.node_urls.len();
        log::info!("Switched to node: {}", self.config.node_urls[self.node_index]);
    }

    /// Make HTTP GET request
    async fn get(&self, url: &str) -> SDKResult<Response> {
        retry(
            self.config.max_retries,
            Duration::from_millis(self.config.retry_delay_ms),
            || async {
                let response = self.http_client.get(url).send().await?;
                if response.status().is_server_error() {
                    return Err(SDKError::Network(format!("Server error: {}", response.status())));
                }
                Ok(response)
            }
        ).await
    }

    /// Make HTTP POST request
    async fn post(&self, url: &str, data: &serde_json::Value) -> SDKResult<Response> {
        retry(
            self.config.max_retries,
            Duration::from_millis(self.config.retry_delay_ms),
            || async {
                let response = self.http_client.post(url).json(data).send().await?;
                if response.status().is_server_error() {
                    return Err(SDKError::Network(format!("Server error: {}", response.status())));
                }
                Ok(response)
            }
        ).await
    }

    /// Discover peers
    pub async fn discover_peers(&self) -> SDKResult<Vec<Peer>> {
        let url = self.get_node_url("/api/network/discover");
        
        let response = self.get(&url).await?;
        let discover_response: DiscoverPeersResponse = response.json().await
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        Ok(discover_response.peers)
    }

    /// Get transaction by hash
    pub async fn get_transaction(&self, hash: &str) -> SDKResult<Option<Transaction>> {
        let url = self.get_node_url(&format!("/api/transactions/{}", hash));
        
        let response = self.get(&url).await?;
        
        if response.status() == StatusCode::NOT_FOUND {
            return Ok(None);
        }
        
        let transaction: Transaction = response.json().await
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        Ok(Some(transaction))
    }

    /// Get block by height
    pub async fn get_block(&self, height: u64) -> SDKResult<Option<Block>> {
        let url = self.get_node_url(&format!("/api/blocks/{}", height));
        
        let response = self.get(&url).await?;
        
        if response.status() == StatusCode::NOT_FOUND {
            return Ok(None);
        }
        
        let block: Block = response.json().await
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        Ok(Some(block))
    }

    /// Get latest block
    pub async fn get_latest_block(&self) -> SDKResult<Block> {
        let url = self.get_node_url("/api/blocks/latest");
        
        let response = self.get(&url).await?;
        let block: Block = response.json().await
            .map_err(|e| SDKError::Serialization(e.to_string()))?;
        
        Ok(block)
    }
}

// Response types
#[derive(Debug, Serialize, Deserialize)]
struct BalanceResponse {
    balance: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct TransactionResponse {
    hash: TransactionHash,
}

#[derive(Debug, Serialize, Deserialize)]
struct TransactionStatusResponse {
    status: TransactionStatus,
}

#[derive(Debug, Serialize, Deserialize)]
struct BlockchainStatusResponse {
    total_transactions: u64,
    network_peers: u32,
    consensus_height: u64,
    quantum_resistance_score: f64,
    last_block_time: u64,
    network_hashrate: f64,
    difficulty: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct NetworkInfoResponse {
    network_id: String,
    version: String,
    protocol_version: String,
    total_nodes: u32,
    active_nodes: u32,
    total_supply: u64,
    circulating_supply: u64,
    block_time: u64,
    current_height: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct HealthResponse {
    status: String,
    uptime: u64,
    last_block_height: u64,
    connected_peers: u32,
    memory_usage: u64,
    cpu_usage: f64,
    disk_usage: f64,
    network_latency: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct PeersResponse {
    peers: Vec<Peer>,
}

#[derive(Debug, Serialize, Deserialize)]
struct DiscoverPeersResponse {
    peers: Vec<Peer>,
}

// WebSocket types
#[derive(Debug, Serialize, Deserialize)]
struct WebSocketEvent {
    event_type: String,
    data: serde_json::Value,
    timestamp: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct WebSocketSubscription {
    id: String,
    event_type: String,
    filter: serde_json::Value,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::CryptoService;
    use crate::NetworkConfig;

    #[tokio::test]
    async fn test_client_creation() {
        let config = NetworkConfig::default();
        let crypto = Arc::new(CryptoService::new(&crate::SecurityConfig::default()).unwrap());
        let client = MobileClient::new(&config, crypto);
        assert!(client.is_ok());
    }

    #[test]
    fn test_node_url_generation() {
        let config = NetworkConfig {
            node_urls: vec!["https://api.example.com".to_string()],
            ..Default::default()
        };
        let crypto = Arc::new(CryptoService::new(&crate::SecurityConfig::default()).unwrap());
        let client = MobileClient::new(&config, crypto).unwrap();
        
        assert_eq!(client.get_node_url("/api/test"), "https://api.example.com/api/test");
    }

    #[test]
    fn test_switch_node() {
        let config = NetworkConfig {
            node_urls: vec![
                "https://node1.example.com".to_string(),
                "https://node2.example.com".to_string(),
            ],
            ..Default::default()
        };
        let crypto = Arc::new(CryptoService::new(&crate::SecurityConfig::default()).unwrap());
        let mut client = MobileClient::new(&config, crypto).unwrap();
        
        assert_eq!(client.node_index, 0);
        // Note: switch_node is async, but we can't test it easily without a runtime
    }
}