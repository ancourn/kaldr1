//! Network utilities for the Mobile SDK

use std::collections::HashMap;
use std::net::{IpAddr, SocketAddr};
use std::time::Duration;
use serde::{Serialize, Deserialize};
use tokio::net::TcpStream;
use tokio::time::timeout;

use crate::types::*;
use crate::{SDKResult, SDKError};

/// Network utilities
pub struct NetworkUtils {
    timeout_duration: Duration,
}

impl NetworkUtils {
    /// Create new network utilities
    pub fn new(timeout_secs: u64) -> Self {
        Self {
            timeout_duration: Duration::from_secs(timeout_secs),
        }
    }

    /// Check if host is reachable
    pub async fn is_host_reachable(&self, host: &str, port: u16) -> SDKResult<bool> {
        let socket_addr = format!("{}:{}", host, port);
        let addr = socket_addr.parse::<SocketAddr>()
            .map_err(|e| SDKError::Network(e.to_string()))?;
        
        match timeout(self.timeout_duration, TcpStream::connect(&addr)).await {
            Ok(Ok(_)) => Ok(true),
            Ok(Err(_)) => Ok(false),
            Err(_) => Ok(false),
        }
    }

    /// Get network latency
    pub async fn get_network_latency(&self, host: &str, port: u16) -> SDKResult<Duration> {
        let start = std::time::Instant::now();
        
        let socket_addr = format!("{}:{}", host, port);
        let addr = socket_addr.parse::<SocketAddr>()
            .map_err(|e| SDKError::Network(e.to_string()))?;
        
        match timeout(self.timeout_duration, TcpStream::connect(&addr)).await {
            Ok(Ok(_)) => Ok(start.elapsed()),
            Ok(Err(e)) => Err(SDKError::Network(e.to_string())),
            Err(_) => Err(SDKError::Network("Connection timeout".to_string())),
        }
    }

    /// Resolve DNS
    pub async fn resolve_dns(&self, hostname: &str) -> SDKResult<Vec<IpAddr>> {
        use tokio::net::lookup_host;
        
        let addresses = lookup_host(hostname)
            .await
            .map_err(|e| SDKError::Network(e.to_string()))?;
        
        Ok(addresses.map(|addr| addr.ip()).collect())
    }

    /// Get local IP address
    pub async fn get_local_ip() -> SDKResult<IpAddr> {
        use local_ip_address::local_ip;
        
        local_ip()
            .map_err(|e| SDKError::Network(e.to_string()))
    }

    /// Check internet connectivity
    pub async fn check_internet_connectivity(&self) -> SDKResult<bool> {
        // Try to connect to Google's DNS server
        self.is_host_reachable("8.8.8.8", 53).await
    }

    /// Get network interfaces
    pub async fn get_network_interfaces() -> SDKResult<Vec<NetworkInterface>> {
        use pnet::datalink::interfaces;
        
        let interfaces = interfaces()
            .into_iter()
            .map(|iface| NetworkInterface {
                name: iface.name,
                description: iface.description,
                index: iface.index,
                mac_address: iface.mac_address.map(|mac| mac.to_string()),
                ips: iface.ips.iter().map(|ip| ip.ip().to_string()).collect(),
                is_up: iface.is_up(),
                is_broadcast: iface.is_broadcast(),
                is_loopback: iface.is_loopback(),
                is_point_to_point: iface.is_point_to_point(),
            })
            .collect();
        
        Ok(interfaces)
    }

    /// Ping host
    pub async fn ping_host(&self, host: &str) -> SDKResult<PingResult> {
        use surge_ping::ping;
        
        let mut pinger = ping::Pinger::new();
        pinger.timeout(Duration::from_secs(1));
        
        match pinger.send(host).await {
            Ok(reply) => Ok(PingResult {
                host: host.to_string(),
                success: true,
                latency: reply.rtt,
                packet_size: reply.packet_size,
                ttl: reply.ttl,
            }),
            Err(_) => Ok(PingResult {
                host: host.to_string(),
                success: false,
                latency: Duration::from_millis(0),
                packet_size: 0,
                ttl: 0,
            }),
        }
    }

    /// Trace route
    pub async fn trace_route(&self, host: &str) -> SDKResult<Vec<TraceHop>> {
        use std::process::Command;
        
        let output = Command::new("traceroute")
            .arg(host)
            .output()
            .map_err(|e| SDKError::Network(e.to_string()))?;
        
        if !output.status.success() {
            return Err(SDKError::Network("Trace route failed".to_string()));
        }
        
        let output_str = String::from_utf8_lossy(&output.stdout);
        let hops = self.parse_trace_route_output(&output_str)?;
        
        Ok(hops)
    }

    /// Parse trace route output
    fn parse_trace_route_output(&self, output: &str) -> SDKResult<Vec<TraceHop>> {
        let mut hops = Vec::new();
        
        for line in output.lines() {
            if line.starts_with("  ") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 3 {
                    let hop = TraceHop {
                        hop_number: parts[0].parse().unwrap_or(0),
                        host: parts[1].to_string(),
                        ip: parts[2].to_string(),
                        latency_ms: parts[3].replace("ms", "").parse().unwrap_or(0.0),
                    };
                    hops.push(hop);
                }
            }
        }
        
