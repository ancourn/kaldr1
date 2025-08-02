use prometheus::{
    Counter, Gauge, Histogram, HistogramOpts, HistogramVec, Opts, Registry, TextEncoder, Encoder,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::{Blockchain, Transaction, DAGNode, core::DAGCore};
use std::time::{Duration, Instant};

/// Blockchain metrics collector
#[derive(Clone)]
pub struct BlockchainMetrics {
    registry: Registry,
    
    // Transaction metrics
    transactions_total: Counter,
    transactions_pending: Gauge,
    transactions_confirmed: Gauge,
    transaction_latency: Histogram,
    
    // DAG metrics
    dag_nodes_total: Gauge,
    dag_depth: Gauge,
    dag_width: Gauge,
    dag_forks_detected: Counter,
    
    // Consensus metrics
    consensus_rounds_total: Counter,
    consensus_success_rate: Gauge,
    validator_score: GaugeVec,
    finality_time: Histogram,
    
    // Node metrics
    node_uptime: Gauge,
    memory_usage: Gauge,
    cpu_usage: Gauge,
    network_connections: Gauge,
    
    // Identity metrics
    identity_rotations: Counter,
    signature_verifications: Counter,
    signature_failures: Counter,
    
    // Storage metrics
    storage_size: Gauge,
    storage_operations: Counter,
    storage_errors: Counter,
    
    start_time: Instant,
}

impl BlockchainMetrics {
    /// Create a new metrics collector
    pub fn new() -> Result<Self, prometheus::Error> {
        let registry = Registry::new();
        
        // Transaction metrics
        let transactions_total = Counter::with_opts(Opts::new(
            "dag_transactions_total",
            "Total number of transactions processed"
        ))?;
        registry.register(Box::new(transactions_total.clone()))?;
        
        let transactions_pending = Gauge::with_opts(Opts::new(
            "dag_transactions_pending",
            "Number of pending transactions"
        ))?;
        registry.register(Box::new(transactions_pending.clone()))?;
        
        let transactions_confirmed = Gauge::with_opts(Opts::new(
            "dag_transactions_confirmed",
            "Number of confirmed transactions"
        ))?;
        registry.register(Box::new(transactions_confirmed.clone()))?;
        
        let transaction_latency = Histogram::with_opts(HistogramOpts::new(
            "dag_transaction_latency_seconds",
            "Time from transaction creation to confirmation"
        ))?;
        registry.register(Box::new(transaction_latency.clone()))?;
        
        // DAG metrics
        let dag_nodes_total = Gauge::with_opts(Opts::new(
            "dag_nodes_total",
            "Total number of nodes in the DAG"
        ))?;
        registry.register(Box::new(dag_nodes_total.clone()))?;
        
        let dag_depth = Gauge::with_opts(Opts::new(
            "dag_depth",
            "Current depth of the DAG (longest chain)"
        ))?;
        registry.register(Box::new(dag_depth.clone()))?;
        
        let dag_width = Gauge::with_opts(Opts::new(
            "dag_width",
            "Current width of the DAG (nodes at tip)"
        ))?;
        registry.register(Box::new(dag_width.clone()))?;
        
        let dag_forks_detected = Counter::with_opts(Opts::new(
            "dag_forks_detected_total",
            "Total number of forks detected"
        ))?;
        registry.register(Box::new(dag_forks_detected.clone()))?;
        
        // Consensus metrics
        let consensus_rounds_total = Counter::with_opts(Opts::new(
            "dag_consensus_rounds_total",
            "Total number of consensus rounds completed"
        ))?;
        registry.register(Box::new(consensus_rounds_total.clone()))?;
        
        let consensus_success_rate = Gauge::with_opts(Opts::new(
            "dag_consensus_success_rate",
            "Success rate of consensus rounds (0-1)"
        ))?;
        registry.register(Box::new(consensus_success_rate.clone()))?;
        
        let validator_score = GaugeVec::new(Opts::new(
            "dag_validator_score",
            "Current score of each validator"
        ), &["validator_id"])?;
        registry.register(Box::new(validator_score.clone()))?;
        
        let finality_time = Histogram::with_opts(HistogramOpts::new(
            "dag_finality_time_seconds",
            "Time to achieve finality for transactions"
        ))?;
        registry.register(Box::new(finality_time.clone()))?;
        
        // Node metrics
        let node_uptime = Gauge::with_opts(Opts::new(
            "dag_node_uptime_seconds",
            "Node uptime in seconds"
        ))?;
        registry.register(Box::new(node_uptime.clone()))?;
        
        let memory_usage = Gauge::with_opts(Opts::new(
            "dag_memory_usage_bytes",
            "Current memory usage in bytes"
        ))?;
        registry.register(Box::new(memory_usage.clone()))?;
        
        let cpu_usage = Gauge::with_opts(Opts::new(
            "dag_cpu_usage_percent",
            "Current CPU usage percentage"
        ))?;
        registry.register(Box::new(cpu_usage.clone()))?;
        
        let network_connections = Gauge::with_opts(Opts::new(
            "dag_network_connections",
            "Number of active network connections"
        ))?;
        registry.register(Box::new(network_connections.clone()))?;
        
        // Identity metrics
        let identity_rotations = Counter::with_opts(Opts::new(
            "dag_identity_rotations_total",
            "Total number of identity rotations"
        ))?;
        registry.register(Box::new(identity_rotations.clone()))?;
        
        let signature_verifications = Counter::with_opts(Opts::new(
            "dag_signature_verifications_total",
            "Total number of signature verifications"
        ))?;
        registry.register(Box::new(signature_verifications.clone()))?;
        
        let signature_failures = Counter::with_opts(Opts::new(
            "dag_signature_failures_total",
            "Total number of signature verification failures"
        ))?;
        registry.register(Box::new(signature_failures.clone()))?;
        
        // Storage metrics
        let storage_size = Gauge::with_opts(Opts::new(
            "dag_storage_size_bytes",
            "Total storage size in bytes"
        ))?;
        registry.register(Box::new(storage_size.clone()))?;
        
        let storage_operations = Counter::with_opts(Opts::new(
            "dag_storage_operations_total",
            "Total number of storage operations"
        ))?;
        registry.register(Box::new(storage_operations.clone()))?;
        
        let storage_errors = Counter::with_opts(Opts::new(
            "dag_storage_errors_total",
            "Total number of storage errors"
        ))?;
        registry.register(Box::new(storage_errors.clone()))?;
        
        Ok(Self {
            registry,
            transactions_total,
            transactions_pending,
            transactions_confirmed,
            transaction_latency,
            dag_nodes_total,
            dag_depth,
            dag_width,
            dag_forks_detected,
            consensus_rounds_total,
            consensus_success_rate,
            validator_score,
            finality_time,
            node_uptime,
            memory_usage,
            cpu_usage,
            network_connections,
            identity_rotations,
            signature_verifications,
            signature_failures,
            storage_size,
            storage_operations,
            storage_errors,
            start_time: Instant::now(),
        })
    }
    
    /// Update metrics from blockchain state
    pub async fn update_from_blockchain(&self, dag: &Arc<RwLock<DAGCore>>) {
        let dag = dag.read().await;
        
        // Update transaction metrics
        let pending_count = dag.get_pending_transactions().len();
        let confirmed_count = dag.get_confirmed_transactions().len();
        
        self.transactions_pending.set(pending_count as f64);
        self.transactions_confirmed.set(confirmed_count as f64);
        
        // Update DAG metrics
        let dag_stats = dag.get_dag_stats();
        self.dag_nodes_total.set(dag_stats.node_count as f64);
        self.dag_depth.set(dag_stats.depth as f64);
        self.dag_width.set(dag_stats.width as f64);
        
        // Update node metrics
        self.node_uptime.set(self.start_time.elapsed().as_secs_f64());
        
        // Update system metrics (simplified)
        if let Ok(memory_info) = sys_info::mem_info() {
            self.memory_usage.set(memory_info.total as f64 - memory_info.free as f64);
        }
        
        // Update storage metrics
        if let Ok(storage_size) = dag.get_storage_size() {
            self.storage_size.set(storage_size as f64);
        }
    }
    
    /// Record a new transaction
    pub fn record_transaction(&self) {
        self.transactions_total.inc();
    }
    
    /// Record transaction confirmation with latency
    pub fn record_transaction_confirmation(&self, latency_seconds: f64) {
        self.transaction_latency.observe(latency_seconds);
    }
    
    /// Record a fork detection
    pub fn record_fork_detection(&self) {
        self.dag_forks_detected.inc();
    }
    
    /// Record consensus round completion
    pub fn record_consensus_round(&self, success: bool) {
        self.consensus_rounds_total.inc();
        // Update success rate (simplified - in production you'd track rolling average)
    }
    
    /// Record finality time
    pub fn record_finality_time(&self, time_seconds: f64) {
        self.finality_time.observe(time_seconds);
    }
    
    /// Update validator score
    pub fn update_validator_score(&self, validator_id: &str, score: f64) {
        self.validator_score.with_label_values(&[validator_id]).set(score);
    }
    
    /// Record identity rotation
    pub fn record_identity_rotation(&self) {
        self.identity_rotations.inc();
    }
    
    /// Record signature verification
    pub fn record_signature_verification(&self, success: bool) {
        self.signature_verifications.inc();
        if !success {
            self.signature_failures.inc();
        }
    }
    
    /// Record storage operation
    pub fn record_storage_operation(&self, success: bool) {
        self.storage_operations.inc();
        if !success {
            self.storage_errors.inc();
        }
    }
    
    /// Get metrics in Prometheus format
    pub fn get_metrics(&self) -> Result<String, prometheus::Error> {
        let encoder = TextEncoder::new();
        let metric_families = self.registry.gather();
        encoder.encode_to_string(&metric_families)
    }
    
    /// Get the registry for custom metrics
    pub fn registry(&self) -> &Registry {
        &self.registry
    }
}

/// DAG statistics
#[derive(Debug, Clone)]
pub struct DAGStats {
    pub node_count: usize,
    pub depth: usize,
    pub width: usize,
    pub average_branching_factor: f64,
}

impl Default for DAGStats {
    fn default() -> Self {
        Self {
            node_count: 0,
            depth: 0,
            width: 0,
            average_branching_factor: 0.0,
        }
    }
}