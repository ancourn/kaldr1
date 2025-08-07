terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.region
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

data "aws_eks_cluster" "cluster" {
  name = var.kubernetes_cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = var.kubernetes_cluster_name
}

data "aws_vpc" "selected" {
  id = var.vpc_id
}

# Random password for Grafana
resource "random_password" "grafana_password" {
  length  = 16
  special = false
}

# EFS for Prometheus data persistence
resource "aws_efs_file_system" "prometheus_data" {
  creation_token = "${var.environment}-kaldrix-prometheus-data"
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-prometheus-data"
    Environment = var.environment
    Component   = "business_metrics"
  })
}

resource "aws_efs_mount_target" "prometheus_data" {
  count           = length(var.private_subnets)
  file_system_id  = aws_efs_file_system.prometheus_data.id
  subnet_id       = var.private_subnets[count.index]
  security_groups = [aws_security_group.efs_sg.id]
}

resource "aws_security_group" "efs_sg" {
  name        = "${var.environment}-kaldrix-efs-sg"
  description = "Security group for EFS"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    security_groups = [aws_security_group.prometheus_sg.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-efs-sg"
    Environment = var.environment
    Component   = "business_metrics"
  })
}

# Security Group for Prometheus
resource "aws_security_group" "prometheus_sg" {
  name        = "${var.environment}-kaldrix-prometheus-sg"
  description = "Security group for Prometheus"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    security_groups = [aws_security_group.grafana_sg.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-prometheus-sg"
    Environment = var.environment
    Component   = "business_metrics"
  })
}

# Security Group for Grafana
resource "aws_security_group" "grafana_sg" {
  name        = "${var.environment}-kaldrix-grafana-sg"
  description = "Security group for Grafana"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-grafana-sg"
    Environment = var.environment
    Component   = "business_metrics"
  })
}

# Kubernetes namespace for monitoring
resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
    labels = {
      name = "monitoring"
    }
  }
}

# Prometheus Helm Release
resource "helm_release" "prometheus" {
  count      = var.enable_prometheus ? 1 : 0
  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "prometheus"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "25.6.0"
  
  set {
    name  = "server.persistentVolume.enabled"
    value = "true"
  }
  
  set {
    name  = "server.persistentVolume.storageClass"
    value = "efs-sc"
  }
  
  set {
    name  = "server.persistentVolume.size"
    value = "100Gi"
  }
  
  set {
    name  = "server.securityContext.enabled"
    value = "false"
  }
  
  set {
    name  = "server.service.type"
    value = "ClusterIP"
  }
  
  set {
    name  = "server.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-type"
    value = "nlb"
  }
  
  set {
    name  = "alertmanager.enabled"
    value = "false"
  }
  
  set {
    name  = "pushgateway.enabled"
    value = "false"
  }
  
  set {
    name  = "kube-state-metrics.enabled"
    value = "true"
  }
  
  set {
    name  = "node-exporter.enabled"
    value = "true"
  }
  
  values = [<<EOF
server:
  configMapOverrideName: prometheus-server-config
  extraConfigmapMounts:
    - name: prometheus-config
      mountPath: /etc/prometheus/conf.d
      configMap: prometheus-custom-config
      readOnly: true
EOF
  ]
  
  depends_on = [
    kubernetes_namespace.monitoring
  ]
}

# Custom Prometheus ConfigMap
resource "kubernetes_config_map" "prometheus_custom_config" {
  count = var.enable_prometheus ? 1 : 0
  metadata {
    name      = "prometheus-custom-config"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }
  
  data = {
    "kaldrix-metrics.yml" = <<EOF
# KALDRIX Business Metrics Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: kaldrix-metrics-config
data:
  metrics.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    scrape_configs:
      # KALDRIX Application Metrics
      - job_name: 'kaldrix-app'
        static_configs:
          - targets: ['kaldrix-service:8080']
        metrics_path: '/metrics'
        scrape_interval: 10s
        scheme: http
      
      # KALDRIX Blockchain Metrics
      - job_name: 'kaldrix-blockchain'
        static_configs:
          - targets: ['kaldrix-blockchain:9090']
        metrics_path: '/blockchain/metrics'
        scrape_interval: 15s
      
      # KALDRIX Consensus Metrics
      - job_name: 'kaldrix-consensus'
        static_configs:
          - targets: ['kaldrix-consensus:9091']
        metrics_path: '/consensus/metrics'
        scrape_interval: 15s
      
      # KALDRIX Network Metrics
      - job_name: 'kaldrix-network'
        static_configs:
          - targets: ['kaldrix-network:9092']
        metrics_path: '/network/metrics'
        scrape_interval: 15s
      
      # KALDRIX Transaction Metrics
      - job_name: 'kaldrix-transactions'
        static_configs:
          - targets: ['kaldrix-transactions:9093']
        metrics_path: '/transactions/metrics'
        scrape_interval: 10s
      
      # Node Exporter for infrastructure metrics
      - job_name: 'node-exporter'
        static_configs:
          - targets: ['node-exporter:9100']
        scrape_interval: 30s
      
      # Kube State Metrics
      - job_name: 'kube-state-metrics'
        static_configs:
          - targets: ['kube-state-metrics:8080']
        scrape_interval: 30s
EOF
  }
}