        Ok(hops)
    }

    /// Get network statistics
    pub async fn get_network_stats(&self) -> SDKResult<NetworkStats> {
        use sysinfo::System;
        use sysinfo::SystemExt;
        
        let mut sys = System::new();
        sys.refresh_networks();
        
        let mut total_received = 0;
        let mut total_transmitted = 0;
        let mut packets_received = 0;
        let mut packets_transmitted = 0;
        let mut errors_on_received = 0;
        let mut errors_on_transmitted = 0;
        
        for (_, network) in sys.networks() {
            total_received += network.received();
            total_transmitted += network.transmitted();
            packets_received += network.packets_received();
            packets_transmitted += network.packets_transmitted();
            errors_on_received += network.errors_on_received();
            errors_on_transmitted += network.errors_on_transmitted();
        }
        
        Ok(NetworkStats {
            total_received_bytes: total_received,
            total_transmitted_bytes: total_transmitted,
            packets_received,
            packets_transmitted,
            errors_on_received,
            errors_on_transmitted,
        })
    }

    /// Scan network ports
    pub async fn scan_ports(&self, host: &str, ports: &[u16]) -> SDKResult<Vec<PortScanResult>> {
        let mut results = Vec::new();
        
        for &port in ports {
            let is_open = self.is_host_reachable(host, port).await?;
            let latency = if is_open {
                self.get_network_latency(host, port).await.ok()
            } else {
                None
            };
            
            results.push(PortScanResult {
                host: host.to_string(),
                port,
                is_open,
                latency,
                service: self.get_service_name(port),
            });
        }
        
        Ok(results)
    }

    /// Get service name for port
    fn get_service_name(&self, port: u16) -> String {
        match port {
            21 => "FTP".to_string(),
            22 => "SSH".to_string(),
            23 => "Telnet".to_string(),
            25 => "SMTP".to_string(),
            53 => "DNS".to_string(),
            80 => "HTTP".to_string(),
            110 => "POP3".to_string(),
            143 => "IMAP".to_string(),
            443 => "HTTPS".to_string(),
            993 => "IMAPS".to_string(),
            995 => "POP3S".to_string(),
            8080 => "HTTP-Alt".to_string(),
            8443 => "HTTPS-Alt".to_string(),
            _ => "Unknown".to_string(),
        }
    }

    /// Get WHOIS information
    pub async fn get_whois_info(&self, domain: &str) -> SDKResult<WhoisInfo> {
        use whois_rust::WhoIs;
        
        let result = WhoIs::new(domain)
            .map_err(|e| SDKError::Network(e.to_string()))?
            .run()
            .await
            .map_err(|e| SDKError::Network(e.to_string()))?;
        
        Ok(WhoisInfo {
            domain: domain.to_string(),
            raw_data: result,
            parsed_data: self.parse_whois_data(&result),
        })
    }

    /// Parse WHOIS data
    fn parse_whois_data(&self, data: &str) -> HashMap<String, String> {
        let mut parsed = HashMap::new();
        
        for line in data.lines() {
            if let Some(colon_pos) = line.find(':') {
                let key = line[..colon_pos].trim().to_lowercase();
                let value = line[colon_pos + 1..].trim().to_string();
                
                if !key.is_empty() && !value.is_empty() {
                    parsed.insert(key, value);
                }
            }
        }
        
        parsed
    }

    /// Get SSL certificate info
    pub async fn get_ssl_cert_info(&self, host: &str, port: u16) -> SDKResult<SSLCertInfo> {
        use openssl::ssl::{SslConnector, SslMethod};
        use openssl::x509::X509;
        
        let connector = SslConnector::builder(SslMethod::tls())
            .map_err(|e| SDKError::Network(e.to_string()))?
            .build();
        
        let stream = TcpStream::connect(format!("{}:{}", host, port))
            .await
            .map_err(|e| SDKError::Network(e.to_string()))?;
        
        let ssl_stream = connector
            .connect(host, stream)
            .map_err(|e| SDKError::Network(e.to_string()))?;
        
        let cert = ssl_stream.ssl()
            .peer_certificate()
            .ok_or_else(|| SDKError::Network("No peer certificate".to_string()))?;
        
        let subject = cert.subject_name()
            .map_err(|e| SDKError::Network(e.to_string()))?
            .to_string();
        
        let issuer = cert.issuer_name()
            .map_err(|e| SDKError::Network(e.to_string()))?
            .to_string();
        
        let not_before = cert.not_before()
            .map_err(|e| SDKError::Network(e.to_string()))?;
        
        let not_after = cert.not_after()
            .map_err(|e| SDKError::Network(e.to_string()))?;
        
        Ok(SSLCertInfo {
            host: host.to_string(),
            port,
            subject,
            issuer,
            valid_from: not_before,
            valid_until: not_after,
            is_valid: not_before < chrono::Utc::now().naive_utc() 
                && not_after > chrono::Utc::now().naive_utc(),
        })
    }

    /// Get network quality score
    pub async fn get_network_quality_score(&self) -> SDKResult<NetworkQualityScore> {
        // Test multiple aspects of network quality
        let mut score = 100.0;
        let mut factors = HashMap::new();
        
        // Test internet connectivity
        let connectivity = self.check_internet_connectivity().await?;
        factors.insert("connectivity".to_string(), connectivity);
        if !connectivity {
            score -= 50.0;
        }
        
        // Test DNS resolution
        let dns_result = self.resolve_dns("google.com").await;
        let dns_working = dns_result.is_ok();
        factors.insert("dns_resolution".to_string(), dns_working);
        if !dns_working {
            score -= 20.0;
        }
        
        // Test latency to major services
        let latency_tests = vec![
            ("google.com", 443),
            ("cloudflare.com", 443),
            ("amazon.com", 443),
        ];
        
        let mut total_latency = 0;
        let mut successful_tests = 0;
        
        for (host, port) in latency_tests {
            if let Ok(latency) = self.get_network_latency(host, port).await {
                total_latency += latency.as_millis() as u64;
                successful_tests += 1;
            }
        }
        
        if successful_tests > 0 {
            let avg_latency = total_latency / successful_tests;
            factors.insert("average_latency_ms".to_string(), avg_latency);
            
            // Penalize high latency
            if avg_latency > 200 {
                score -= 15.0;
            } else if avg_latency > 100 {
                score -= 5.0;
            }
        } else {
            factors.insert("average_latency_ms".to_string(), 0u64);
            score -= 30.0;
        }
        
        Ok(NetworkQualityScore {
            score: score.max(0.0).min(100.0),
            factors,
        })
    }
}

