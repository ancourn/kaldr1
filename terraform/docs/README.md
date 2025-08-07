# KALDRIX Infrastructure as Code

This directory contains the Terraform configuration for deploying the KALDRIX blockchain platform infrastructure on AWS.

## Overview

The KALDRIX infrastructure is designed to be:
- **Production-ready**: Built with high availability, security, and monitoring in mind
- **Multi-environment**: Supports production, staging, and development environments
- **Scalable**: Auto-scaling components with proper resource management
- **Secure**: Implements security best practices and compliance requirements
- **Cost-effective**: Optimized for cost with proper resource sizing and lifecycle management

## Architecture

### Core Components

1. **VPC Network**: Multi-AZ VPC with public, private, and database subnets
2. **EKS Cluster**: Kubernetes cluster for container orchestration
3. **RDS Database**: PostgreSQL database with high availability and backup
4. **Redis Cluster**: In-memory data store with clustering and replication
5. **S3 Storage**: Object storage with lifecycle policies and encryption
6. **Monitoring**: CloudWatch, Prometheus, and Grafana for observability
7. **Security**: IAM roles, security groups, and network policies
8. **Networking**: ALB, Route53, and VPC endpoints

### Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Cloud                                │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Public Subnet  │  │  Private Subnet │  │ Database Subnet │  │
│  │                 │  │                 │  │                 │  │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │  │
│  │  │   ALB     │  │  │  │   EKS     │  │  │  │   RDS     │  │  │
│  │  │           │  │  │  │           │  │  │  │           │  │  │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │  │
│  │                 │  │                 │  │                 │  │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │  │
│  │  │  Route53  │  │  │  │   Redis   │  │  │  │  Backup   │  │  │
│  │  │           │  │  │           │  │  │  │           │  │  │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Monitoring & Logging                    │  │
│  │                                                             │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │  │
│  │  │CloudWatch │  │Prometheus │  │  Grafana  │  │    S3     │  │  │
│  │  │           │  │           │  │           │  │           │  │  │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
terraform/
├── modules/                    # Terraform modules
│   ├── vpc/                   # VPC and networking
│   ├── eks/                   # EKS Kubernetes cluster
│   ├── rds/                   # RDS PostgreSQL database
│   ├── redis/                 # Redis cluster
│   ├── s3/                    # S3 storage
│   ├── iam/                   # IAM roles and policies
│   ├── monitoring/            # CloudWatch and monitoring
│   ├── security/              # Security groups and KMS
│   ├── networking/            # ALB, Route53, etc.
│   ├── storage/               # ECR, Lambda, Backup
│   └── cost_optimization/     # Cost optimization features
├── environments/              # Environment-specific configurations
│   ├── production/           # Production environment
│   ├── staging/              # Staging environment
│   └── development/          # Development environment
├── scripts/                   # Deployment and utility scripts
│   ├── deploy.sh             # Main deployment script
│   ├── backup.sh             # Backup and restore scripts
│   ├── monitor.sh            # Monitoring and alerting scripts
│   └── cleanup.sh            # Cleanup and maintenance scripts
├── docs/                      # Documentation
│   ├── README.md             # This file
│   ├── architecture.md       # Architecture documentation
│   ├── security.md           # Security documentation
│   ├── monitoring.md         # Monitoring documentation
│   └── troubleshooting.md     # Troubleshooting guide
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Input variables
├── outputs.tf                 # Output variables
├── data.tf                   # Data sources
├── versions.tf               # Provider versions
└── terraform.tfvars          # Default variables
```

## Prerequisites

### Required Tools

- **Terraform**: >= 1.5.0
- **AWS CLI**: Latest version
- **kubectl**: Latest version
- **helm**: >= 3.12.0
- **jq**: Latest version

### Required AWS Services

- **IAM**: User with programmatic access
- **S3**: For Terraform state storage
- **DynamoDB**: For state locking
- **ECR**: For container image storage
- **Route53**: For DNS management (optional)

### Required Permissions

The IAM user/role needs the following permissions:
- Full access to: EC2, EKS, RDS, ElastiCache, S3, IAM, CloudWatch
- Limited access to: Route53, KMS, Secrets Manager, SSM
- Organization-level permissions for cross-account access (if applicable)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ancourn/kaldr1.git
cd kaldrix-project/terraform
```

### 2. Configure AWS Credentials

```bash
aws configure
# Enter your AWS access key, secret key, and region
```

### 3. Set Environment Variables

```bash
export VAULT_TOKEN="your-vault-token"
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

### 4. Deploy Infrastructure

```bash
# Deploy to development environment
./scripts/deploy.sh development us-east-1 apply

# Deploy to staging environment
./scripts/deploy.sh staging us-east-1 apply

# Deploy to production environment
./scripts/deploy.sh production us-east-1 apply
```

### 5. Verify Deployment

```bash
# Check Kubernetes cluster
kubectl cluster-info
kubectl get nodes

# Check application pods
kubectl get pods -n kaldrix

