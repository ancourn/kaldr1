# KALDRIX Infrastructure as Code
# Main Terraform configuration for provisioning KALDRIX blockchain platform infrastructure

# VPC Module - Network foundation
module "vpc" {
  source = "./modules/vpc"

  environment        = var.environment
  project_name      = var.project_name
  vpc_cidr          = var.vpc_cidr
  availability_zones = var.availability_zones
  private_subnets   = var.private_subnets
  public_subnets    = var.public_subnets
  database_subnets  = var.database_subnets
  tags              = var.tags
}

# Security Module - IAM roles, policies, and security configurations
module "security" {
  source = "./modules/security"

  environment               = var.environment
  project_name             = var.project_name
  vpc_id                   = module.vpc.vpc_id
  private_subnets          = module.vpc.private_subnets
  public_subnets           = module.vpc.public_subnets
  eks_cluster_id           = module.eks.cluster_id
  eks_oidc_provider_arn    = module.eks.eks_oidc_provider_arn
  enable_security_compliance = var.enable_security_compliance
  tags                     = var.tags

  depends_on = [module.vpc, module.eks]
}

# IAM Module - Identity and Access Management
module "iam" {
  source = "./modules/iam"

  environment              = var.environment
  project_name            = var.project_name
  vpc_id                  = module.vpc.vpc_id
  eks_cluster_id          = module.eks.cluster_id
  eks_oidc_provider_arn   = module.eks.eks_oidc_provider_arn
  enable_vault            = var.enable_vault
  vault_address           = var.vault_address
  tags                    = var.tags

  depends_on = [module.vpc, module.eks]
}

# EKS Module - Kubernetes cluster
module "eks" {
  source = "./modules/eks"

  environment              = var.environment
  project_name            = var.project_name
  vpc_id                  = module.vpc.vpc_id
  private_subnets         = module.vpc.private_subnets
  public_subnets          = module.vpc.public_subnets
  eks_cluster_version     = var.eks_cluster_version
  eks_node_groups         = var.eks_node_groups
  eks_role_arn            = module.iam.eks_role_arn
  node_group_role_arns    = module.iam.node_group_role_arns
  enable_monitoring       = var.enable_monitoring
  tags                    = var.tags

  depends_on = [module.vpc, module.iam]
}

# RDS Module - PostgreSQL database
module "rds" {
  source = "./modules/rds"

  environment        = var.environment
  project_name      = var.project_name
  vpc_id            = module.vpc.vpc_id
  database_subnets  = module.vpc.database_subnets
  security_group_id = module.security.database_security_group_id
  tags              = var.tags

  depends_on = [module.vpc, module.security]
}

# Redis Module - Redis cluster
module "redis" {
  source = "./modules/redis"

  environment        = var.environment
  project_name      = var.project_name
  vpc_id            = module.vpc.vpc_id
  private_subnets   = module.vpc.private_subnets
  security_group_id = module.security.redis_security_group_id
  tags              = var.tags

  depends_on = [module.vpc, module.security]
}

# S3 Module - Object storage
module "s3" {
  source = "./modules/s3"

  environment      = var.environment
  project_name    = var.project_name
  kms_key_arn     = module.security.kms_key_arn
  enable_backup   = var.enable_backup
  tags            = var.tags

  depends_on = [module.security]
}

# Monitoring Module - CloudWatch, Prometheus, Grafana
module "monitoring" {
  source = "./modules/monitoring"

  environment        = var.environment
  project_name      = var.project_name
  vpc_id            = module.vpc.vpc_id
  private_subnets   = module.vpc.private_subnets
  eks_cluster_id    = module.eks.cluster_id
  enable_monitoring = var.enable_monitoring
  security_group_id = module.security.monitoring_security_group_id
  kms_key_arn       = module.security.kms_key_arn
  sns_topic_arn     = module.monitoring.sns_topic_arn
  tags              = var.tags

  depends_on = [module.vpc, module.eks, module.security]
}

# Networking Module - ALB, Route53, etc.
module "networking" {
  source = "./modules/networking"

  environment        = var.environment
  project_name      = var.project_name
  vpc_id            = module.vpc.vpc_id
  public_subnets    = module.vpc.public_subnets
  private_subnets   = module.vpc.private_subnets
  eks_cluster_id    = module.eks.cluster_id
  domain_name       = var.domain_name
  security_group_id = module.security.alb_security_group_id
  tags              = var.tags

