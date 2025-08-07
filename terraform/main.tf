# KALDRIX Blockchain - Main Terraform Configuration
# This is the main configuration file for the KALDRIX blockchain infrastructure

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "~> 3.15"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }

  backend "s3" {
    bucket = "kaldr1-terraform-state"
    key    = "kaldr1/terraform.tfstate"
    region = "us-east-1"
    dynamodb_table = "kaldr1-terraform-lock"
    encrypt = true
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.primary_region
  
  default_tags {
    tags = {
      Project     = "KALDRIX"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = "Blockchain"
    }
  }
}

# Configure secondary region providers
provider "aws" {
  alias  = "secondary_west"
  region = var.secondary_regions[0]
  
  default_tags {
    tags = {
      Project     = "KALDRIX"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = "Blockchain"
    }
  }
}

provider "aws" {
  alias  = "secondary_eu"
  region = var.secondary_regions[1]
  
  default_tags {
    tags = {
      Project     = "KALDRIX"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = "Blockchain"
    }
  }
}

# Configure Vault Provider
provider "vault" {
  address = var.vault_address
  token   = var.vault_token
}

# Configure Kubernetes Provider
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  token                  = data.aws_eks_cluster_auth.this.token
}

# Configure Helm Provider
provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    token                  = data.aws_eks_cluster_auth.this.token
  }
}

# Get EKS cluster authentication token
data "aws_eks_cluster_auth" "this" {
  name = module.eks.cluster_name
}

# Random suffix for unique resource names
resource "random_pet" "suffix" {
  length = 2
}

# Primary Region Infrastructure
module "vpc_primary" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws
  }
  
  region               = var.primary_region
  environment          = var.environment
  project_name         = var.project_name
  vpc_cidr            = var.vpc_cidr_primary
  availability_zones  = var.availability_zones_primary
  private_subnets     = var.private_subnets_primary
  public_subnets      = var.public_subnets_primary
  database_subnets    = var.database_subnets_primary
  enable_nat_gateway  = true
  single_nat_gateway  = false
  one_nat_gateway_per_az = true
  enable_vpn_gateway = false
  enable_flow_log     = true
  
  tags = {
    Tier = "Primary"
  }
}

# Secondary West Region Infrastructure
module "vpc_secondary_west" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.secondary_west
  }
  
  region               = var.secondary_regions[0]
  environment          = var.environment
  project_name         = var.project_name
  vpc_cidr            = var.vpc_cidr_secondary_west
  availability_zones  = var.availability_zones_secondary_west
  private_subnets     = var.private_subnets_secondary_west
  public_subnets      = var.public_subnets_secondary_west
  database_subnets    = var.database_subnets_secondary_west
  enable_nat_gateway  = true
  single_nat_gateway  = true
  enable_vpn_gateway = false
  enable_flow_log     = true
  
  tags = {
    Tier = "Secondary-West"
  }
}

# Secondary EU Region Infrastructure
module "vpc_secondary_eu" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.secondary_eu
  }
  
  region               = var.secondary_regions[1]
  environment          = var.environment
  project_name         = var.project_name
  vpc_cidr            = var.vpc_cidr_secondary_eu
  availability_zones  = var.availability_zones_secondary_eu
  private_subnets     = var.private_subnets_secondary_eu
  public_subnets      = var.public_subnets_secondary_eu
  database_subnets    = var.database_subnets_secondary_eu
  enable_nat_gateway  = true
  single_nat_gateway  = true
  enable_vpn_gateway = false
  enable_flow_log     = true
  
  tags = {
    Tier = "Secondary-EU"
  }
}

# EKS Cluster in Primary Region
module "eks" {
  source = "./modules/eks"
  
  providers = {
    aws = aws
  }
  
  cluster_name    = "${var.project_name}-${var.environment}-eks-primary"
  cluster_version = var.kubernetes_version
  
  vpc_id     = module.vpc_primary.vpc_id
  subnet_ids = module.vpc_primary.private_subnets
  
  node_groups = {
    primary = {
      desired_size = var.node_group_desired_size
      max_size     = var.node_group_max_size
      min_size     = var.node_group_min_size
      
      instance_types = var.node_instance_types
      
      capacity_type  = "ON_DEMAND"
      disk_size      = var.node_disk_size
      
      labels = {
        "node.kubernetes.io/role" = "primary"
        "environment"             = var.environment
      }
      
      taints = []
    }
  }
  
  cluster_tags = {
    "karpenter.sh/discovery" = "${var.project_name}-${var.environment}"
  }
  
  node_group_tags = {
    "karpenter.sh/discovery" = "${var.project_name}-${var.environment}"
  }
  
  manage_aws_auth_configmap = true
  aws_auth_roles = [
    {
      rolearn  = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/KALDRIX-AdminRole"
      username = "admin:{{SessionName}}"
      groups   = ["system:masters"]
    }
  ]
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# RDS Primary Database
module "rds_primary" {
  source = "./modules/rds"
  
  providers = {
    aws = aws
  }
  