# Check services
kubectl get services -n kaldrix
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VAULT_TOKEN` | Vault authentication token | Yes | - |
| `AWS_ACCESS_KEY_ID` | AWS access key ID | Yes | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | Yes | - |
| `AWS_DEFAULT_REGION` | AWS region | No | `us-east-1` |
| `TF_LOG` | Terraform log level | No | - |

### Terraform Variables

The main configuration variables are defined in `variables.tf` and can be overridden in environment-specific `terraform.tfvars` files.

#### Core Variables

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `environment` | Environment name | string | - |
| `project_name` | Project name | string | `kaldrix` |
| `aws_region` | AWS region | string | `us-east-1` |
| `vpc_cidr` | VPC CIDR block | string | `10.0.0.0/16` |
| `domain_name` | Domain name | string | `kaldrix.com` |

#### Feature Flags

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `enable_monitoring` | Enable monitoring | bool | `true` |
| `enable_vault` | Enable Vault integration | bool | `true` |
| `enable_backup` | Enable backup | bool | `true` |
| `enable_cost_optimization` | Enable cost optimization | bool | `true` |
| `enable_security_compliance` | Enable security compliance | bool | `true` |

### Environment-Specific Configuration

Each environment has its own configuration file:

- `environments/production/terraform.tfvars` - Production environment
- `environments/staging/terraform.tfvars` - Staging environment
- `environments/development/terraform.tfvars` - Development environment

## Modules

### VPC Module

The VPC module creates a multi-AZ VPC with:
- Public, private, and database subnets
- NAT gateways and internet gateways
- VPC endpoints for AWS services
- Network ACLs and security groups
- Route tables and associations

**Resources:**
- `aws_vpc`
- `aws_subnet`
- `aws_internet_gateway`
- `aws_nat_gateway`
- `aws_route_table`
- `aws_vpc_endpoint`

### EKS Module

The EKS module creates a Kubernetes cluster with:
- EKS control plane with managed node groups
- Multiple node groups for different workloads
- Fargate profiles for serverless workloads
- EKS add-ons and managed services
- IAM roles and policies

**Resources:**
- `aws_eks_cluster`
- `aws_eks_node_group`
- `aws_eks_addon`
- `aws_iam_role`
- `aws_iam_policy`

### RDS Module

The RDS module creates a PostgreSQL database with:
- Multi-AZ deployment for high availability
- Automated backups and snapshots
- Performance insights and monitoring
- Parameter groups and option groups
- Security groups and network access

**Resources:**
- `aws_db_instance`
- `aws_db_subnet_group`
- `aws_db_parameter_group`
- `aws_secretsmanager_secret`
- `aws_iam_role`

### Redis Module

The Redis module creates a Redis cluster with:
- Multi-node cluster with replication
- Automatic failover and high availability
- Encryption at rest and in transit
- User authentication and access control
- Parameter groups and configuration

**Resources:**
- `aws_elasticache_replication_group`
- `aws_elasticache_subnet_group`
- `aws_elasticache_parameter_group`
- `aws_elasticache_user`
- `aws_secretsmanager_secret`

### S3 Module

The S3 module creates object storage with:
- Multiple buckets for different purposes
- Versioning and lifecycle policies
- Encryption and access control
- Replication and backup
- CORS configuration

**Resources:**
- `aws_s3_bucket`
- `aws_s3_bucket_versioning`
- `aws_s3_bucket_lifecycle_configuration`
- `aws_s3_bucket_policy`
- `aws_iam_role`

## Security

### IAM Roles and Policies

The infrastructure uses least-privilege IAM roles:
- **EKS Cluster Role**: For EKS cluster management
- **Node Group Roles**: For worker nodes
- **Service Roles**: For specific services (RDS, Redis, etc.)
- **Pod Roles**: For Kubernetes service accounts

### Network Security

- **VPC**: Private network with public/private subnet separation
- **Security Groups**: Restrictive access controls
- **Network ACLs**: Additional network layer protection
- **VPC Endpoints**: Private access to AWS services

### Data Encryption

- **Encryption at Rest**: KMS encryption for all data
- **Encryption in Transit**: TLS for all communications
- **Secrets Management**: Vault for sensitive data
- **Key Management**: AWS KMS for encryption keys

### Compliance

- **AWS Well-Architected**: Follows AWS best practices
- **CIS Controls**: Implements CIS security controls
- **GDPR**: Data protection and privacy controls
- **SOC 2**: Security and compliance controls

## Monitoring

### CloudWatch

- **Metrics**: Custom and AWS service metrics
- **Logs**: Centralized log collection
- **Alarms**: Automated alerting
- **Dashboards**: Visual monitoring

### Prometheus

- **Metrics Collection**: Application and infrastructure metrics
- **Alerting**: Rule-based alerting
- **Visualization**: Grafana dashboards
- **Storage**: Long-term metric storage

### Grafana

- **Dashboards**: Pre-configured monitoring dashboards
- **Alerting**: Notification channels
- **Users**: Role-based access control
- **Plugins**: Extended functionality

## Cost Optimization

### Resource Optimization

- **Right Sizing**: Appropriate resource allocation
- **Auto Scaling**: Dynamic resource adjustment
- **Spot Instances**: Cost-effective compute
- **Reserved Instances**: Long-term cost savings

### Storage Optimization

- **Lifecycle Policies**: Automatic data tiering
- **Compression**: Reduced storage costs
- **Cleanup**: Automatic resource cleanup
- **Monitoring**: Cost tracking and alerts

### Network Optimization

- **VPC Endpoints**: Reduced data transfer costs
- **CDN**: Content delivery optimization
- **Caching**: Reduced API calls
- **Compression**: Reduced data transfer

## Backup and Recovery

### Automated Backups

- **Database**: Daily snapshots with retention policies
- **Redis**: Automatic backup and restore
- **S3**: Versioning and cross-region replication
- **Kubernetes**: etcd backups and configuration

### Disaster Recovery

- **Multi-AZ**: High availability across availability zones
- **Cross-Region**: Multi-region deployment options
- **Failover**: Automatic failover mechanisms
- **Recovery**: Defined recovery procedures

## Deployment

### Using Scripts

The `scripts/deploy.sh` script provides a comprehensive deployment interface:

```bash
# Plan deployment
./scripts/deploy.sh production us-east-1 plan

