# KALDRIX Multi-Region Deployment

This directory contains the Terraform configuration and deployment scripts for deploying KALDRIX across multiple AWS regions.

## Overview

The multi-region deployment provides:
- **High Availability**: Deployment across multiple AWS regions
- **Disaster Recovery**: Automated failover and recovery mechanisms
- **Global Performance**: Optimized routing and caching
- **Security**: Comprehensive security across all regions
- **Monitoring**: Global monitoring and alerting

## Architecture

### Regions
- **Primary Region**: us-east-1 (70% traffic)
- **Secondary Region 1**: us-west-2 (20% traffic)
- **Secondary Region 2**: eu-west-1 (10% traffic)

### Key Components
- **Global Networking**: Route53, CloudFront, Global Accelerator
- **Global Load Balancing**: ALBs, API Gateway, NLBs
- **Global Database**: RDS with cross-region replication, Redis Global Datastore
- **Global Compute**: EKS clusters in each region
- **Global Storage**: S3, ECR with cross-region replication
- **Global Monitoring**: CloudWatch, X-Ray, Synthetics
- **Disaster Recovery**: Automated failover with Lambda

## Prerequisites

### Required Tools
- AWS CLI (v2.0+)
- Terraform (v1.5+)
- kubectl (v1.27+)
- helm (v3.10+)
- curl
- jq

### AWS Requirements
- AWS account with appropriate permissions
- IAM user/role with admin access
- Configured AWS credentials
- Domain name registered in Route53

### Network Requirements
- VPCs in each target region
- Internet gateways and NAT gateways
- Subnets for each availability zone
- Security groups and network ACLs

## Quick Start

### 1. Deploy Multi-Region Infrastructure

```bash
# Navigate to multi-region directory
cd terraform/multi-region

# Deploy to staging environment
./scripts/deploy-multi-region.sh -e staging -d staging.kaldrix.io

# Deploy to production environment
./scripts/deploy-multi-region.sh -e production -d kaldrix.io
```

### 2. Test Failover

```bash
# Simulate failover (no disruption)
./scripts/test-failover.sh -e staging -t simulation

# Perform real failover (causes disruption)
./scripts/test-failover.sh -e staging -t real -r us-west-2

# Rollback to primary region
./scripts/test-failover.sh -e staging -t rollback
```

### 3. Destroy Infrastructure

```bash
# Destroy staging environment
./scripts/destroy-multi-region.sh -e staging

# Force destroy production environment
./scripts/destroy-multi-region.sh -e production -f
```

## Configuration

### Environment Variables

```bash
# AWS Configuration
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1

# Vault Configuration
export VAULT_ADDR=https://vault.kaldrix.io
export VAULT_TOKEN=your_vault_token

# Domain Configuration
export DOMAIN_NAME=kaldrix.io
```

### Terraform Variables

Key configuration variables in `terraform.tfvars`:

```hcl
# Environment
environment = "production"

# Regions
regions = ["us-east-1", "us-west-2", "eu-west-1"]
primary_region = "us-east-1"

# Domain
domain_name = "kaldrix.io"

# Vault
enable_vault = true
vault_address = "https://vault.kaldrix.io"

# Monitoring
enable_monitoring = true
enable_cdn = true
enable_accelerator = true
```

## Deployment Scripts

### deploy-multi-region.sh

Deploys KALDRIX infrastructure across multiple regions.

**Usage:**
```bash
./scripts/deploy-multi-region.sh [OPTIONS]

OPTIONS:
    -e, --environment ENV     Environment to deploy (production, staging, development)
    -r, --regions REGIONS     Comma-separated list of regions
    -p, --primary-region REG Primary region
    -d, --domain DOMAIN       Domain name for the application
    -v, --vault-address URL   Vault server address
    -h, --help               Show help message
```

**Examples:**
```bash
# Deploy to staging with default regions
./scripts/deploy-multi-region.sh -e staging -d staging.kaldrix.io

# Deploy to production with custom regions
./scripts/deploy-multi-region.sh -e production -r "us-east-1,us-west-2,eu-west-1,ap-southeast-1" -p us-east-1 -d kaldrix.io

# Deploy to development with single region
./scripts/deploy-multi-region.sh -e development -r "us-east-1" -p us-east-1 -d dev.kaldrix.io
```

### test-failover.sh

Tests failover capabilities of the multi-region deployment.

**Usage:**
```bash
./scripts/test-failover.sh [OPTIONS]

OPTIONS:
    -e, --environment ENV     Environment to test
    -d, --domain DOMAIN       Domain name for the application
    -t, --test-type TYPE      Test type: simulation, real, rollback
    -r, --region REGION       Specific region to test
    -h, --help               Show help message
```

**Examples:**
```bash
# Simulate failover to us-west-2
./scripts/test-failover.sh -e staging -t simulation -r us-west-2

# Perform real failover (causes disruption)
./scripts/test-failover.sh -e staging -t real -r us-west-2

# Rollback to primary region
./scripts/test-failover.sh -e staging -t rollback
```

### destroy-multi-region.sh

Destroys KALDRIX infrastructure across all regions.

**Usage:**
```bash
./scripts/destroy-multi-region.sh [OPTIONS]

OPTIONS:
    -e, --environment ENV     Environment to destroy
    -f, --force              Force destruction without confirmation
    -h, --help               Show help message
```

