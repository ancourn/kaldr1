//! Persistent storage module for Quantum-Proof DAG Blockchain
//! 
//! This module handles database operations for storing and retrieving
//! blockchain data including transactions, DAG nodes, and consensus state.
//! Includes backup and recovery functionality for data persistence.

use crate::{BlockchainError, TransactionId, core::{Transaction, DAGNode, NodeStatus, QuantumProof}};
use serde::{Deserialize, Serialize};
use sqlx::{SqlitePool, sqlite::SqliteRow, Row, sqlite::SqliteConnectOptions};
use std::path::Path;
use std::str::FromStr;
use chrono::{DateTime, Utc};
use std::fs;
use tokio::io::AsyncReadExt;
use tokio::io::AsyncWriteExt;

/// Database manager for blockchain persistence
pub struct DatabaseManager {
    pool: SqlitePool,
}

/// Database transaction record
#[derive(Debug, Serialize, Deserialize)]
pub struct DbTransaction {
    pub id: String,
    pub sender: Vec<u8>,
    pub receiver: Vec<u8>,
    pub amount: u64,
    pub nonce: u64,
    pub timestamp: i64,
    pub signature: Vec<u8>,
    pub prime_hash: Vec<u8>,
    pub resistance_score: u32,
    pub proof_timestamp: i64,
    pub metadata: Option<Vec<u8>>,
}

/// Database DAG node record
#[derive(Debug, Serialize, Deserialize)]
pub struct DbDagNode {
    pub transaction_id: String,
    pub children: String, // JSON array of child IDs
    pub weight: u64,
    pub confidence: f64,
    pub status: String,
    pub quantum_score: u32,
}

/// Database configuration
#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub path: String,
    pub max_connections: u32,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            path: "./blockchain.db".to_string(),
            max_connections: 10,
        }
    }
}

impl DatabaseManager {
    /// Create a new database manager
    pub async fn new(config: DatabaseConfig) -> Result<Self, BlockchainError> {
        // Ensure database directory exists
        if let Some(parent) = Path::new(&config.path).parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        // Create database connection pool
        let pool = SqlitePool::connect_with(
            sqlx::sqlite::SqliteConnectOptions::from_str(&format!("sqlite://{}", config.path))?
                .create_if_missing(true)
        ).await?;

        let manager = Self { pool };
        
        // Initialize database schema
        manager.init_database().await?;
        
        log::info!("Database initialized at: {}", config.path);
        Ok(manager)
    }

