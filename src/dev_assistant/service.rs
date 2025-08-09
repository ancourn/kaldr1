use axum::extract::ws::{WebSocket, Message};
use tokio::sync::mpsc;
use futures::{SinkExt, StreamExt};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::dev_assistant::types::StreamMessage;
use anyhow::Result;
use tracing::{info, warn, error};

/// WebSocket connection manager
pub struct ConnectionManager {
    connections: Arc<RwLock<HashMap<String, WebSocketConnection>>>,
    subscriptions: Arc<RwLock<HashMap<String, Vec<String>>>>, // channel -> connection_ids
}

impl ConnectionManager {
    pub fn new() -> Self {
        Self {
            connections: Arc::new(RwLock::new(HashMap::new())),
            subscriptions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn add_connection(&self, connection_id: String, socket: WebSocket) {
        let mut connections = self.connections.write().await;
        connections.insert(connection_id.clone(), WebSocketConnection::new(connection_id.clone(), socket));
        info!("Added WebSocket connection: {}", connection_id);
    }

    pub async fn remove_connection(&self, connection_id: &str) {
        let mut connections = self.connections.write().await;
        connections.remove(connection_id);
        
        // Remove from subscriptions
        let mut subscriptions = self.subscriptions.write().await;
        for (_, connection_ids) in subscriptions.iter_mut() {
            connection_ids.retain(|id| id != connection_id);
        }
        
        info!("Removed WebSocket connection: {}", connection_id);
    }

    pub async fn subscribe(&self, connection_id: &str, channels: Vec<String>) {
        let mut subscriptions = self.subscriptions.write().await;
        
        for channel in channels {
            subscriptions.entry(channel.clone())
                .or_insert_with(Vec::new)
                .push(connection_id.to_string());
        }
        
        info!("Connection {} subscribed to channels: {:?}", connection_id, channels);
    }

    pub async fn unsubscribe(&self, connection_id: &str, channels: Vec<String>) {
        let mut subscriptions = self.subscriptions.write().await;
        
        for channel in channels {
            if let Some(connection_ids) = subscriptions.get_mut(&channel) {
                connection_ids.retain(|id| id != connection_id);
            }
        }
        
        info!("Connection {} unsubscribed from channels: {:?}", connection_id, channels);
    }

    pub async fn broadcast_to_channel(&self, channel: &str, message: &StreamMessage) -> Result<()> {
        let subscriptions = self.subscriptions.read().await;
        let connections = self.connections.read().await;
        
        if let Some(connection_ids) = subscriptions.get(channel) {
            let message_json = message.to_json()?;
            
            for connection_id in connection_ids {
                if let Some(connection) = connections.get(connection_id) {
                    if let Err(e) = connection.send_message(&message_json).await {
                        warn!("Failed to send message to connection {}: {}", connection_id, e);
                    }
                }
            }
        }
        
        Ok(())
    }

    pub async fn get_connection_count(&self) -> usize {
        let connections = self.connections.read().await;
        connections.len()
    }

    pub async fn get_subscription_count(&self) -> usize {
        let subscriptions = self.subscriptions.read().await;
        subscriptions.values().map(|ids| ids.len()).sum()
    }
}

/// Individual WebSocket connection
pub struct WebSocketConnection {
    id: String,
    socket: WebSocket,
    last_activity: Arc<RwLock<std::time::Instant>>,
}

impl WebSocketConnection {
    pub fn new(id: String, socket: WebSocket) -> Self {
        Self {
            id,
            socket,
            last_activity: Arc::new(RwLock::new(std::time::Instant::now())),
        }
    }

    pub async fn send_message(&self, message: &str) -> Result<()> {
        self.socket.send(Message::Text(message.to_string())).await?;
        self.update_activity().await;
        Ok(())
    }

    pub async fn send_json(&self, json: &serde_json::Value) -> Result<()> {
        let message = serde_json::to_string(json)?;
        self.send_message(&message).await
    }

    pub async fn send_ping(&self) -> Result<()> {
        self.socket.send(Message::Ping(vec![])).await?;
        self.update_activity().await;
        Ok(())
    }

    pub async fn close(&self) -> Result<()> {
        self.socket.close().await?;
        Ok(())
    }

    async fn update_activity(&self) {
        let mut activity = self.last_activity.write().await;
        *activity = std::time::Instant::now();
    }

    pub async fn get_last_activity(&self) -> std::time::Instant {
        self.last_activity.read().await.clone()
    }
}

/// Global connection manager instance
static CONNECTION_MANAGER: std::sync::OnceLock<ConnectionManager> = std::sync::OnceLock::new();

pub fn get_connection_manager() -> &'static ConnectionManager {
    CONNECTION_MANAGER.get_or_init(ConnectionManager::new)
}

/// Main WebSocket stream handler
pub async fn stream_handler(mut socket: WebSocket) {
    let connection_id = uuid::Uuid::new_v4().to_string();
    let manager = get_connection_manager();
    
    // Add connection to manager
    manager.add_connection(connection_id.clone(), socket).await;
    
    // Start heartbeat task
    let connection_id_clone = connection_id.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
        loop {
            interval.tick().await;
            let manager = get_connection_manager();
            let connections = manager.connections.read().await;
            
            if let Some(connection) = connections.get(&connection_id_clone) {
                if let Err(e) = connection.send_ping().await {
                    warn!("Heartbeat failed for connection {}: {}", connection_id_clone, e);
                    break;
                }
            } else {
                break;
            }
        }
    });
    
    // Start connection cleanup task
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60));
        loop {
            interval.tick().await;
            let manager = get_connection_manager();
            cleanup_inactive_connections(manager).await;
        }
    });
    
    // Handle incoming messages
    let mut message_count = 0;
    while let Some(msg_result) = socket.recv().await {
        match msg_result {
            Ok(Message::Text(txt)) => {
                message_count += 1;
                
                match handle_stream_message(&connection_id, &txt).await {
                    Ok(response) => {
                        if let Some(response_msg) = response {
                            let manager = get_connection_manager();
                            let connections = manager.connections.read().await;
                            
                            if let Some(connection) = connections.get(&connection_id) {
                                if let Err(e) = connection.send_message(&response_msg).await {
                                    warn!("Failed to send response to connection {}: {}", connection_id, e);
                                    break;
                                }
                            }
                        }
                    }
                    Err(e) => {
                        warn!("Error handling message from connection {}: {}", connection_id, e);
                        
                        // Send error response
                        let error_msg = StreamMessage::Error {
                            error: format!("Failed to process message: {}", e),
                        };
                        
                        if let Ok(error_json) = error_msg.to_json() {
                            let manager = get_connection_manager();
                            let connections = manager.connections.read().await;
                            
                            if let Some(connection) = connections.get(&connection_id) {
                                if let Err(e) = connection.send_message(&error_json).await {
                                    warn!("Failed to send error to connection {}: {}", connection_id, e);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            Ok(Message::Binary(data)) => {
                warn!("Binary message received from connection {}, not supported", connection_id);
                
                let error_msg = StreamMessage::Error {
                    error: "Binary messages are not supported".to_string(),
                };
                
                if let Ok(error_json) = error_msg.to_json() {
                    let manager = get_connection_manager();
                    let connections = manager.connections.read().await;
                    
                    if let Some(connection) = connections.get(&connection_id) {
                        if let Err(e) = connection.send_message(&error_json).await {
                            warn!("Failed to send binary error to connection {}: {}", connection_id, e);
                            break;
                        }
                    }
                }
            }
            Ok(Message::Ping(data)) => {
                // Respond to ping with pong
                let manager = get_connection_manager();
                let connections = manager.connections.read().await;
                
                if let Some(connection) = connections.get(&connection_id) {
                    if let Err(e) = connection.socket.send(Message::Pong(data)).await {
                        warn!("Failed to send pong to connection {}: {}", connection_id, e);
                        break;
                    }
                }
            }
            Ok(Message::Pong(_)) => {
                // Pong response, update activity
                let manager = get_connection_manager();
                let connections = manager.connections.read().await;
                
                if let Some(connection) = connections.get(&connection_id) {
                    connection.update_activity().await;
                }
            }
            Ok(Message::Close(_)) => {
                info!("Connection {} closed by client", connection_id);
                break;
            }
            Err(e) => {
                warn!("WebSocket error for connection {}: {}", connection_id, e);
                break;
            }
        }
    }
    
    // Clean up connection
    let manager = get_connection_manager();
    manager.remove_connection(&connection_id).await;
    
    info!("WebSocket connection {} closed after processing {} messages", connection_id, message_count);
}

/// Handle incoming stream messages
async fn handle_stream_message(connection_id: &str, message: &str) -> Result<Option<String>> {
    let stream_message: StreamMessage = StreamMessage::from_json(message)?;
    
    match stream_message {
        StreamMessage::Ping => {
            Ok(Some(StreamMessage::Pong.to_json()?))
        }
        StreamMessage::Pong => {
            // Pong is handled at the socket level
            Ok(None)
        }
        StreamMessage::Subscribe { channels } => {
            let manager = get_connection_manager();
            manager.subscribe(connection_id, channels).await;
            Ok(None)
        }
        StreamMessage::Unsubscribe { channels } => {
            let manager = get_connection_manager();
            manager.unsubscribe(connection_id, channels).await;
            Ok(None)
        }
        StreamMessage::Prediction { prediction } => {
            // Handle prediction message (forward to prediction system)
            info!("Received prediction message from connection {}: {:?}", connection_id, prediction);
            Ok(None)
        }
        StreamMessage::Anomaly { anomaly } => {
            // Handle anomaly message (forward to anomaly system)
            info!("Received anomaly message from connection {}: {:?}", connection_id, anomaly);
            Ok(None)
        }
        StreamMessage::Heartbeat { timestamp } => {
            // Respond to heartbeat
            let response = StreamMessage::Heartbeat { 
                timestamp: crate::utils::now_secs(),
            };
            Ok(Some(response.to_json()?))
        }
        _ => {
            warn!("Unhandled message type from connection {}", connection_id);
            Ok(None)
        }
    }
}

/// Clean up inactive connections
async fn cleanup_inactive_connections(manager: &ConnectionManager) {
    let timeout = std::time::Duration::from_secs(300); // 5 minutes
    let now = std::time::Instant::now();
    
    let mut inactive_connections = Vec::new();
    
    {
        let connections = manager.connections.read().await;
        for (id, connection) in connections.iter() {
            let last_activity = connection.get_last_activity().await;
            if now.duration_since(last_activity) > timeout {
                inactive_connections.push(id.clone());
            }
        }
    }
    
    for connection_id in inactive_connections {
        info!("Cleaning up inactive connection: {}", connection_id);
        manager.remove_connection(&connection_id).await;
    }
}

/// Broadcast utility functions
pub mod broadcast {
    use super::*;

    /// Broadcast a prediction update to all subscribers
    pub async fn prediction_update(prediction: serde_json::Value) -> Result<()> {
        let manager = get_connection_manager();
        let message = StreamMessage::Prediction { prediction };
        manager.broadcast_to_channel("predictions", &message).await
    }

    /// Broadcast an anomaly alert to all subscribers
    pub async fn anomaly_alert(anomaly: serde_json::Value) -> Result<()> {
        let manager = get_connection_manager();
        let message = StreamMessage::Anomaly { anomaly };
        manager.broadcast_to_channel("anomalies", &message).await
    }

    /// Broadcast an analysis progress update
    pub async fn analysis_progress(analysis_id: String, progress: f32) -> Result<()> {
        let manager = get_connection_manager();
        let message = StreamMessage::AnalysisUpdate { analysis_id, progress };
        manager.broadcast_to_channel("analysis", &message).await
    }

    /// Broadcast analysis completion
    pub async fn analysis_complete(analysis_id: String, results: serde_json::Value) -> Result<()> {
        let manager = get_connection_manager();
        let message = StreamMessage::AnalysisComplete { analysis_id, results };
        manager.broadcast_to_channel("analysis", &message).await
    }

    /// Broadcast system heartbeat
    pub async fn heartbeat() -> Result<()> {
        let manager = get_connection_manager();
        let message = StreamMessage::Heartbeat { 
            timestamp: crate::utils::now_secs(),
        };
        manager.broadcast_to_channel("system", &message).await
    }
}

/// Connection statistics
pub async fn get_connection_stats() -> serde_json::Value {
    let manager = get_connection_manager();
    
    serde_json::json!({
        "active_connections": manager.get_connection_count().await,
        "total_subscriptions": manager.get_subscription_count().await,
        "timestamp": crate::utils::now_secs(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::time::{sleep, Duration};

    #[tokio::test]
    async fn test_connection_manager() {
        let manager = ConnectionManager::new();
        
        assert_eq!(manager.get_connection_count().await, 0);
        assert_eq!(manager.get_subscription_count().await, 0);
        
        // Test adding/removing connections
        let (socket_tx, _) = mpsc::channel(1);
        let mock_socket = WebSocket::new(socket_tx);
        
        manager.add_connection("test_conn".to_string(), mock_socket).await;
        assert_eq!(manager.get_connection_count().await, 1);
        
        manager.remove_connection("test_conn").await;
        assert_eq!(manager.get_connection_count().await, 0);
    }

    #[tokio::test]
    async fn test_subscriptions() {
        let manager = ConnectionManager::new();
        
        // Test subscriptions
        manager.subscribe("conn1", vec!["channel1".to_string(), "channel2".to_string()]).await;
        manager.subscribe("conn2", vec!["channel1".to_string()]).await;
        
        assert_eq!(manager.get_subscription_count().await, 3);
        
        manager.unsubscribe("conn1", vec!["channel1".to_string()]).await;
        assert_eq!(manager.get_subscription_count().await, 1);
    }

    #[tokio::test]
    async fn test_stream_message_serialization() {
        let ping_msg = StreamMessage::Ping;
        let ping_json = ping_msg.to_json().unwrap();
        let decoded: StreamMessage = StreamMessage::from_json(&ping_json).unwrap();
        
        match decoded {
            StreamMessage::Ping => (),
            _ => panic!("Expected Ping message"),
        }
        
        let subscribe_msg = StreamMessage::Subscribe {
            channels: vec!["test".to_string()],
        };
        let subscribe_json = subscribe_msg.to_json().unwrap();
        let decoded: StreamMessage = StreamMessage::from_json(&subscribe_json).unwrap();
        
        match decoded {
            StreamMessage::Subscribe { channels } => {
                assert_eq!(channels, vec!["test".to_string()]);
            }
            _ => panic!("Expected Subscribe message"),
        }
    }
}