  identifier = "${var.project_name}-${var.environment}-primary"
  
  engine         = var.database_engine
  engine_version = var.database_engine_version
  
  instance_class    = var.database_instance_class
  allocated_storage = var.database_allocated_storage
  
  db_name  = var.database_name
  username = var.database_username
  password = var.database_password
  
  vpc_security_group_ids = [module.vpc_primary.database_security_group_id]
  db_subnet_group_name   = module.vpc_primary.database_subnet_group_name
  
  multi_az               = true
  storage_encrypted      = true
  backup_retention_period = var.database_backup_retention
  backup_window          = "07:00-08:00"
  maintenance_window     = "Mon:08:00-Mon:09:00"
  
  deletion_protection = var.environment == "production" ? true : false
  
  tags = {
    Tier = "Primary"
  }
}

# RDS Read Replicas
module "rds_read_replica_west" {
  source = "./modules/rds"
  
  providers = {
    aws = aws.secondary_west
  }
  
  identifier = "${var.project_name}-${var.environment}-replica-west"
  
  engine         = var.database_engine
  engine_version = var.database_engine_version
  
  instance_class    = var.database_instance_class
  allocated_storage = var.database_allocated_storage
  
  replicate_source_db = "arn:aws:rds:${var.primary_region}:${data.aws_caller_identity.current.account_id}:db:${var.project_name}-${var.environment}-primary"
  
  vpc_security_group_ids = [module.vpc_secondary_west.database_security_group_id]
  db_subnet_group_name   = module.vpc_secondary_west.database_subnet_group_name
  
  storage_encrypted      = true
  backup_retention_period = var.database_backup_retention
  
  tags = {
    Tier = "Replica-West"
  }
}

module "rds_read_replica_eu" {
  source = "./modules/rds"
  
  providers = {
    aws = aws.secondary_eu
  }
  
  identifier = "${var.project_name}-${var.environment}-replica-eu"
  
  engine         = var.database_engine
  engine_version = var.database_engine_version
  
  instance_class    = var.database_instance_class
  allocated_storage = var.database_allocated_storage
  
  replicate_source_db = "arn:aws:rds:${var.primary_region}:${data.aws_caller_identity.current.account_id}:db:${var.project_name}-${var.environment}-primary"
  
  vpc_security_group_ids = [module.vpc_secondary_eu.database_security_group_id]
  db_subnet_group_name   = module.vpc_secondary_eu.database_subnet_group_name
  
  storage_encrypted      = true
  backup_retention_period = var.database_backup_retention
  
  tags = {
    Tier = "Replica-EU"
  }
}

# ElastiCache Redis Cluster
module "redis_primary" {
  source = "./modules/redis"
  
  providers = {
    aws = aws
  }
  
  cluster_id           = "${var.project_name}-${var.environment}-redis"
  engine               = "redis"
  engine_version       = var.redis_version
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_nodes
  parameter_group_name = "default.redis7"
  
  subnet_group_name   = module.vpc_primary.redis_subnet_group_name
  security_group_ids  = [module.vpc_primary.redis_security_group_id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token
  
  tags = {
    Tier = "Primary"
  }
}

# Application Load Balancers
module "alb_primary" {
  source = "./modules/alb"
  
  providers = {
    aws = aws
  }
  
  name               = "${var.project_name}-${var.environment}-alb-primary"
  internal           = false
  load_balancer_type = "application"
  
  vpc_id          = module.vpc_primary.vpc_id
  subnets         = module.vpc_primary.public_subnets
  security_groups = [module.vpc_primary.alb_security_group_id]
  
  tags = {
    Tier = "Primary"
  }
}

module "alb_secondary_west" {
  source = "./modules/alb"
  
  providers = {
    aws = aws.secondary_west
  }
  
  name               = "${var.project_name}-${var.environment}-alb-west"
  internal           = false
  load_balancer_type = "application"
  
  vpc_id          = module.vpc_secondary_west.vpc_id
  subnets         = module.vpc_secondary_west.public_subnets
  security_groups = [module.vpc_secondary_west.alb_security_group_id]
  
  tags = {
    Tier = "Secondary-West"
  }
}

module "alb_secondary_eu" {
  source = "./modules/alb"
  
  providers = {
    aws = aws.secondary_eu
  }
  
  name               = "${var.project_name}-${var.environment}-alb-eu"
  internal           = false
  load_balancer_type = "application"
  
  vpc_id          = module.vpc_secondary_eu.vpc_id
  subnets         = module.vpc_secondary_eu.public_subnets
  security_groups = [module.vpc_secondary_eu.alb_security_group_id]
  
  tags = {
    Tier = "Secondary-EU"
  }
}

# Route53 DNS Records
module "route53" {
  source = "./modules/route53"
  
  providers = {
    aws = aws
  }
  
  domain_name = var.domain_name
  
  primary_alb_dns_name    = module.alb_primary.alb_dns_name
  primary_alb_zone_id    = module.alb_primary.alb_zone_id
  