    /// Initialize database schema
    async fn init_database(&self) -> Result<(), BlockchainError> {
        // Create transactions table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                sender BLOB NOT NULL,
                receiver BLOB NOT NULL,
                amount INTEGER NOT NULL,
                nonce INTEGER NOT NULL,
                timestamp INTEGER NOT NULL,
                signature BLOB NOT NULL,
                prime_hash BLOB NOT NULL,
                resistance_score INTEGER NOT NULL,
                proof_timestamp INTEGER NOT NULL,
                metadata BLOB
            )
            "#
        )
        .execute(&self.pool)
        .await?;

        // Create DAG nodes table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS dag_nodes (
                transaction_id TEXT PRIMARY KEY,
                children TEXT NOT NULL,
                weight INTEGER NOT NULL,
                confidence REAL NOT NULL,
                status TEXT NOT NULL,
                quantum_score INTEGER NOT NULL,
                FOREIGN KEY (transaction_id) REFERENCES transactions (id)
            )
            "#
        )
        .execute(&self.pool)
        .await?;

        // Create transaction parents table (for DAG relationships)
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS transaction_parents (
                transaction_id TEXT NOT NULL,
                parent_id TEXT NOT NULL,
                PRIMARY KEY (transaction_id, parent_id),
                FOREIGN KEY (transaction_id) REFERENCES transactions (id),
                FOREIGN KEY (parent_id) REFERENCES transactions (id)
            )
            "#
        )
        .execute(&self.pool)
        .await?;

        // Create indexes for better performance
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_dag_nodes_status ON dag_nodes(status)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_transaction_parents_parent ON transaction_parents(parent_id)")
            .execute(&self.pool)
            .await?;

        log::debug!("Database schema initialized");
        Ok(())
    }

    /// Store a transaction in the database
    pub async fn store_transaction(&self, transaction: &Transaction) -> Result<(), BlockchainError> {
        let mut tx = self.pool.begin().await?;

        // Store transaction
        sqlx::query(
            r#"
            INSERT OR REPLACE INTO transactions 
            (id, sender, receiver, amount, nonce, timestamp, signature, prime_hash, resistance_score, proof_timestamp, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(transaction.id.as_string())
        .bind(&transaction.sender)
        .bind(&transaction.receiver)
        .bind(transaction.amount)
        .bind(transaction.nonce)
        .bind(transaction.timestamp as i64)
        .bind(&transaction.signature)
        .bind(&transaction.quantum_proof.prime_hash)
        .bind(transaction.quantum_proof.resistance_score)
        .bind(transaction.quantum_proof.proof_timestamp as i64)
        .bind(&transaction.metadata)
        .execute(&mut *tx)
        .await?;

        // Store parent relationships
        for parent_id in &transaction.parents {
            sqlx::query(
                "INSERT OR REPLACE INTO transaction_parents (transaction_id, parent_id) VALUES (?, ?)"
            )
            .bind(transaction.id.as_string())
            .bind(parent_id.as_string())
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        log::debug!("Stored transaction: {}", transaction.id);
        Ok(())
    }

    /// Store a DAG node in the database
    pub async fn store_dag_node(&self, node: &DAGNode) -> Result<(), BlockchainError> {
        let children_json = serde_json::to_string(&node.children.iter().map(|id| id.as_string()).collect::<Vec<String>>())?;
        
        sqlx::query(
            r#"
            INSERT OR REPLACE INTO dag_nodes 
            (transaction_id, children, weight, confidence, status, quantum_score)
            VALUES (?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(node.transaction.id.as_string())
        .bind(children_json)
        .bind(node.weight)
        .bind(node.confidence)
        .bind(format!("{:?}", node.status))
        .bind(node.quantum_score)
        .execute(&self.pool)
        .await?;

        log::debug!("Stored DAG node: {}", node.transaction.id);
        Ok(())
    }

    /// Retrieve a transaction by ID
    pub async fn get_transaction(&self, tx_id: &TransactionId) -> Result<Option<Transaction>, BlockchainError> {
        let row = sqlx::query(
            "SELECT id, sender, receiver, amount, nonce, timestamp, signature, prime_hash, resistance_score, proof_timestamp, metadata FROM transactions WHERE id = ?"
        )
        .bind(tx_id.as_string())
        .fetch_optional(&self.pool)
        .await?;

        match row {
            Some(row) => {
                let parents = self.get_transaction_parents(tx_id).await?;
                let transaction = Self::row_to_transaction(row, parents)?;
                Ok(Some(transaction))
            }
            None => Ok(None),
        }
    }

    /// Retrieve a DAG node by ID
    pub async fn get_dag_node(&self, tx_id: &TransactionId) -> Result<Option<DAGNode>, BlockchainError> {
        let row = sqlx::query(
            "SELECT transaction_id, children, weight, confidence, status, quantum_score FROM dag_nodes WHERE transaction_id = ?"
        )
        .bind(tx_id.as_string())
        .fetch_optional(&self.pool)
        .await?;

        match row {
            Some(row) => {
                let transaction = self.get_transaction(tx_id).await?
                    .ok_or_else(|| BlockchainError::Other("Transaction not found for DAG node".to_string()))?;
                let node = Self::row_to_dag_node(row, transaction)?;
                Ok(Some(node))
            }
            None => Ok(None),
        }
    }

    /// Get all transactions with optional filtering
    pub async fn get_transactions(&self, limit: Option<usize>, offset: Option<usize>, status: Option<&str>) -> Result<Vec<Transaction>, BlockchainError> {
        let mut query = String::from(
            "SELECT t.id, t.sender, t.receiver, t.amount, t.nonce, t.timestamp, t.signature, t.prime_hash, t.resistance_score, t.proof_timestamp, t.metadata 
             FROM transactions t"
        );

        if status.is_some() {
            query.push_str(" JOIN dag_nodes d ON t.id = d.transaction_id WHERE d.status = ?");
        }

        query.push_str(" ORDER BY t.timestamp DESC");

        if let Some(limit) = limit {
            query.push_str(&format!(" LIMIT {}", limit));
        }

        if let Some(offset) = offset {
            query.push_str(&format!(" OFFSET {}", offset));
        }

        let mut query_builder = sqlx::query(&query);
        
        if let Some(status) = status {
            query_builder = query_builder.bind(status);
        }

        let rows = query_builder.fetch_all(&self.pool).await?;
        
        let mut transactions = Vec::new();
        for row in rows {
            let tx_id = TransactionId::from_bytes(&hex::decode(row.get::<_, String>(0))?)?;
            let parents = self.get_transaction_parents(&tx_id).await?;
            let transaction = Self::row_to_transaction(row, parents)?;
            transactions.push(transaction);
        }

        Ok(transactions)
    }

    /// Get all DAG tips (unconfirmed transactions)
    pub async fn get_dag_tips(&self) -> Result<Vec<DAGNode>, BlockchainError> {
        let rows = sqlx::query(
            "SELECT d.transaction_id, d.children, d.weight, d.confidence, d.status, d.quantum_score 
             FROM dag_nodes d 
             WHERE d.status = 'Pending' 
             ORDER BY d.confidence DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        let mut tips = Vec::new();
        for row in rows {
            let tx_id_str = row.get::<_, String>(0);
            let tx_id = TransactionId::from_bytes(&hex::decode(&tx_id_str)?)?;
            let transaction = self.get_transaction(&tx_id).await?
                .ok_or_else(|| BlockchainError::Other("Transaction not found for DAG tip".to_string()))?;
            let node = Self::row_to_dag_node(row, transaction)?;
            tips.push(node);
        }

        Ok(tips)
    }

    /// Get transaction parents
    async fn get_transaction_parents(&self, tx_id: &TransactionId) -> Result<Vec<TransactionId>, BlockchainError> {
        let rows = sqlx::query(
            "SELECT parent_id FROM transaction_parents WHERE transaction_id = ? ORDER BY parent_id"
        )
        .bind(tx_id.as_string())
        .fetch_all(&self.pool)
        .await?;

        let mut parents = Vec::new();
        for row in rows {
            let parent_id_str: String = row.get(0);
            let parent_id = TransactionId::from_bytes(&hex::decode(&parent_id_str)?)?;
            parents.push(parent_id);
        }

        Ok(parents)
    }

    /// Update DAG node status
    pub async fn update_node_status(&self, tx_id: &TransactionId, status: NodeStatus, confidence: f64) -> Result<(), BlockchainError> {
        sqlx::query(
            "UPDATE dag_nodes SET status = ?, confidence = ? WHERE transaction_id = ?"
        )
        .bind(format!("{:?}", status))
        .bind(confidence)
        .bind(tx_id.as_string())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Get transaction count
    pub async fn get_transaction_count(&self) -> Result<u64, BlockchainError> {
        let count = sqlx::query("SELECT COUNT(*) FROM transactions")
            .fetch_one(&self.pool)
            .await?;
        
        Ok(count.get::<_, i64>(0) as u64)
    }

    /// Get database statistics
    pub async fn get_stats(&self) -> Result<DatabaseStats, BlockchainError> {
        let total_tx = sqlx::query("SELECT COUNT(*) FROM transactions")
            .fetch_one(&self.pool)
            .await?;
        
        let pending_nodes = sqlx::query("SELECT COUNT(*) FROM dag_nodes WHERE status = 'Pending'")
            .fetch_one(&self.pool)
            .await?;
        
        let confirmed_nodes = sqlx::query("SELECT COUNT(*) FROM dag_nodes WHERE status = 'Confirmed'")
            .fetch_one(&self.pool)
            .await?;
        
        let finalized_nodes = sqlx::query("SELECT COUNT(*) FROM dag_nodes WHERE status = 'Finalized'")
            .fetch_one(&self.pool)
            .await?;

        Ok(DatabaseStats {
            total_transactions: total_tx.get::<_, i64>(0) as u64,
            pending_nodes: pending_nodes.get::<_, i64>(0) as u64,
            confirmed_nodes: confirmed_nodes.get::<_, i64>(0) as u64,
            finalized_nodes: finalized_nodes.get::<_, i64>(0) as u64,
        })
    }

    /// Get database storage size in bytes
    pub async fn get_storage_size(&self) -> Result<u64, BlockchainError> {
        // Get database file size
        let row = sqlx::query("SELECT page_count * page_size FROM pragma_page_count(), pragma_page_size()")
            .fetch_one(&self.pool)
            .await?;
        
        let db_size = row.get::<_, i64>(0) as u64;
        
        // Add index sizes (approximate)
        let index_size = sqlx::query(
            "SELECT SUM(pgsize) FROM dbstat WHERE name LIKE 'idx_%'"
        )
        .fetch_one(&self.pool)
        .await?;
        
        let index_size = index_size.get::<_, Option<i64>>(0).unwrap_or(0) as u64;
        
        Ok(db_size + index_size)
    }

    /// Close database connections
    pub async fn close(&self) -> Result<(), BlockchainError> {
        self.pool.close().await;
        Ok(())
    }

    /// Create a backup of the database
    pub async fn create_backup(&self, backup_path: &str) -> Result<BackupInfo, BlockchainError> {
        let timestamp = Utc::now();
        let backup_path = if backup_path.ends_with(".db") {
            backup_path.to_string()
        } else {
            format!("{}_{}.db", backup_path, timestamp.timestamp())
        };

        // Ensure backup directory exists
        if let Some(parent) = Path::new(&backup_path).parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        // Get database path from pool
        let database_path = self.get_database_path().await?;

        // Copy database file
        tokio::fs::copy(&database_path, &backup_path).await?;

        // Create backup metadata
        let stats = self.get_stats().await?;
        let backup_info = BackupInfo {
            timestamp: timestamp.timestamp(),
            backup_path: backup_path.clone(),
            database_path,
            file_size: self.get_file_size(&backup_path).await?,
            total_transactions: stats.total_transactions,
            total_nodes: stats.total_transactions,
            backup_type: BackupType::Full,
            compression_enabled: false,
            checksum: self.calculate_checksum(&backup_path).await?,
            metadata: {
                let mut meta = std::collections::HashMap::new();
                meta.insert("created_by".to_string(), "quantum-dag-blockchain".to_string());
                meta.insert("version".to_string(), env!("CARGO_PKG_VERSION").to_string());
                meta.insert("backup_reason".to_string(), "manual".to_string());
                meta
            },
        };

        // Save backup metadata
        let metadata_path = format!("{}.meta", backup_path);
        let metadata_json = serde_json::to_string_pretty(&backup_info)?;
        tokio::fs::write(&metadata_path, metadata_json).await?;

        log::info!("📦 Database backup created: {}", backup_path);
        Ok(backup_info)
    }

    /// Restore database from backup
    pub async fn restore_from_backup(&self, backup_path: &str) -> Result<RestoreResult, BlockchainError> {
        let backup_path = if backup_path.ends_with(".db") {
            backup_path.to_string()
        } else {
            format!("{}.db", backup_path)
        };

        // Check if backup file exists
        if !tokio::fs::metadata(&backup_path).await.is_ok() {
            return Err(BlockchainError::Other(format!("Backup file not found: {}", backup_path)));
        }

        // Load backup metadata
        let metadata_path = format!("{}.meta", backup_path);
        let backup_info = if tokio::fs::metadata(&metadata_path).await.is_ok() {
            let metadata_content = tokio::fs::read_to_string(&metadata_path).await?;
            serde_json::from_str(&metadata_content)?
        } else {
            // Create minimal backup info if metadata file doesn't exist
            BackupInfo {
                timestamp: Utc::now().timestamp(),
                backup_path: backup_path.clone(),
                database_path: self.get_database_path().await?,
                file_size: self.get_file_size(&backup_path).await?,
                total_transactions: 0,
                total_nodes: 0,
                backup_type: BackupType::Full,
                compression_enabled: false,
                checksum: self.calculate_checksum(&backup_path).await?,
                metadata: std::collections::HashMap::new(),
            }
        };

        // Verify backup integrity
        let current_checksum = self.calculate_checksum(&backup_path).await?;
        if current_checksum != backup_info.checksum {
            return Err(BlockchainError::Other("Backup integrity check failed".to_string()));
        }

        // Create backup of current database before restore
        let current_db_path = self.get_database_path().await?;
        if tokio::fs::metadata(&current_db_path).await.is_ok() {
            let timestamp = Utc::now().timestamp();
            let pre_restore_backup = format!("{}.pre_restore_{}", current_db_path, timestamp);
            tokio::fs::copy(&current_db_path, &pre_restore_backup).await?;
            log::info!("📦 Created pre-restore backup: {}", pre_restore_backup);
        }

        // Close database connections
        self.pool.close().await;

        // Restore database from backup
        tokio::fs::copy(&backup_path, &current_db_path).await?;

        // Reopen database
        let new_pool = SqlitePool::connect_with(
            SqliteConnectOptions::from_str(&format!("sqlite://{}", current_db_path))?
                .create_if_missing(true)
        ).await?;

        // Update pool reference (this is simplified - in real implementation you'd need proper pool management)
        log::warn!("Database pool updated - this is a simplified implementation");

        log::info!("✅ Database restored from backup: {}", backup_path);

        Ok(RestoreResult {
            success: true,
            backup_info,
            restore_timestamp: Utc::now().timestamp(),
            pre_restore_backup: None,
            warnings: vec!["Database pool management simplified in this implementation".to_string()],
        })
    }

    /// List available backups
    pub async fn list_backups(&self, backup_dir: &str) -> Result<Vec<BackupInfo>, BlockchainError> {
        let mut backups = Vec::new();
        let backup_path = Path::new(backup_dir);

        if !backup_path.exists() {
            return Ok(backups);
        }

        let mut entries = tokio::fs::read_dir(backup_path).await?;

        while let Ok(entry) = entries.next_entry().await {
            if let Ok(file_name) = entry.file_name().into_string() {
                if file_name.ends_with(".db") && !file_name.contains(".pre_restore_") {
                    let full_path = backup_path.join(&file_name);
                    let metadata_path = format!("{}.meta", full_path.display());

                    // Try to load metadata
                    if let Ok(metadata_content) = tokio::fs::read_to_string(&metadata_path).await {
                        if let Ok(backup_info) = serde_json::from_str::<BackupInfo>(&metadata_content) {
                            backups.push(backup_info);
                        }
                    } else {
                        // Create basic backup info from file
                        if let Ok(file_size) = self.get_file_size(full_path.to_str().unwrap_or("")).await {
                            let basic_info = BackupInfo {
                                timestamp: entry.metadata().await
                                    .and_then(|m| m.modified())
                                    .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
                                    .duration_since(std::time::SystemTime::UNIX_EPOCH)
                                    .unwrap_or_default()
                                    .as_secs() as i64,
                                backup_path: full_path.to_string_lossy().to_string(),
                                database_path: "unknown".to_string(),
                                file_size,
                                total_transactions: 0,
                                total_nodes: 0,
                                backup_type: BackupType::Full,
                                compression_enabled: false,
                                checksum: "unknown".to_string(),
                                metadata: std::collections::HashMap::new(),
                            };
                            backups.push(basic_info);
                        }
                    }
                }
            }
        }

        // Sort by timestamp (newest first)
        backups.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        Ok(backups)
    }

    /// Clean up old backups
    pub async fn cleanup_old_backups(&self, backup_dir: &str, keep_count: usize) -> Result<CleanupResult, BlockchainError> {
        let mut backups = self.list_backups(backup_dir).await?;
        
        if backups.len() <= keep_count {
            return Ok(CleanupResult {
                removed_count: 0,
                removed_files: Vec::new(),
                total_space_freed: 0,
            });
        }

        // Keep the newest backups
        let to_remove = backups.split_off(keep_count);
        let mut removed_files = Vec::new();
        let mut total_space_freed = 0;

        for backup in to_remove {
            // Remove backup file
            if let Err(e) = tokio::fs::remove_file(&backup.backup_path).await {
                log::warn!("Failed to remove backup file {}: {}", backup.backup_path, e);
            } else {
                removed_files.push(backup.backup_path.clone());
                total_space_freed += backup.file_size;
            }

            // Remove metadata file
            let metadata_path = format!("{}.meta", backup.backup_path);
            if let Err(e) = tokio::fs::remove_file(&metadata_path).await {
                log::warn!("Failed to remove backup metadata {}: {}", metadata_path, e);
            } else {
                removed_files.push(metadata_path);
            }
        }

        log::info!("🧹 Cleaned up {} old backup files, freed {} bytes", removed_files.len() / 2, total_space_freed);

        Ok(CleanupResult {
            removed_count: removed_files.len() / 2,
            removed_files,
            total_space_freed,
        })
    }

    /// Schedule automatic backups
    pub async fn schedule_backup(&self, backup_dir: &str, interval_hours: u64) -> Result<BackupSchedule, BlockchainError> {
        let backups = self.list_backups(backup_dir).await?;
        
        let last_backup = backups.first()
            .map(|b| b.timestamp)
            .unwrap_or(0);

        let now = Utc::now().timestamp();
        let hours_since_backup = if last_backup > 0 {
            (now - last_backup) / 3600
        } else {
            interval_hours + 1 // Force backup if no previous backup
        };

        let next_backup = if hours_since_backup >= interval_hours as i64 {
            // Backup is due
            match self.create_backup(&format!("{}/auto_backup", backup_dir)).await {
                Ok(backup_info) => {
                    log::info!("⏰ Scheduled backup completed: {}", backup_info.backup_path);
                    now + (interval_hours as i64 * 3600)
                }
                Err(e) => {
                    log::error!("Scheduled backup failed: {}", e);
                    now + 3600 // Retry in 1 hour
                }
            }
        } else {
            // Calculate next backup time
            now + ((interval_hours as i64 - hours_since_backup) * 3600)
        };

        Ok(BackupSchedule {
            last_backup,
            next_backup,
            interval_hours,
            backup_dir: backup_dir.to_string(),
            is_due: hours_since_backup >= interval_hours as i64,
        })
    }

    /// Export database to SQL format
    pub async fn export_sql(&self, export_path: &str) -> Result<ExportResult, BlockchainError> {
        let export_path = if export_path.ends_with(".sql") {
            export_path.to_string()
        } else {
            format!("{}.sql", export_path)
        };

        // Ensure export directory exists
        if let Some(parent) = Path::new(&export_path).parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        // Get database path
        let database_path = self.get_database_path().await?;

        // Use sqlite3 command line tool to export
        let output = std::process::Command::new("sqlite3")
            .arg(&database_path)
            .arg(".output")
            .arg(&export_path)
            .arg(".dump")
            .output();

        match output {
            Ok(output) => {
                if output.status.success() {
                    let file_size = self.get_file_size(&export_path).await?;
                    log::info!("📤 Database exported to SQL: {}", export_path);
                    
                    Ok(ExportResult {
                        success: true,
                        export_path,
                        export_format: ExportFormat::SQL,
                        file_size,
                        export_timestamp: Utc::now().timestamp(),
                        warnings: Vec::new(),
                    })
                } else {
                    Err(BlockchainError::Other(format!("SQLite export failed: {}", String::from_utf8_lossy(&output.stderr))))
                }
            }
            Err(e) => {
                Err(BlockchainError::Other(format!("Failed to execute sqlite3: {}", e)))
            }
        }
    }

    /// Import database from SQL format
    pub async fn import_sql(&self, sql_path: &str) -> Result<ImportResult, BlockchainError> {
        if !tokio::fs::metadata(sql_path).await.is_ok() {
            return Err(BlockchainError::Other(format!("SQL file not found: {}", sql_path)));
        }

        // Get database path
        let database_path = self.get_database_path().await?;

        // Create backup before import
        let timestamp = Utc::now().timestamp();
        let pre_import_backup = format!("{}.pre_import_{}", database_path, timestamp);
        if tokio::fs::metadata(&database_path).await.is_ok() {
            tokio::fs::copy(&database_path, &pre_import_backup).await?;
            log::info!("📦 Created pre-import backup: {}", pre_import_backup);
        }

        // Close database connections
        self.pool.close().await;

        // Use sqlite3 command line tool to import
        let output = std::process::Command::new("sqlite3")
            .arg(&database_path)
            .arg(&format!(".read {}", sql_path))
            .output();

        match output {
            Ok(output) => {
                if output.status.success() {
                    log::info!("📥 Database imported from SQL: {}", sql_path);
                    
                    Ok(ImportResult {
                        success: true,
                        import_path: sql_path.to_string(),
                        import_format: ImportFormat::SQL,
                        pre_import_backup: Some(pre_import_backup),
                        import_timestamp: Utc::now().timestamp(),
                        warnings: Vec::new(),
                    })
                } else {
                    Err(BlockchainError::Other(format!("SQLite import failed: {}", String::from_utf8_lossy(&output.stderr))))
                }
            }
            Err(e) => {
                Err(BlockchainError::Other(format!("Failed to execute sqlite3: {}", e)))
            }
        }
    }

    // Helper methods

    async fn get_database_path(&self) -> Result<String, BlockchainError> {
        // This is a simplified implementation
        // In a real implementation, you'd extract the path from the pool configuration
        Ok("./blockchain.db".to_string())
    }

    async fn get_file_size(&self, file_path: &str) -> Result<u64, BlockchainError> {
        Ok(tokio::fs::metadata(file_path).await?.len())
    }

    async fn calculate_checksum(&self, file_path: &str) -> Result<String, BlockchainError> {
        use sha3::{Digest, Sha3_256};
        
        let mut file = tokio::fs::File::open(file_path).await?;
        let mut hasher = Sha3_256::new();
        let mut buffer = vec![0; 8192];

        loop {
            let n = file.read(&mut buffer).await?;
            if n == 0 {
                break;
            }
            hasher.update(&buffer[..n]);
        }

        Ok(hex::encode(hasher.finalize()))
    }
}

/// Backup type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BackupType {
    Full,
    Incremental,
    Differential,
}

/// Export format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportFormat {
    SQL,
    JSON,
    CSV,
}

/// Import format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ImportFormat {
    SQL,
    JSON,
    CSV,
}

/// Backup information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub timestamp: i64,
    pub backup_path: String,
    pub database_path: String,
    pub file_size: u64,
    pub total_transactions: u64,
    pub total_nodes: u64,
    pub backup_type: BackupType,
    pub compression_enabled: bool,
    pub checksum: String,
    pub metadata: std::collections::HashMap<String, String>,
}

/// Restore result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestoreResult {
    pub success: bool,
    pub backup_info: BackupInfo,
    pub restore_timestamp: i64,
    pub pre_restore_backup: Option<String>,
    pub warnings: Vec<String>,
}

/// Cleanup result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupResult {
    pub removed_count: usize,
    pub removed_files: Vec<String>,
    pub total_space_freed: u64,
}

