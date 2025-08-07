# KALDRIX Multi-Region Infrastructure Providers

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
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
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
}

# Configure AWS provider for primary region
provider "aws" {
  alias  = "primary"
  region = var.primary_region
  
  default_tags {
    tags = var.tags
  }
}

# Configure AWS providers for each region
provider "aws" {
  alias = "region"
  # Region will be set dynamically for each module
}

# Configure Vault provider
provider "vault" {
  address = var.vault_address
}

# Configure Kubernetes provider for primary region
provider "kubernetes" {
  alias                  = "primary"
  host                   = module.regional_infra[var.primary_region].eks_cluster_endpoint
  cluster_ca_certificate = base64decode(module.regional_infra[var.primary_region].eks_cluster_ca_certificate)
  token                  = data.aws_eks_cluster_auth.primary.token
}

provider "kubernetes" {
  alias = "region"
  # Configuration will be set dynamically for each region
}

# Configure Helm provider for primary region
provider "helm" {
  alias  = "primary"
  kubernetes {
    host                   = module.regional_infra[var.primary_region].eks_cluster_endpoint
    cluster_ca_certificate = base64decode(module.regional_infra[var.primary_region].eks_cluster_ca_certificate)
    token                  = data.aws_eks_cluster_auth.primary.token
  }
}

provider "helm" {
  alias = "region"
  # Configuration will be set dynamically for each region
}

# Data sources for EKS cluster authentication
data "aws_eks_cluster_auth" "primary" {
  provider = aws.primary
  name     = module.regional_infra[var.primary_region].eks_cluster_id
}

# Random resources for unique naming
resource "random_pet" "suffix" {
  length = 2
}

resource "random_string" "unique_id" {
  length  = 8
  special = false
  upper   = false
}