# Grafana Helm Release
resource "helm_release" "grafana" {
  count      = var.enable_grafana ? 1 : 0
  name       = "grafana"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "grafana"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "7.0.17"
  
  set {
    name  = "adminPassword"
    value = var.grafana_admin_password != "" ? var.grafana_admin_password : random_password.grafana_password.result
  }
  
  set {
    name  = "service.type"
    value = "LoadBalancer"
  }
  
  set {
    name  = "service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-type"
    value = "nlb"
  }
  
  set {
    name  = "persistence.enabled"
    value = "true"
  }
  
  set {
    name  = "persistence.size"
    value = "10Gi"
  }
  
  set {
    name  = "persistence.storageClass"
    value = "efs-sc"
  }
  
  set {
    name  = "datasources.prometheus.enabled"
    value = "true"
  }
  
  set {
    name  = "datasources.prometheus.url"
    value = "http://prometheus-server:9090"
  }
  
  set {
    name  = "sidecar.datasources.enabled"
    value = "true"
  }
  
  set {
    name  = "sidecar.dashboards.enabled"
    value = "true"
  }
  
  set {
    name  = "sidecar.dashboards.searchNamespace"
    value = "ALL"
  }
  
  values = [<<EOF
dashboardProviders:
  dashboardproviders.yaml:
    apiVersion: 1
    providers:
    - name: 'default'
      orgId: 1
      folder: ''
      type: file
      disableDeletion: false
      editable: true
      options:
        path: /var/lib/grafana/dashboards/default

dashboards:
  default:
    # KALDRIX Business Overview Dashboard
    kaldrix-business-overview:
      gnetId: 0
      revision: 1
      datasource: Prometheus
      json: |
        {
          "dashboard": {
            "id": null,
            "title": "KALDRIX Business Overview",
            "tags": ["kaldrix", "business"],
            "timezone": "browser",
            "panels": [
              {
                "id": 1,
                "title": "Transaction Rate",
                "type": "graph",
                "targets": [{
                  "expr": "rate(kaldrix_transactions_total[5m])",
                  "legendFormat": "Transactions per second"
                }],
                "yAxes": [{"label": "Rate"}]
              },
              {
                "id": 2,
                "title": "Block Height",
                "type": "stat",
                "targets": [{
                  "expr": "kaldrix_block_height",
                  "legendFormat": "Current Block"
                }]
              },
              {
                "id": 3,
                "title": "Network Health",
                "type": "gauge",
                "targets": [{
                  "expr": "kaldrix_network_health_score",
                  "legendFormat": "Health Score"
                }],
                "fieldConfig": {
                  "defaults": {
                    "min": 0,
                    "max": 100,
                    "thresholds": {
                      "steps": [
                        {"color": "red", "value": 0},
                        {"color": "yellow", "value": 50},
                        {"color": "green", "value": 80}
                      ]
                    }
                  }
                }
              },
              {
                "id": 4,
                "title": "Peer Count",
                "type": "graph",
                "targets": [{
                  "expr": "kaldrix_peer_count",
                  "legendFormat": "Connected Peers"
                }]
              }
            ],
            "time": {
              "from": "now-1h",
              "to": "now"
            }
          }
        }
    
    # KALDRIX Performance Dashboard
    kaldrix-performance:
      gnetId: 0
      revision: 1
      datasource: Prometheus
      json: |
        {
          "dashboard": {
            "id": null,
            "title": "KALDRIX Performance Metrics",
            "tags": ["kaldrix", "performance"],
            "timezone": "browser",
            "panels": [
              {
                "id": 1,
                "title": "CPU Usage",
                "type": "graph",
                "targets": [{
                  "expr": "rate(container_cpu_usage_seconds_total{namespace=~\"kaldrix|monitoring\"}[5m])",
                  "legendFormat": "{{pod}}"
                }]
              },
              {
                "id": 2,
                "title": "Memory Usage",
                "type": "graph",
                "targets": [{
                  "expr": "container_memory_usage_bytes{namespace=~\"kaldrix|monitoring\"}",
                  "legendFormat": "{{pod}}"
                }]
              },
              {
                "id": 3,
                "title": "Network I/O",
                "type": "graph",
                "targets": [{
                  "expr": "rate(container_network_transmit_bytes_total[5m])",
                  "legendFormat": "TX {{pod}}"
                }]
              },
              {
                "id": 4,
                "title": "Disk I/O",
                "type": "graph",
                "targets": [{
                  "expr": "rate(container_fs_io_total[5m])",
                  "legendFormat": "I/O {{pod}}"
                }]
              }
            ],
            "time": {
              "from": "now-1h",
              "to": "now"
            }
          }
        }
    
    # KALDRIX Consensus Dashboard
    kaldrix-consensus:
      gnetId: 0
      revision: 1
      datasource: Prometheus
      json: |
        {
          "dashboard": {
            "id": null,
            "title": "KALDRIX Consensus Metrics",
            "tags": ["kaldrix", "consensus"],
            "timezone": "browser",
            "panels": [
              {
                "id": 1,
                "title": "Consensus Round Time",
                "type": "graph",
                "targets": [{
                  "expr": "kaldrix_consensus_round_duration_seconds",
                  "legendFormat": "Round Duration"
                }]
              },
              {
                "id": 2,
                "title": "Validation Success Rate",
                "type": "gauge",
                "targets": [{
                  "expr": "rate(kaldrix_consensus_validations_success_total[5m]) / rate(kaldrix_consensus_validations_total[5m]) * 100",
                  "legendFormat": "Success Rate %"
                }]
              },
              {
                "id": 3,
                "title": "Active Validators",
                "type": "stat",
                "targets": [{
                  "expr": "kaldrix_consensus_active_validators",
                  "legendFormat": "Active Validators"
                }]
              },
              {
                "id": 4,
                "title": "Consensus Health",
                "type": "graph",
                "targets": [{
                  "expr": "kaldrix_consensus_health_score",
                  "legendFormat": "Health Score"
                }]
              }
            ],
            "time": {
              "from": "now-1h",
              "to": "now"
            }
          }
        }
EOF
  ]
  
  depends_on = [
    kubernetes_namespace.monitoring,
    helm_release.prometheus
  ]
}