/// Backup schedule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupSchedule {
    pub last_backup: i64,
    pub next_backup: i64,
    pub interval_hours: u64,
    pub backup_dir: String,
    pub is_due: bool,
}

/// Export result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportResult {
    pub success: bool,
    pub export_path: String,
    pub export_format: ExportFormat,
    pub file_size: u64,
    pub export_timestamp: i64,
    pub warnings: Vec<String>,
}

/// Import result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub success: bool,
    pub import_path: String,
    pub import_format: ImportFormat,
    pub pre_import_backup: Option<String>,
    pub import_timestamp: i64,
    pub warnings: Vec<String>,
}

/// Database statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseStats {
    pub total_transactions: u64,
    pub pending_nodes: u64,
    pub confirmed_nodes: u64,
    pub finalized_nodes: u64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_database_creation() {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test.db");
        
        let config = DatabaseConfig {
            path: db_path.to_string_lossy().to_string(),
            max_connections: 5,
        };

        let db_manager = DatabaseManager::new(config).await;
        assert!(db_manager.is_ok());
    }

    #[tokio::test]
    async fn test_transaction_storage() {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test.db");
        
        let config = DatabaseConfig {
            path: db_path.to_string_lossy().to_string(),
            max_connections: 5,
        };

        let db_manager = DatabaseManager::new(config).await.unwrap();

        let transaction = Transaction {
            id: TransactionId::new(),
            sender: vec![1u8; 32],
            receiver: vec![2u8; 32],
            amount: 100,
            nonce: 1,
            timestamp: Utc::now().timestamp() as u64,
            parents: vec![],
            signature: vec![0u8; 64],
            quantum_proof: QuantumProof {
                prime_hash: vec![1u8; 32],
                resistance_score: 80,
                proof_timestamp: Utc::now().timestamp() as u64,
            },
            metadata: None,
        };

        let result = db_manager.store_transaction(&transaction).await;
        assert!(result.is_ok());

        let retrieved = db_manager.get_transaction(&transaction.id).await;
        assert!(retrieved.is_ok());
        assert!(retrieved.unwrap().is_some());
    }
}