/// Network interface information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterface {
    pub name: String,
    pub description: String,
    pub index: u32,
    pub mac_address: Option<String>,
    pub ips: Vec<String>,
    pub is_up: bool,
    pub is_broadcast: bool,
    pub is_loopback: bool,
    pub is_point_to_point: bool,
}

/// Ping result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PingResult {
    pub host: String,
    pub success: bool,
    pub latency: Duration,
    pub packet_size: u16,
    pub ttl: u32,
}

/// Trace route hop
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceHop {
    pub hop_number: u32,
    pub host: String,
    pub ip: String,
    pub latency_ms: f64,
}

/// Network statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStats {
    pub total_received_bytes: u64,
    pub total_transmitted_bytes: u64,
    pub packets_received: u64,
    pub packets_transmitted: u64,
    pub errors_on_received: u64,
    pub errors_on_transmitted: u64,
}

/// Port scan result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortScanResult {
    pub host: String,
    pub port: u16,
    pub is_open: bool,
    pub latency: Option<Duration>,
    pub service: String,
}

/// WHOIS information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhoisInfo {
    pub domain: String,
    pub raw_data: String,
    pub parsed_data: HashMap<String, String>,
}

/// SSL certificate information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SSLCertInfo {
    pub host: String,
    pub port: u16,
    pub subject: String,
    pub issuer: String,
    pub valid_from: chrono::NaiveDateTime,
    pub valid_until: chrono::NaiveDateTime,
    pub is_valid: bool,
}

/// Network quality score
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkQualityScore {
    pub score: f64,
    pub factors: HashMap<String, serde_json::Value>,
}

impl Default for NetworkUtils {
    fn default() -> Self {
        Self::new(10)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_network_utils_creation() {
        let utils = NetworkUtils::new(10);
        assert_eq!(utils.timeout_duration, Duration::from_secs(10));
    }

    #[tokio::test]
    async fn test_dns_resolution() {
        let utils = NetworkUtils::new(5);
        let result = utils.resolve_dns("google.com").await;
        assert!(result.is_ok());
        let addresses = result.unwrap();
        assert!(!addresses.is_empty());
    }

    #[tokio::test]
    async fn test_host_reachable() {
        let utils = NetworkUtils::new(5);
        let result = utils.is_host_reachable("8.8.8.8", 53).await;
        assert!(result.is_ok());
        // Note: This may fail in some test environments
    }

    #[tokio::test]
    async fn test_get_local_ip() {
        let result = NetworkUtils::get_local_ip().await;
        assert!(result.is_ok());
        let ip = result.unwrap();
        assert!(!ip.to_string().is_empty());
    }

    #[tokio::test]
    async fn test_ping_host() {
        let utils = NetworkUtils::new(5);
        let result = utils.ping_host("8.8.8.8").await;
        assert!(result.is_ok());
        let ping_result = result.unwrap();
        // Note: This may fail in some test environments
    }

    #[tokio::test]
    async fn test_network_stats() {
        let utils = NetworkUtils::new(5);
        let result = utils.get_network_stats().await;
        assert!(result.is_ok());
        let stats = result.unwrap();
        // Just verify we can get stats without panicking
    }

    #[tokio::test]
    async fn test_port_scan() {
        let utils = NetworkUtils::new(5);
        let ports = vec![80, 443, 8080];
        let result = utils.scan_ports("google.com", &ports).await;
        assert!(result.is_ok());
        let scan_results = result.unwrap();
        assert_eq!(scan_results.len(), ports.len());
    }
}