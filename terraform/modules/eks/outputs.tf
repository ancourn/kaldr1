output "cluster_id" {
  description = "EKS cluster ID"
  value       = aws_eks_cluster.this.id
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.this.name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.this.endpoint
}

output "cluster_certificate_authority_data" {
  description = "EKS cluster certificate authority data"
  value       = aws_eks_cluster.this.certificate_authority[0].data
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = aws_eks_cluster.this.arn
}

output "cluster_identity_oidc_issuer" {
  description = "EKS cluster OIDC issuer"
  value       = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

output "cluster_identity_oidc_issuer_arn" {
  description = "EKS cluster OIDC issuer ARN"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "eks_oidc_provider_arn" {
  description = "EKS OIDC provider ARN"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "node_group_arns" {
  description = "EKS node group ARNs"
  value = {
    for key, node_group in aws_eks_node_group.this : key => node_group.arn
  }
}

output "node_group_role_arns" {
  description = "EKS node group role ARNs"
  value = {
    for key, node_group in aws_eks_node_group.this : key => aws_iam_role.eks_node_group[key].arn
  }
}

output "node_group_ids" {
  description = "EKS node group IDs"
  value = {
    for key, node_group in aws_eks_node_group.this : key => node_group.id
  }
}

output "eks_addon_arns" {
  description = "EKS add-on ARNs"
  value = {
    vpc_cni            = aws_eks_addon.vpc_cni.arn
    coredns            = aws_eks_addon.coredns.arn
    kube_proxy         = aws_eks_addon.kube_proxy.arn
    aws_ebs_csi_driver  = aws_eks_addon.aws_ebs_csi_driver.arn
    aws_efs_csi_driver  = aws_eks_addon.aws_efs_csi_driver.arn
    metrics_server     = aws_eks_addon.metrics_server.arn
    cluster_autoscaler = aws_eks_addon.cluster_autoscaler.arn
  }
}

output "fargate_profile_arn" {
  description = "EKS Fargate profile ARN"
  value       = aws_eks_fargate_profile.default.arn
}

output "fargate_profile_id" {
  description = "EKS Fargate profile ID"
  value       = aws_eks_fargate_profile.default.id
}

output "security_group_id" {
  description = "EKS node security group ID"
  value       = aws_security_group.eks_node.id
}

output "key_pair_name" {
  description = "EKS key pair name"
  value       = aws_key_pair.eks.key_name
}