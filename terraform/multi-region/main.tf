# KALDRIX Multi-Region Infrastructure
# Main Terraform configuration for deploying KALDRIX across multiple AWS regions

# Global Networking Module - Route53, CloudFront, Global Accelerator
module "global_networking" {
  source = "./modules/global-networking"

  project_name    = var.project_name
  domain_name     = var.domain_name
  regions         = var.regions
  enable_cdn      = var.enable_cdn
  enable_accelerator = var.enable_accelerator
  tags            = var.tags
}

# Global Database Module - Cross-region RDS replication and Redis clustering
module "global_database" {
  source = "./modules/global-database"

  project_name        = var.project_name
  regions             = var.regions
  primary_region      = var.primary_region
  secondary_regions   = var.secondary_regions
  database_config    = var.database_config
  redis_config        = var.redis_config
  enable_replication  = var.enable_replication
  tags                = var.tags

  depends_on = [module.global_networking]
}

# Regional Infrastructure - Deploy KALDRIX in each region
module "regional_infra" {
  for_each = { for idx, region in var.regions : region => {
    region     = region
    is_primary = region == var.primary_region
    index      = idx
  }}

  source = "../"

  providers = {
    aws = aws.region[each.value.region]
  }

  environment        = var.environment
  project_name      = var.project_name
  aws_region        = each.value.region
  vpc_cidr          = var.regional_configs[each.value.region].vpc_cidr
  availability_zones = var.regional_configs[each.value.region].availability_zones
  private_subnets   = var.regional_configs[each.value.region].private_subnets
  public_subnets    = var.regional_configs[each.value.region].public_subnets
  database_subnets  = var.regional_configs[each.value.region].database_subnets
  eks_cluster_version = var.eks_cluster_version
  eks_node_groups   = var.eks_node_groups
  domain_name       = var.domain_name
  enable_vault      = var.enable_vault
  vault_address     = var.vault_address
  enable_monitoring = var.enable_monitoring
  enable_backup     = var.enable_backup
  backup_retention_days = var.backup_retention_days
  enable_security_compliance = var.enable_security_compliance
  enable_cost_optimization = var.enable_cost_optimization
  tags              = merge(var.tags, {
    "kaldrix.io/region" = each.value.region
    "kaldrix.io/role"   = each.value.is_primary ? "primary" : "secondary"
  })

  # Regional database configuration
  rds_instance_class = each.value.is_primary ? 
    var.database_config.primary_instance_class : 
    var.database_config.secondary_instance_class
  
  redis_node_type = each.value.is_primary ? 
    var.redis_config.primary_node_type : 
    var.redis_config.secondary_node_type

  depends_on = [
    module.global_networking,
    module.global_database
  ]
}

# Global Load Balancing Module - Application Load Balancer across regions
module "global_load_balancing" {
  source = "./modules/global-load-balancing"

  project_name    = var.project_name
  regions         = var.regions
  primary_region  = var.primary_region
  domain_name     = var.domain_name
  alb_arns        = { for region, infra in module.regional_infra : region => infra.alb_arn }
  alb_dns_names   = { for region, infra in module.regional_infra : region => infra.alb_dns_name }
  health_check_config = var.health_check_config
  routing_config  = var.routing_config
  tags            = var.tags

  depends_on = [module.regional_infra]
}

# Global Monitoring Module - Cross-region monitoring and alerting
module "global_monitoring" {
  source = "./modules/global-monitoring"

  project_name    = var.project_name
  regions         = var.regions
  primary_region  = var.primary_region
  enable_monitoring = var.enable_monitoring
  monitoring_config = var.monitoring_config
  alerting_config = var.alerting_config
  sns_topic_arn   = module.global_monitoring.sns_topic_arn
  tags            = var.tags

  depends_on = [module.regional_infra, module.global_load_balancing]
}

# Disaster Recovery Module - Automated failover and recovery
module "disaster_recovery" {
  source = "./modules/disaster-recovery"

  project_name      = var.project_name
  regions           = var.regions
  primary_region    = var.primary_region
  secondary_regions = var.secondary_regions
  enable_failover   = var.enable_failover
  failover_config   = var.failover_config
  backup_config     = var.backup_config
  tags              = var.tags

  depends_on = [
    module.regional_infra,
    module.global_load_balancing,
    module.global_monitoring
  ]
}

# Global Resources - S3 bucket for cross-region artifacts
resource "aws_s3_bucket" "global_artifacts" {
  provider = aws.primary

  bucket = "${var.project_name}-global-artifacts-${var.environment}"
  
  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-artifacts"
  })
}

resource "aws_s3_bucket_versioning" "global_artifacts" {
  provider = aws.primary
  bucket   = aws_s3_bucket.global_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "global_artifacts" {
  provider = aws.primary
  bucket   = aws_s3_bucket.global_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "global_artifacts" {
  provider = aws.primary
  bucket   = aws_s3_bucket.global_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch Logs for cross-region aggregation
resource "aws_cloudwatch_log_group" "global_logs" {
  provider = aws.primary

  name              = "/kaldrix/global/${var.environment}"
  retention_in_days = 30

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-logs"
  })
}

# Global KMS Key for cross-region encryption
resource "aws_kms_key" "global_key" {
  provider = aws.primary

  description = "KMS key for KALDRIX global infrastructure encryption"
  enable_key_rotation = true

  tags = merge(var.tags, {
    "kaldrix.io/purpose" = "global-encryption"
  })
}

resource "aws_kms_alias" "global_key" {
  provider = aws.primary
  name          = "alias/kaldrix-global-${var.environment}"
  target_key_id = aws_kms_key.global_key.key_id
}

# Outputs for multi-region infrastructure
output "global_infrastructure" {
  description = "Global infrastructure summary"
  value = {
    networking = {
      hosted_zone_id = module.global_networking.hosted_zone_id
      cloudfront_distribution_id = module.global_networking.cloudfront_distribution_id
      global_accelerator_arn = module.global_networking.global_accelerator_arn
    }
    database = {
      primary_endpoint = module.global_database.primary_endpoint
      secondary_endpoints = module.global_database.secondary_endpoints
      redis_cluster_endpoint = module.global_database.redis_cluster_endpoint
    }
    load_balancing = {
      global_alb_arn = module.global_load_balancing.global_alb_arn
      global_alb_dns = module.global_load_balancing.global_alb_dns
    }
    monitoring = {
      global_dashboard_url = module.global_monitoring.global_dashboard_url
      sns_topic_arn = module.global_monitoring.sns_topic_arn
    }
    disaster_recovery = {
      failover_arn = module.disaster_recovery.failover_arn
      backup_bucket = aws_s3_bucket.global_artifacts.id
    }
    regions = {
      for region, infra in module.regional_infra : region => {
        vpc_id = infra.vpc_id
        eks_cluster_id = infra.eks_cluster_id
        alb_dns_name = infra.alb_dns_name
        database_endpoint = infra.database_endpoint
      }
    }
  }
}

output "regional_endpoints" {
  description = "Regional application endpoints"
  value = {
    for region, infra in module.regional_infra : region => {
      application_url = "https://${region == var.primary_region ? "" : region "."}${var.domain_name}"
      api_url = "https://api.${region == var.primary_region ? "" : region "."}${var.domain_name}"
      monitoring_url = "https://monitoring.${region == var.primary_region ? "" : region "."}${var.domain_name}"
    }
  }
}