# CloudWatch Custom Metrics for Business KPIs
resource "aws_cloudwatch_metric_alarm" "business_kpi_alerts" {
  for_each = {
    "transaction_rate_high" = {
      metric_name = "TransactionRate"
      threshold   = 1000
      operator    = "GreaterThanThreshold"
      description = "Transaction rate above threshold"
    }
    "transaction_rate_low" = {
      metric_name = "TransactionRate"
      threshold   = 10
      operator    = "LessThanThreshold"
      description = "Transaction rate below threshold"
    }
    "block_propagation_delay" = {
      metric_name = "BlockPropagationDelay"
      threshold   = 30
      operator    = "GreaterThanThreshold"
      description = "Block propagation delay too high"
    }
    "validator_participation_low" = {
      metric_name = "ValidatorParticipation"
      threshold   = 80
      operator    = "LessThanThreshold"
      description = "Validator participation below threshold"
    }
  }
  
  alarm_name          = "${var.environment}-kaldrix-${each.key}"
  alarm_description   = each.value.description
  comparison_operator = each.value.operator
  evaluation_periods  = "2"
  metric_name         = each.value.metric_name
  namespace           = "KALDRIX/Business"
  period              = "300"
  statistic           = "Average"
  threshold           = each.value.threshold
  
  tags = merge(var.tags, {
    Name        = "${var.environment}-kaldrix-${each.key}-alarm"
    Environment = var.environment
    Component   = "business_metrics"
  })
}