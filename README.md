# KALDRIX Blockchain - Multi-Region DevOps Infrastructure

A comprehensive, production-ready DevOps infrastructure for the KALDRIX blockchain project, deployed across multiple AWS regions with high availability, disaster recovery, and comprehensive monitoring.

## 🏗️ Architecture Overview

### Multi-Region Deployment
- **Primary Region**: `us-east-1` (70% traffic)
- **Secondary Regions**: `us-west-2` (20% traffic), `eu-west-1` (10% traffic)
- **Global Networking**: Route53, CloudFront, AWS Global Accelerator
- **Database**: Cross-region replication with RDS read replicas
- **Caching**: Redis Global Datastore for low-latency access

### Core Components
- **Kubernetes**: EKS clusters with auto-scaling and self-healing
- **Databases**: PostgreSQL with cross-region replication
- **Caching**: Redis with multi-region replication
- **Load Balancing**: Application Load Balancers with global routing
- **CDN**: CloudFront with WAF protection
- **Monitoring**: CloudWatch, Prometheus, Grafana
- **Logging**: Centralized logging with CloudWatch and Fluentd
- **Backup**: Automated backup with S3 lifecycle policies
- **Disaster Recovery**: Automated failover with <15 minute RTO

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured with appropriate permissions
- Terraform installed
- kubectl installed
- Helm installed
- Domain name configured

### 1. Clone the Repository
```bash
git clone https://github.com/ancourn/kaldr1.git
cd kaldr1
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Deploy Infrastructure
```bash
# Deploy to all regions
./deploy-multi-region.sh

# Or deploy manually
cd terraform
terraform init
terraform plan
terraform apply
```

### 4. Configure kubectl
```bash
aws eks update-kubeconfig --name kaldr1-production-eks-primary --region us-east-1
```

### 5. Deploy Applications
```bash
kubectl apply -f k8s/
```

## 📁 Project Structure

```
kaldr1/
├── terraform/                    # Infrastructure as Code
│   ├── main.tf                   # Main configuration
│   ├── variables.tf              # Input variables
│   ├── outputs.tf                # Output variables
│   ├── terraform.tfvars          # Variable values
│   └── modules/                  # Reusable modules
│       ├── vpc/                  # VPC networking
│       ├── eks/                  # EKS Kubernetes
│       ├── rds/                  # RDS database
│       ├── redis/                # Redis caching
│       ├── alb/                  # Application Load Balancer
│       ├── route53/              # DNS management
│       ├── cloudfront/           # CDN distribution
│       ├── waf/                  # Web Application Firewall
│       ├── cloudwatch/           # Monitoring and alerts
│       └── sns/                  # Notifications
├── k8s/                          # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── deployment.yaml
│   └── service.yaml
├── vault/                        # Vault configuration
│   ├── config.hcl
│   └── policies/
├── .github/                      # GitHub Actions
│   └── workflows/
│       └── deploy-mobile-apps.yml
├── deploy-multi-region.sh        # Multi-region deployment script
├── .env                          # Environment variables
├── package.json                  # Node.js dependencies
└── README.md                     # This file
```

## 🔧 Configuration

### Environment Variables
```bash
# Project Configuration
PROJECT_NAME=kaldr1
ENVIRONMENT=production
DOMAIN_NAME=kaldr1.com

# AWS Regions
PRIMARY_REGION=us-east-1
SECONDARY_REGIONS=us-west-2,eu-west-1

# Database Configuration
DATABASE_ENGINE=postgres
DATABASE_VERSION=15.4
DATABASE_INSTANCE_CLASS=db.m6g.large
DATABASE_ALLOCATED_STORAGE=100

# Redis Configuration
REDIS_VERSION=7.0
REDIS_NODE_TYPE=cache.m6g.large
REDIS_NUM_NODES=2