  depends_on = [module.vpc, module.eks, module.security]
}

# Storage Module - ECR, Lambda, Backup
module "storage" {
  source = "./modules/storage"

  environment            = var.environment
  project_name          = var.project_name
  vpc_id                = module.vpc.vpc_id
  private_subnets       = module.vpc.private_subnets
  s3_bucket_name       = module.s3.s3_bucket_name
  kms_key_arn           = module.security.kms_key_arn
  enable_backup         = var.enable_backup
  backup_retention_days = var.backup_retention_days
  tags                  = var.tags

  depends_on = [module.vpc, module.s3, module.security]
}

# Cost Optimization Module - Cost Explorer, Reserved Instances, etc.
module "cost_optimization" {
  source = "./modules/cost_optimization"

  environment            = var.environment
  project_name          = var.project_name
  enable_cost_optimization = var.enable_cost_optimization
  tags                  = var.tags

  depends_on = [module.eks, module.rds, module.redis]
}

# Kubernetes Resources - Deploy KALDRIX application
resource "kubernetes_namespace" "kaldrix" {
  metadata {
    name = "kaldrix"
    labels = {
      name = "kaldrix"
      app  = "kaldrix"
    }
  }

  depends_on = [module.eks]
}

resource "kubernetes_service_account" "vault-auth" {
  metadata {
    name      = "vault-auth"
    namespace = kubernetes_namespace.kaldrix.metadata[0].name
    annotations = {
      "eks.amazonaws.com/role-arn" = module.iam.vault_auth_role_arn
    }
  }

  depends_on = [module.iam, kubernetes_namespace.kaldrix]
}

resource "kubernetes_config_map" "aws-auth" {
  metadata {
    name      = "aws-auth"
    namespace = "kube-system"
  }

  data = {
    mapRoles = yamlencode([
      {
        rolearn  = module.iam.node_group_role_arns["main"]
        username = "system:node:{{EC2PrivateDNSName}}"
        groups = [
          "system:bootstrappers",
          "system:nodes"
        ]
      },
      {
        rolearn  = module.iam.node_group_role_arns["blockchain"]
        username = "system:node:{{EC2PrivateDNSName}}"
        groups = [
          "system:bootstrappers",
          "system:nodes"
        ]
      },
      {
        rolearn  = module.iam.node_group_role_arns["monitoring"]
        username = "system:node:{{EC2PrivateDNSName}}"
        groups = [
          "system:bootstrappers",
          "system:nodes"
        ]
      }
    ])
  }

  depends_on = [module.iam, module.eks]
}

# Helm Release - Deploy KALDRIX application
resource "helm_release" "kaldrix" {
  name       = "kaldrix"
  repository = "https://kaldrix.github.io/helm-charts"
  chart      = "kaldrix"
  namespace  = kubernetes_namespace.kaldrix.metadata[0].name
  version    = "1.0.0"

  set {
    name  = "global.environment"
    value = var.environment
  }

  set {
    name  = "global.vault.enabled"
    value = var.enable_vault
  }

  set {
    name  = "global.vault.address"
    value = var.vault_address
  }

  set {
    name  = "global.vault.role"
    value = "kaldrix-${var.environment}"
  }

  set {
    name  = "postgresql.enabled"
    value = true
  }

  set {
    name  = "postgresql.auth.postgresPassword"
    value = module.rds.db_password
  }

  set {
    name  = "postgresql.auth.database"
    value = "kaldrix_${var.environment}"
  }

  set {
    name  = "postgresql.auth.username"
    value = "kaldrix_${var.environment}"
  }

  set {
    name  = "redis.enabled"
    value = true
  }

  set {
    name  = "redis.auth.enabled"
    value = true
  }

  set {
    name  = "redis.auth.password"
    value = module.redis.redis_password
  }

  set {
    name  = "ingress.enabled"
    value = true
  }

  set {
    name  = "ingress.className"
    value = "alb"
  }

  set {
    name  = "ingress.hosts[0].host"
    value = "${var.environment == "production" ? "" : var.environment "."}${var.domain_name}"
  }

  set {
    name  = "ingress.hosts[0].paths[0].path"
    value = "/"
  }

  set {
    name  = "ingress.hosts[0].paths[0].pathType"
    value = "Prefix"
  }

  set {
    name  = "ingress.tls[0].secretName"
    value = "kaldrix-tls"
  }

  set {
    name  = "ingress.tls[0].hosts[0]"
    value = "${var.environment == "production" ? "" : var.environment "."}${var.domain_name}"
  }

  set {
    name  = "monitoring.enabled"
    value = var.enable_monitoring
  }

  set {
    name  = "monitoring.prometheus.enabled"
    value = var.enable_monitoring
  }

  set {
    name  = "monitoring.grafana.enabled"
    value = var.enable_monitoring
  }

  set {
    name  = "monitoring.grafana.adminPassword"
    value = module.security.grafana_admin_password
  }

  depends_on = [
    module.eks,
    module.iam,
    module.rds,
    module.redis,
    module.networking,
    kubernetes_namespace.kaldrix,
    kubernetes_service_account.vault-auth
  ]
}

