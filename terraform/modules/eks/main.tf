# EKS Module - Kubernetes cluster for KALDRIX

resource "aws_iam_role" "eks_cluster" {
  name = "${var.project_name}-${var.environment}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-eks-cluster-role"
    },
    var.tags
  )
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_service_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSServicePolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_eks_cluster" "this" {
  name     = "${var.project_name}-${var.environment}-eks"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.eks_cluster_version

  vpc_config {
    subnet_ids = concat(var.private_subnets, var.public_subnets)
    endpoint_public_access  = true
    endpoint_private_access = true
    public_access_cidrs     = ["0.0.0.0/0"]
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_service_policy
  ]

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-eks"
    },
    var.tags
  )
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

data "tls_certificate" "eks" {
  url = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

resource "aws_iam_role" "eks_node_group" {
  for_each = var.eks_node_groups

  name = "${var.project_name}-${var.environment}-eks-node-group-${each.key}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-eks-node-group-${each.key}-role"
    },
    var.tags
  )
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  for_each = var.eks_node_groups

  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group[each.key].name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  for_each = var.eks_node_groups

  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group[each.key].name
}

resource "aws_iam_role_policy_attachment" "ec2_container_registry_readonly" {
  for_each = var.eks_node_groups

  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group[each.key].name
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs_policy" {
  for_each = var.eks_node_groups

  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
  role       = aws_iam_role.eks_node_group[each.key].name
}

resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  for_each = var.eks_node_groups

  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.eks_node_group[each.key].name
}

resource "aws_eks_node_group" "this" {
  for_each = var.eks_node_groups

  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${var.project_name}-${var.environment}-${each.key}"
  node_role_arn   = aws_iam_role.eks_node_group[each.key].arn
  subnet_ids      = var.private_subnets

  scaling_config {
    desired_size = each.value.desired_size
    max_size     = each.value.max_size
    min_size     = each.value.min_size
  }

  instance_types = [each.value.instance_type]
  capacity_type  = each.value.capacity_type

  disk_size = each.value.disk_size

  update_config {
    max_unavailable = 1
  }

  remote_access {
    ec2_ssh_key               = aws_key_pair.eks.key_name
    source_security_group_ids = [aws_security_group.eks_node.id]
  }

  labels = {
    "eks.amazonaws.com/nodegroup" = "${var.project_name}-${var.environment}-${each.key}"
    "app.kubernetes.io/name"     = "kaldrix"
    "app.kubernetes.io/component" = each.key
    "environment"                = var.environment
  }

  taint {
    key    = "dedicated"
    value  = each.key
    effect = "NO_SCHEDULE"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.ec2_container_registry_readonly,
    aws_iam_role_policy_attachment.cloudwatch_logs_policy,
    aws_iam_role_policy_attachment.ssm_managed_instance_core
  ]

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-eks-node-group-${each.key}"
    },
    var.tags
  )
}

resource "aws_key_pair" "eks" {
  key_name   = "${var.project_name}-${var.environment}-eks-key"
  public_key = file("${path.module}/eks.pub")
}

resource "aws_security_group" "eks_node" {
  name        = "${var.project_name}-${var.environment}-eks-node-sg"
  description = "Security group for EKS worker nodes"
  vpc_id      = data.aws_vpc.eks.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-eks-node-sg"
    },
    var.tags
  )
}

data "aws_vpc" "eks" {
  id = var.vpc_id
}

resource "aws_eks_addon" "vpc_cni" {
  cluster_name = aws_eks_cluster.this.name
  addon_name   = "vpc-cni"
}

resource "aws_eks_addon" "coredns" {
  cluster_name = aws_eks_cluster.this.name
  addon_name   = "coredns"
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name = aws_eks_cluster.this.name
  addon_name   = "kube-proxy"
}

resource "aws_eks_addon" "aws_ebs_csi_driver" {
  cluster_name = aws_eks_cluster.this.name
  addon_name   = "aws-ebs-csi-driver"
}

resource "aws_eks_addon" "aws_efs_csi_driver" {
  cluster_name = aws_eks_cluster.this.name
  addon_name   = "aws-efs-csi-driver"
}

resource "aws_eks_addon" "metrics_server" {
  cluster_name = aws_eks_cluster.this.name
  addon_name   = "metrics-server"
}

resource "aws_eks_addon" "cluster_autoscaler" {
  cluster_name = aws_eks_cluster.this.name
  addon_name   = "cluster-autoscaler"
}

resource "aws_eks_fargate_profile" "default" {
  cluster_name           = aws_eks_cluster.this.name
  fargate_profile_name   = "${var.project_name}-${var.environment}-fargate"
  pod_execution_role_arn = aws_iam_role.eks_fargate.arn
  subnet_ids             = var.private_subnets

  selector {
    match_labels = {
      "eks.amazonaws.com/fargate-profile" = "${var.project_name}-${var.environment}-fargate"
    }
  }

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-fargate-profile"
    },
    var.tags
  )
}

resource "aws_iam_role" "eks_fargate" {
  name = "${var.project_name}-${var.environment}-eks-fargate-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks-fargate-pods.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    {
      Name = "${var.project_name}-${var.environment}-eks-fargate-role"
    },
    var.tags
  )
}

resource "aws_iam_role_policy_attachment" "eks_fargate_pod_execution_role_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
  role       = aws_iam_role.eks_fargate.name
}

resource "aws_eks_access_entry" "cluster_admin" {
  cluster_name  = aws_eks_cluster.this.name
  principal_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
  type          = "STANDARD"

  access_policy {
    policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
    access_scope {
      type = "CLUSTER"
    }
  }
}

resource "aws_eks_access_policy_association" "cluster_admin" {
  cluster_name  = aws_eks_cluster.this.name
  policy_arn   = "arn:aws:iam::aws:policy/AmazonEKSClusterAdminPolicy"
  principal_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
  access_scope {
    type = "CLUSTER"
  }
}