# Kubernetes Configuration
KUBERNETES_VERSION=1.28
NODE_GROUP_DESIRED_SIZE=3
NODE_GROUP_MAX_SIZE=10
NODE_GROUP_MIN_SIZE=1
```

### Terraform Variables
Key configuration variables in `terraform/terraform.tfvars`:
- Multi-region networking configuration
- Database and caching settings
- Kubernetes cluster configuration
- Monitoring and alerting thresholds
- Backup and disaster recovery settings

## 🌐 Access URLs

After deployment, access the application at:
- **Primary Application**: https://kaldr1.com
- **Secondary West**: https://west.kaldr1.com
- **Secondary EU**: https://eu.kaldr1.com
- **Grafana**: http://grafana.monitoring.svc.cluster.local:3000
- **Prometheus**: http://prometheus.monitoring.svc.cluster.local:9090

## 📊 Monitoring & Observability

### CloudWatch Metrics
- **Application Metrics**: CPU, memory, network I/O
- **Database Metrics**: Connections, query performance, storage
- **Cache Metrics**: Hit rate, latency, memory usage
- **Load Balancer Metrics**: Request count, response time, error rates

### Prometheus Metrics
- **Kubernetes Metrics**: Pod resources, deployments, services
- **Application Metrics**: Custom business metrics
- **Infrastructure Metrics**: Node performance, cluster health

### Grafana Dashboards
- **System Overview**: Overall infrastructure health
- **Application Performance**: Response times, error rates
- **Database Performance**: Query performance, connection pools
- **Cache Performance**: Hit rates, memory usage

### Alerting
- **Critical Alerts**: Database failures, service outages
- **Warning Alerts**: High CPU/memory, degraded performance
- **Info Alerts**: Certificate expiration, backup status

## 🔒 Security Features

### Network Security
- **VPC**: Private and public subnets with network ACLs
- **Security Groups**: Application-specific security rules
- **WAF**: Web Application Firewall with OWASP rules
- **SSL/TLS**: End-to-end encryption with managed certificates

### Data Security
- **Encryption**: Data at rest and in transit
- **Secrets Management**: HashiCorp Vault integration
- **Access Control**: IAM roles and policies with least privilege
- **Audit Logging**: Comprehensive audit trails

### Compliance
- **GDPR**: Data residency and privacy controls
- **SOC 2**: Security and availability controls
- **HIPAA**: Healthcare data protection (if applicable)

## 🔄 Disaster Recovery

### Recovery Time Objective (RTO)
- **Critical Systems**: <15 minutes
- **Non-Critical Systems**: <1 hour

### Recovery Point Objective (RPO)
- **Database**: <1 hour
- **Application Data**: <5 minutes

### Failover Process
1. **Health Check**: Automated health monitoring
2. **Detection**: Anomaly detection and alerting
3. **Failover**: Automatic traffic redirection
4. **Recovery**: Service restoration and data sync
5. **Fallback**: Return to primary after resolution

### Backup Strategy
- **Database**: Daily snapshots with point-in-time recovery
- **Application**: Continuous backup to S3
- **Configuration**: Version control and infrastructure as code
- **Retention**: 30-day retention with lifecycle policies

## 🚀 CI/CD Pipeline

### GitHub Actions
- **Automated Testing**: Unit tests, integration tests, security scans
- **Infrastructure Deployment**: Terraform apply with approval
- **Application Deployment**: Kubernetes manifests with canary releases
- **Monitoring**: Post-deployment health checks and rollback

### Deployment Strategies
- **Blue-Green**: Zero-downtime deployments
- **Canary**: Gradual traffic shifting
- **Rolling Updates**: Incremental pod updates
- **Rollback**: Automatic rollback on failure

## 📈 Performance Optimization

### Database Optimization
- **Read Replicas**: Cross-region read replicas for low latency
- **Connection Pooling**: Optimal connection management
- **Indexing**: Strategic indexing for query performance
- **Caching**: Redis caching for frequently accessed data

### Application Optimization
- **Auto-scaling**: Horizontal and vertical scaling
- **Load Balancing**: Global load balancing with latency routing
- **CDN**: Content delivery network for static assets
- **Compression**: Gzip compression for faster transfers

### Network Optimization
- **Global Accelerator**: Improved global performance
- **Edge Locations**: CloudFront edge locations
- **Caching**: Browser and CDN caching
- **Compression**: Network-level compression

## 🔧 Maintenance

### Regular Tasks
- **Database**: Vacuum, analyze, index maintenance
- **Backups**: Verify backup integrity and test restores
- **Security**: Patch management and vulnerability scans
- **Monitoring**: Review metrics and adjust thresholds

### Scaling Operations
- **Vertical Scaling**: Increase instance sizes for higher load
- **Horizontal Scaling**: Add more instances for capacity
- **Region Expansion**: Deploy to additional regions
- **Feature Rollout**: Gradual feature deployment

## 🐛 Troubleshooting

### Common Issues
- **Pod Not Starting**: Check resource limits and image availability
- **Database Connection**: Verify security groups and credentials
- **DNS Resolution**: Check Route53 configuration and health checks
- **SSL Certificate**: Verify certificate status and renewal

### Debug Commands
```bash
# Check cluster status
kubectl cluster-info

# Check pod logs
kubectl logs <pod-name> -n kaldr1

# Check service status
kubectl get svc -n kaldr1

# Check ingress status
kubectl get ingress -n kaldr1

# Check AWS resources
aws resource-groups list-group-resources --group-name kaldr1-production
```

### Support
- **Documentation**: Comprehensive docs and runbooks
- **Monitoring**: Real-time alerts and dashboards
- **Logging**: Centralized logs with search capabilities
- **Health Checks**: Automated health monitoring

## 📋 Requirements

### System Requirements
- **AWS Account**: With appropriate permissions
- **Terraform**: Version 1.5.0 or higher
- **kubectl**: Latest stable version
- **Helm**: Version 3.0 or higher
- **AWS CLI**: Version 2.0 or higher

### AWS Services
- **EKS**: Elastic Kubernetes Service
- **RDS**: Relational Database Service
- **ElastiCache**: Redis caching
- **ALB**: Application Load Balancer
- **Route53**: DNS management
- **CloudFront**: Content delivery network
- **WAF**: Web Application Firewall
- **CloudWatch**: Monitoring and logging
- **SNS**: Notification service
- **S3**: Object storage
- **KMS**: Key management service

### Cost Considerations
- **Compute**: EKS nodes and managed services
- **Database**: RDS instances and read replicas
- **Storage**: EBS volumes and S3 buckets
- **Network**: Data transfer and Global Accelerator
- **Monitoring**: CloudWatch metrics and logs

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Follow coding standards and best practices
4. **Test Changes**: Run tests and validate configuration
5. **Submit Pull Request**: Detailed description of changes

### Development Guidelines
- **Infrastructure as Code**: Use Terraform for all infrastructure
- **Security First**: Implement security controls at all layers
- **Monitoring**: Comprehensive monitoring and alerting
- **Documentation**: Keep documentation up to date
- **Testing**: Automated testing for all changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **AWS**: For providing excellent cloud services
- **Terraform**: For infrastructure as code capabilities
- **Kubernetes**: For container orchestration
- **Prometheus**: For monitoring and alerting
- **Grafana**: For visualization and dashboards

## 📞 Support

For support and questions:
- **Documentation**: Check the comprehensive docs
- **Issues**: Create GitHub issues for bugs and features
- **Discussions**: Join community discussions
- **Email**: Contact the development team

---

**KALDRIX Blockchain** - Building the future of decentralized finance with enterprise-grade DevOps infrastructure.