# Apply deployment
./scripts/deploy.sh production us-east-1 apply

# Destroy infrastructure
./scripts/deploy.sh production us-east-1 destroy

# Generate outputs
./scripts/deploy.sh production us-east-1 outputs

# Generate documentation
./scripts/deploy.sh production us-east-1 docs
```

### Manual Deployment

For manual deployment using Terraform CLI:

```bash
# Initialize Terraform
terraform init \
    -backend-config="bucket=kaldrix-production-terraform-state" \
    -backend-config="key=kaldrix-production/terraform.tfstate" \
    -backend-config="region=us-east-1"

# Select workspace
terraform workspace new production
terraform workspace select production

# Plan deployment
terraform plan \
    -var-file="environments/production/terraform.tfvars" \
    -out="kaldrix-production.plan"

# Apply deployment
terraform apply "kaldrix-production.plan"
```

### CI/CD Integration

The infrastructure can be integrated with CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Deploy Infrastructure
  run: |
    ./scripts/deploy.sh ${{ env.ENVIRONMENT }} ${{ env.AWS_REGION }} apply
  env:
    ENVIRONMENT: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    AWS_REGION: us-east-1
    VAULT_TOKEN: ${{ secrets.VAULT_TOKEN }}
```

## Troubleshooting

### Common Issues

#### Terraform State Issues

```bash
# Force unlock state
terraform force-unlock LOCK_ID

# Refresh state
terraform refresh

# Reconfigure backend
terraform init -reconfigure
```

#### AWS Resource Issues

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check resource status
aws ec2 describe-instances
aws eks describe-cluster --name kaldrix-production
aws rds describe-db-instances
```

#### Kubernetes Issues

```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes

# Check pod status
kubectl get pods -A
kubectl describe pod POD_NAME

# Check logs
kubectl logs POD_NAME
```

### Debug Commands

```bash
# Terraform debug
TF_LOG=DEBUG terraform plan

# AWS CLI debug
AWS_DEBUG=1 aws ec2 describe-instances

# Kubernetes debug
kubectl get events --all-namespaces
```

### Support Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **Terraform Documentation**: https://developer.hashicorp.com/terraform/docs
- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **KALDRIX GitHub**: https://github.com/ancourn/kaldr1

## Best Practices

### Terraform Best Practices

- **Version Control**: Store all Terraform code in version control
- **State Management**: Use remote state with proper locking
- **Modular Design**: Use modules for reusability and maintainability
- **Variable Management**: Use environment-specific variable files
- **Documentation**: Document all modules and configurations

### AWS Best Practices

- **Security**: Use IAM roles instead of access keys
- **Networking**: Use private subnets for sensitive resources
- **Monitoring**: Enable comprehensive monitoring and alerting
- **Backup**: Implement automated backup and recovery
- **Cost Management**: Monitor and optimize resource usage

### Kubernetes Best Practices

- **Resource Management**: Use resource requests and limits
- **Security**: Use network policies and RBAC
- **Monitoring**: Implement health checks and readiness probes
- **Scaling**: Use horizontal pod autoscalers
- **Configuration**: Use ConfigMaps and Secrets

## Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** changes and test locally
4. **Submit** a pull request
5. **Review** and merge changes

### Code Standards

- **Terraform**: Follow Terraform style guide
- **Shell Scripts**: Use ShellCheck for validation
- **Documentation**: Keep documentation up to date
- **Testing**: Test all changes in non-production environments

### Testing

- **Unit Testing**: Test individual modules
- **Integration Testing**: Test module interactions
- **End-to-End Testing**: Test complete deployment
- **Performance Testing**: Test under load

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support and questions:
- **GitHub Issues**: Create an issue for bugs and feature requests
- **Documentation**: Refer to the documentation in the docs/ directory
- **Community**: Join the KALDRIX community channels
- **Email**: Contact the KALDRIX development team

---

*Last updated: $(date)*