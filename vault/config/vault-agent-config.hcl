# KALDRIX Vault Agent Configuration
# This configuration enables automatic authentication and secret management for KALDRIX services

auto_auth {
    method "kubernetes" {
        mount_path = "auth/kubernetes"
        config = {
            role = "kaldrix-production"
        }
    }
    
    method "kubernetes" {
        mount_path = "auth/kubernetes"
        config = {
            role = "kaldrix-staging"
        }
    }
    
    method "kubernetes" {
        mount_path = "auth/kubernetes"
        config = {
            role = "kaldrix-development"
        }
    }
    
    sink "file" {
        config = {
            path = "/home/vault/.vault-token"
        }
    }
    
    sink "file" {
        config = {
            path = "/vault/secrets/.vault-token"
        }
    }
}

cache {
    use_auto_auth_token = true
}

listener "tcp" {
    address = "127.0.0.1:8100"
    tls_disable = true
}

template {
    contents = <<EOT
{{- with secret "kv/data/kaldrix/production/database" }}
export DB_USERNAME="{{ .Data.data.username }}"
export DB_PASSWORD="{{ .Data.data.password }}"
export DB_HOST="{{ .Data.data.host }}"
export DB_PORT="{{ .Data.data.port }}"
export DB_DATABASE="{{ .Data.data.database }}"
{{- end }}
EOT
    destination = "/vault/secrets/database.env"
    perms = "0640"
}

template {
    contents = <<EOT
{{- with secret "kv/data/kaldrix/production/redis" }}
export REDIS_PASSWORD="{{ .Data.data.password }}"
export REDIS_HOST="{{ .Data.data.host }}"
export REDIS_PORT="{{ .Data.data.port }}"
{{- end }}
EOT
    destination = "/vault/secrets/redis.env"
    perms = "0640"
}

template {
    contents = <<EOT
{{- with secret "kv/data/kaldrix/production/jwt" }}
export JWT_SECRET="{{ .Data.data.secret }}"
export JWT_ALGORITHM="{{ .Data.data.algorithm }}"
export JWT_EXPIRATION="{{ .Data.data.expiration }}"
{{- end }}
EOT
    destination = "/vault/secrets/jwt.env"
    perms = "0640"
}

template {
    contents = <<EOT
{
    "database": {
        "username": "{{ with secret \"kv/data/kaldrix/production/database\" }}{{ .Data.data.username }}{{ end }}",
        "password": "{{ with secret \"kv/data/kaldrix/production/database\" }}{{ .Data.data.password }}{{ end }}",
        "host": "{{ with secret \"kv/data/kaldrix/production/database\" }}{{ .Data.data.host }}{{ end }}",
        "port": "{{ with secret \"kv/data/kaldrix/production/database\" }}{{ .Data.data.port }}{{ end }}",
        "database": "{{ with secret \"kv/data/kaldrix/production/database\" }}{{ .Data.data.database }}{{ end }}"
    },
    "redis": {
        "password": "{{ with secret \"kv/data/kaldrix/production/redis\" }}{{ .Data.data.password }}{{ end }}",
        "host": "{{ with secret \"kv/data/kaldrix/production/redis\" }}{{ .Data.data.host }}{{ end }}",
        "port": "{{ with secret \"kv/data/kaldrix/production/redis\" }}{{ .Data.data.port }}{{ end }}"
    },
    "jwt": {
        "secret": "{{ with secret \"kv/data/kaldrix/production/jwt\" }}{{ .Data.data.secret }}{{ end }}",
        "algorithm": "{{ with secret \"kv/data/kaldrix/production/jwt\" }}{{ .Data.data.algorithm }}{{ end }}",
        "expiration": "{{ with secret \"kv/data/kaldrix/production/jwt\" }}{{ .Data.data.expiration }}{{ end }}"
    }
}
EOT
    destination = "/vault/secrets/config.json"
    perms = "0640"
}

exit_after_auth = false
pid_file = "/var/run/vault-agent.pid"