# Vault Integration - Store infrastructure secrets in Vault
resource "vault_kv_secret_v2" "kaldrix_secrets" {
  mount = "kv"
  name  = "kaldrix/${var.environment}/infrastructure"

  data_json = jsonencode({
    database = {
      host     = module.rds.db_instance_endpoint
      port     = module.rds.db_instance_port
      username = "kaldrix_${var.environment}"
      password = module.rds.db_password
      database = "kaldrix_${var.environment}"
    }
    redis = {
      host     = module.redis.redis_cluster_endpoint
      port     = module.redis.redis_cluster_port
      password = module.redis.redis_password
    }
    eks = {
      cluster_id     = module.eks.cluster_id
      cluster_endpoint = module.eks.cluster_endpoint
      region         = var.aws_region
    }
    vpc = {
      vpc_id           = module.vpc.vpc_id
      private_subnets  = module.vpc.private_subnets
      public_subnets   = module.vpc.public_subnets
      database_subnets = module.vpc.database_subnets
    }
    monitoring = {
      cloudwatch_workspace_id = module.monitoring.cloudwatch_workspace_id
      prometheus_workspace_id = module.monitoring.prometheus_workspace_id
      grafana_workspace_id    = module.monitoring.grafana_workspace_id
    }
    storage = {
      s3_bucket_name = module.s3.s3_bucket_name
      ecr_repository_arns = module.storage.ecr_repository_arns
    }
    networking = {
      alb_dns_name = module.networking.alb_dns_name
      alb_zone_id  = module.networking.alb_zone_id
    }
  })

  depends_on = [
    module.rds,
    module.redis,
    module.eks,
    module.vpc,
    module.monitoring,
    module.s3,
    module.storage,
    module.networking
  ]
}

# Outputs for easy access to infrastructure details
output "infrastructure_summary" {
  description = "Summary of provisioned infrastructure"
  value = {
    vpc = {
      id           = module.vpc.vpc_id
      cidr         = module.vpc.vpc_cidr_block
      private_subnets = module.vpc.private_subnets
      public_subnets  = module.vpc.public_subnets
      database_subnets = module.vpc.database_subnets
    }
    eks = {
      cluster_id     = module.eks.cluster_id
      endpoint       = module.eks.cluster_endpoint
      node_groups    = module.eks.node_group_arns
    }
    database = {
      endpoint = module.rds.db_instance_endpoint
      port     = module.rds.db_instance_port
      instance = module.rds.db_instance_id
    }
    redis = {
      endpoint = module.redis.redis_cluster_endpoint
      port     = module.redis.redis_cluster_port
    }
    storage = {
      s3_bucket = module.s3.s3_bucket_name
      ecr_repos = module.storage.ecr_repository_arns
    }
    monitoring = {
      cloudwatch = module.monitoring.cloudwatch_workspace_id
      prometheus = module.monitoring.prometheus_workspace_id
      grafana    = module.monitoring.grafana_workspace_id
    }
    networking = {
      alb_dns = module.networking.alb_dns_name
      alb_zone = module.networking.alb_zone_id
    }
    vault = {
      address = var.vault_address
      secrets = vault_kv_secret_v2.kaldrix_secrets.path
    }
  }
}