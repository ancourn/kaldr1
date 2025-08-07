output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.this.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.this.cidr_block
}

output "private_subnets" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnets" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "database_subnets" {
  description = "List of database subnet IDs"
  value       = aws_subnet.database[*].id
}

output "internet_gateway_id" {
  description = "Internet gateway ID"
  value       = aws_internet_gateway.this.id
}

output "nat_gateway_ids" {
  description = "NAT gateway IDs"
  value       = aws_nat_gateway.this[*].id
}

output "eip_allocation_ids" {
  description = "EIP allocation IDs"
  value       = aws_eip.nat[*].id
}

output "route_table_ids" {
  description = "Route table IDs"
  value = {
    private  = aws_route_table.private[*].id
    public   = [aws_route_table.public.id]
    database = aws_route_table.database[*].id
  }
}

output "vpc_endpoint_ids" {
  description = "VPC endpoint IDs"
  value = {
    s3            = aws_vpc_endpoint.s3.id
    dynamodb      = aws_vpc_endpoint.dynamodb.id
    ecr_api       = aws_vpc_endpoint.ecr_api.id
    ecr_dkr       = aws_vpc_endpoint.ecr_dkr.id
    logs          = aws_vpc_endpoint.logs.id
    monitoring    = aws_vpc_endpoint.monitoring.id
    secretsmanager = aws_vpc_endpoint.secretsmanager.id
    ssm           = aws_vpc_endpoint.ssm.id
    kms           = aws_vpc_endpoint.kms.id
  }
}

output "network_acl_ids" {
  description = "Network ACL IDs"
  value = {
    private  = aws_network_acl.private.id
    public   = aws_network_acl.public.id
    database = aws_network_acl.database.id
  }
}

output "vpc_endpoint_security_group_id" {
  description = "VPC endpoint security group ID"
  value       = aws_security_group.vpc_endpoint.id
}