**Examples:**
```bash
# Destroy staging environment with confirmation
./scripts/destroy-multi-region.sh -e staging

# Force destroy production environment
./scripts/destroy-multi-region.sh -e production -f
```

## Module Structure

```
terraform/multi-region/
├── main.tf                    # Main Terraform configuration
├── variables.tf              # Input variables
├── providers.tf              # Provider configurations
├── outputs.tf                # Output variables
├── modules/                  # Terraform modules
│   ├── global-networking/    # Global networking module
│   ├── global-database/      # Global database module
│   ├── global-load-balancing/ # Global load balancing module
│   ├── global-monitoring/    # Global monitoring module
│   └── disaster-recovery/    # Disaster recovery module
├── scripts/                  # Deployment scripts
│   ├── deploy-multi-region.sh
│   ├── test-failover.sh
│   └── destroy-multi-region.sh
├── environments/             # Environment-specific configurations
│   ├── production/
│   ├── staging/
│   └── development/
└── docs/                     # Documentation
    ├── MULTI_REGION_ARCHITECTURE.md
    └── README.md
```

## Monitoring and Observability

### CloudWatch Dashboards
- **Global Dashboard**: Overview of all regions
- **Regional Dashboards**: Region-specific metrics
- **Application Dashboards**: Application performance
- **Database Dashboards**: Database performance and replication

### Key Metrics
- **Application**: Response time, error rate, throughput
- **Infrastructure**: CPU, memory, disk, network
- **Database**: Query performance, replication lag
- **Network**: Latency, packet loss, bandwidth

### Alerting
- **Critical Alerts**: Immediate notification for critical issues
- **Warning Alerts**: Proactive monitoring for potential issues
- **Performance Alerts**: Performance degradation alerts
- **Business Alerts**: Business metric alerts

## Disaster Recovery

### Recovery Objectives
- **RPO**: < 5 minutes
- **RTO**: < 15 minutes
- **MTTR**: < 30 minutes
- **Availability**: 99.99%

### Failover Process
1. **Detection**: Health monitoring detects failure
2. **Notification**: Alert sent to operations team
3. **Failover**: Automatic or manual failover initiated
4. **Validation**: Post-failover health checks
5. **Rollback**: Return to normal operations when ready

### Testing
- **Simulation Tests**: Regular simulation tests
- **Real Tests**: Periodic real failover tests
- **Rollback Tests**: Validate rollback procedures
- **Performance Tests**: Test performance during failover

## Security

### Network Security
- **VPC Isolation**: Separate VPCs per region
- **Security Groups**: Fine-grained access control
- **Network ACLs**: Subnet-level access control
- **VPC Peering**: Cross-region connectivity

### Data Security
- **Encryption**: KMS-managed encryption
- **Data Residency**: Compliance with data residency
- **Backup Security**: Encrypted backups
- **Key Rotation**: Automatic key rotation

### Application Security
- **WAF**: Web Application Firewall
- **DDoS Protection**: AWS Shield integration
- **SSL/TLS**: End-to-end encryption
- **Security Monitoring**: Continuous monitoring

## Cost Management

### Cost Optimization
- **Right Sizing**: Appropriate resource sizing
- **Auto Scaling**: Dynamic resource allocation
- **Spot Instances**: Cost-effective compute
- **Reserved Instances**: Long-term savings

### Cost Monitoring
- **Cost Allocation**: Detailed cost breakdown
- **Budget Monitoring**: Proactive budget management
- **Cost Optimization**: Continuous optimization
- **Reporting**: Regular cost reports

## Troubleshooting

### Common Issues

#### Deployment Failures
```bash
# Check Terraform state
terraform state list

# Check AWS credentials
aws sts get-caller-identity

# Check region availability
aws ec2 describe-regions --region-names us-east-1
```

#### Failover Issues
```bash
# Check health status
./scripts/test-failover.sh -e staging -t simulation

# Check DNS records
dig +short failover.staging.kaldrix.io

# Check Route53 health checks
aws route53 list-health-checks
```

#### Monitoring Issues
```bash
# Check CloudWatch metrics
aws cloudwatch list-metrics --namespace "AWS/ApplicationELB"

# Check alarms
aws cloudwatch describe-alarms

# Check logs
aws logs describe-log-groups
```

### Support

For issues and questions:
1. Check the documentation in `docs/`
2. Review the troubleshooting section
3. Check CloudWatch logs and metrics
4. Contact the operations team

## Best Practices

### Deployment
- Always test in staging first
- Use blue-green deployments
- Monitor deployment progress
- Have rollback procedures ready

### Monitoring
- Set up comprehensive monitoring
- Configure appropriate alerting
- Regular dashboard reviews
- Performance baseline monitoring

### Disaster Recovery
- Regular failover testing
- Document recovery procedures
- Maintain backup integrity
- Test rollback procedures

### Security
- Regular security audits
- Monitor access logs
- Keep systems updated
- Security awareness training

## Contributing

1. Follow the established coding standards
2. Test changes in development environment
3. Update documentation for new features
4. Submit pull requests for review

## License

This project is licensed under the MIT License - see the LICENSE file for details.