  secondary_west_alb_dns_name = module.alb_secondary_west.alb_dns_name
  secondary_west_alb_zone_id = module.alb_secondary_west.alb_zone_id
  
  secondary_eu_alb_dns_name = module.alb_secondary_eu.alb_dns_name
  secondary_eu_alb_zone_id = module.alb_secondary_eu.alb_zone_id
  
  health_check_path = "/health"
  
  traffic_policy = {
    primary_weight    = 70
    secondary_west_weight = 20
    secondary_eu_weight = 10
  }
}

# CloudFront Distribution
module "cloudfront" {
  source = "./modules/cloudfront"
  
  providers = {
    aws = aws
  }
  
  domain_name = var.domain_name
  origin_domain_name = module.route53.primary_record_fqdn
  
  enabled = true
  price_class = "PriceClass_100"
  
  default_cache_behavior = {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "origin"
    forwarded_values = {
      query_string = false
      cookies = {
        forward = "none"
      }
    }
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  
  tags = {
    Project = "KALDRIX"
    Environment = var.environment
  }
}

# WAF Web ACL
module "waf" {
  source = "./modules/waf"
  
  providers = {
    aws = aws
  }
  
  name = "${var.project_name}-${var.environment}-waf"
  
  scope = "CLOUDFRONT"
  
  alb_arn = module.cloudfront.cloudfront_arn
  
  rules = [
    {
      name     = "AWS-AWSManagedRulesCommonRuleSet"
      priority = 1
    },
    {
      name     = "AWS-AWSManagedRulesSQLiRuleSet"
      priority = 2
    },
    {
      name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
      priority = 3
    }
  ]
  
  tags = {
    Project = "KALDRIX"
    Environment = var.environment
  }
}

# CloudWatch Alarms
module "cloudwatch_alarms" {
  source = "./modules/cloudwatch"
  
  providers = {
    aws = aws
  }
  
  alarm_prefix = "${var.project_name}-${var.environment}"
  
  sns_topic_arn = module.sns_notifications.sns_topic_arn
  
  alarms = {
    cpu_utilization = {
      metric_name = "CPUUtilization"
      namespace   = "AWS/EC2"
      threshold   = 80
      comparison  = "GreaterThanThreshold"
    }
    
    memory_utilization = {
      metric_name = "MemoryUtilization"
      namespace   = "System/Linux"
      threshold   = 80
      comparison  = "GreaterThanThreshold"
    }
    
    database_connections = {
      metric_name = "DatabaseConnections"
      namespace   = "AWS/RDS"
      threshold   = 50
      comparison  = "GreaterThanThreshold"
    }
    
    api_errors = {
      metric_name = "HTTP5xxError"
      namespace   = "AWS/ApplicationELB"
      threshold   = 5
      comparison  = "GreaterThanThreshold"
    }
  }
}

# SNS Notifications
module "sns_notifications" {
  source = "./modules/sns"
  
  providers = {
    aws = aws
  }
  
  name = "${var.project_name}-${var.environment}-notifications"
  
  display_name = "KALDRIX Alerts"
  
  subscriptions = var.sns_subscriptions
  
  tags = {
    Project = "KALDRIX"
    Environment = var.environment
  }
}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description = "KMS key for KALDRIX encryption"
  
  enable_key_rotation = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Project = "KALDRIX"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment}-key"
  target_key_id = aws_kms_key.main.key_id
}

# S3 Buckets
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project_name}-${var.environment}-terraform-state"
  
  versioning {
    enabled = true
  }
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.main.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
  
  lifecycle_rule {
    id      = "cleanup"
    enabled = true
    
    expiration {
      days = 365
    }
    
    noncurrent_version_expiration {
      days = 30
    }
  }
  
  tags = {
    Project = "KALDRIX"
    Environment = var.environment
  }
}

resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-${var.environment}-logs"
  
  versioning {
    enabled = true
  }
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.main.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
  
  lifecycle_rule {
    id      = "cleanup"
    enabled = true
    
    expiration {
      days = 90
    }
  }
  
  tags = {
    Project = "KALDRIX"
    Environment = var.environment
  }
}

# DynamoDB Table for Terraform Lock
resource "aws_dynamodb_table" "terraform_lock" {
  name         = "${var.project_name}-${var.environment}-terraform-lock"
  billing_mode = "PAY_PER_REQUEST"
  
  hash_key = "LockID"
  
  attribute {
    name = "LockID"
    type = "S"
  }
  
  server_side_encryption {
    enabled = true
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = {
    Project = "KALDRIX"
    Environment = var.environment
  }
}

# Outputs
output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "primary_alb_dns_name" {
  description = "Primary ALB DNS name"
  value       = module.alb_primary.alb_dns_name
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = module.cloudfront.cloudfront_domain_name
}

output "route53_primary_record" {
  description = "Route53 primary record"
  value       = module.route53.primary_record_fqdn
}

output "database_endpoint" {
  description = "Primary database endpoint"
  value       = module.rds_primary.db_instance_endpoint
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.redis_primary.redis_endpoint
}