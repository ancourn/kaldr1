use axum::extract::{FromRef, FromRequestParts, TypedHeader};
use axum::http::request::Parts;
use axum::http::StatusCode;
use headers::{authorization::Bearer, Authorization};
use jsonwebtoken::{DecodingKey, Validation, decode, Algorithm, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use anyhow::Result;
use chrono::{Duration, Utc};

/// Authentication configuration
#[derive(Clone)]
pub struct AuthConfig {
    pub jwt_decoding_key: Arc<DecodingKey<'static>>,
    pub jwt_encoding_key: Arc<EncodingKey>,
    pub issuer: String,
    pub audience: String,
    pub token_expiry_hours: u64,
}

impl AuthConfig {
    pub fn new(
        encoding_key: &[u8],
        decoding_key: &[u8],
        issuer: String,
        audience: String,
        token_expiry_hours: u64,
    ) -> Result<Self> {
        let jwt_encoding_key = Arc::new(EncodingKey::from_secret(encoding_key));
        let jwt_decoding_key = Arc::new(DecodingKey::from_secret(decoding_key));
        
        Ok(Self {
            jwt_encoding_key,
            jwt_decoding_key,
            issuer,
            audience,
            token_expiry_hours,
        })
    }

    /// Generate a new JWT token for testing
    pub fn generate_test_token(&self, user_id: &str, scopes: &[&str]) -> Result<String> {
        let now = Utc::now();
        let exp = now + Duration::hours(self.token_expiry_hours as i64);
        
        let claims = Claims {
            sub: user_id.to_string(),
            exp: exp.timestamp() as usize,
            iat: now.timestamp() as usize,
            scope: Some(scopes.join(",")),
            aud: self.audience.clone(),
            iss: self.issuer.clone(),
        };

        let header = Header::default();
        Ok(jsonwebtoken::encode(&header, &claims, &self.jwt_encoding_key)?)
    }
}

impl FromRef<Arc<AuthConfig>> for AuthConfig {
    fn from_ref(cfg: &Arc<AuthConfig>) -> AuthConfig { 
        cfg.as_ref().clone() 
    }
}

/// JWT Claims structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,        // Subject (user ID)
    pub exp: usize,        // Expiration time
    pub iat: usize,        // Issued at
    pub scope: Option<String>, // Scopes/permissions
    pub aud: String,       // Audience
    pub iss: String,       // Issuer
}

impl Claims {
    pub fn new(user_id: String, issuer: String, audience: String) -> Self {
        let now = Utc::now();
        Self {
            sub: user_id,
            exp: (now + Duration::hours(24)).timestamp() as usize,
            iat: now.timestamp() as usize,
            scope: None,
            aud: audience,
            iss: issuer,
        }
    }

    pub fn with_scope(mut self, scope: String) -> Self {
        self.scope = Some(scope);
        self
    }

    pub fn with_expiry(mut self, hours: u64) -> Self {
        let now = Utc::now();
        self.exp = (now + Duration::hours(hours as i64)).timestamp() as usize;
        self
    }

    /// Check if the token is expired
    pub fn is_expired(&self) -> bool {
        let now = Utc::now().timestamp() as usize;
        now > self.exp
    }

    /// Check if the token has a specific scope
    pub fn has_scope(&self, required_scope: &str) -> bool {
        if let Some(scopes) = &self.scope {
            scopes.split(',').any(|s| s.trim() == required_scope)
        } else {
            false
        }
    }

    /// Check if the token has any of the required scopes
    pub fn has_any_scope(&self, required_scopes: &[&str]) -> bool {
        if let Some(scopes) = &self.scope {
            let user_scopes: Vec<&str> = scopes.split(',').map(|s| s.trim()).collect();
            required_scopes.iter().any(|required| user_scopes.contains(required))
        } else {
            false
        }
    }

    /// Get all scopes as a vector
    pub fn get_scopes(&self) -> Vec<String> {
        self.scope.as_ref()
            .map(|s| s.split(',').map(|s| s.trim().to_string()).collect())
            .unwrap_or_default()
    }
}

/// Authenticated user extractor
pub struct AuthenticatedUser(pub Claims);

#[axum::async_trait]
impl<S> FromRequestParts<S> for AuthenticatedUser
where
    Arc<AuthConfig>: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let cfg: Arc<AuthConfig> = Arc::from_ref(state);

        // Extract Authorization header
        let auth_header = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|h| h.to_str().ok())
            .ok_or((StatusCode::UNAUTHORIZED, "Missing Authorization header"))?;

        // Parse Bearer token
        let token = auth_header.strip_prefix("Bearer ")
            .ok_or((StatusCode::UNAUTHORIZED, "Invalid Authorization header format"))?;

        // Validate JWT token
        let claims = validate_jwt_token(token, &cfg)
            .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid or expired token"))?;

        // Check if token is expired
        if claims.is_expired() {
            return Err((StatusCode::UNAUTHORIZED, "Token has expired"));
        }

        Ok(AuthenticatedUser(claims))
    }
}

/// Validate JWT token
pub fn validate_jwt_token(token: &str, auth_config: &AuthConfig) -> Result<Claims> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.set_issuer(&[&auth_config.issuer]);
    validation.set_audience(&[&auth_config.audience]);
    validation.validate_exp = true;

    let token_data = decode::<Claims>(token, &auth_config.jwt_decoding_key, &validation)?;
    Ok(token_data.claims)
}

/// Simple middleware helper to validate scope
pub fn ensure_scope(claims: &Claims, required_scope: &str) -> bool {
    claims.has_scope(required_scope)
}

/// Middleware helper to validate any of multiple scopes
pub fn ensure_any_scope(claims: &Claims, required_scopes: &[&str]) -> bool {
    claims.has_any_scope(required_scopes)
}

/// Role-based access control helper
pub fn ensure_role(claims: &Claims, required_role: &str) -> bool {
    // Roles are encoded in scopes as "role:admin", "role:dev", etc.
    let role_scope = format!("role:{}", required_role);
    claims.has_scope(&role_scope)
}

/// Check if user has admin privileges
pub fn is_admin(claims: &Claims) -> bool {
    ensure_role(claims, "admin")
}

/// Check if user has developer privileges
pub fn is_developer(claims: &Claims) -> bool {
    ensure_role(claims, "dev") || is_admin(claims)
}

/// Check if user has operator privileges
pub fn is_operator(claims: &Claims) -> bool {
    ensure_role(claims, "ops") || is_admin(claims)
}

/// Check if user has auditor privileges
pub fn is_auditor(claims: &Claims) -> bool {
    ensure_role(claims, "audit") || is_admin(claims)
}

/// Permission scope definitions
pub mod scopes {
    pub const QUERY_READ: &str = "query:read";
    pub const ANALYSIS_READ: &str = "analysis:read";
    pub const ANALYSIS_WRITE: &str = "analysis:write";
    pub const PREDICT_INVOKE: &str = "predict:invoke";
    pub const ANOMALY_READ: &str = "anomaly:read";
    pub const EXPLAIN_READ: &str = "explain:read";
    pub const STREAM_READ: &str = "stream:read";
    pub const ADMIN_MODEL: &str = "admin:model";
    pub const ADMIN_SYSTEM: &str = "admin:system";
}

/// Role definitions with their associated scopes
pub mod roles {
    use super::*;

    pub fn admin_scopes() -> Vec<&'static str> {
        vec![
            QUERY_READ,
            ANALYSIS_READ,
            ANALYSIS_WRITE,
            PREDICT_INVOKE,
            ANOMALY_READ,
            EXPLAIN_READ,
            STREAM_READ,
            ADMIN_MODEL,
            ADMIN_SYSTEM,
        ]
    }

    pub fn developer_scopes() -> Vec<&'static str> {
        vec![
            QUERY_READ,
            ANALYSIS_READ,
            ANALYSIS_WRITE,
            PREDICT_INVOKE,
            ANOMALY_READ,
            EXPLAIN_READ,
            STREAM_READ,
        ]
    }

    pub fn operator_scopes() -> Vec<&'static str> {
        vec![
            QUERY_READ,
            ANALYSIS_READ,
            PREDICT_INVOKE,
            ANOMALY_READ,
            EXPLAIN_READ,
            STREAM_READ,
        ]
    }

    pub fn auditor_scopes() -> Vec<&'static str> {
        vec![
            QUERY_READ,
            ANALYSIS_READ,
            ANOMALY_READ,
            EXPLAIN_READ,
        ]
    }

    pub fn readonly_scopes() -> Vec<&'static str> {
        vec![
            QUERY_READ,
            ANALYSIS_READ,
            ANOMALY_READ,
            EXPLAIN_READ,
        ]
    }
}

/// Token utilities for testing and development
pub mod token_utils {
    use super::*;

    /// Create a test token with admin role
    pub fn create_admin_token(auth_config: &AuthConfig, user_id: &str) -> Result<String> {
        let scopes = roles::admin_scopes();
        let scope_str = scopes.join(",");
        let claims = Claims::new(user_id.to_string(), auth_config.issuer.clone(), auth_config.audience.clone())
            .with_scope(scope_str)
            .with_expiry(24);
        
        let header = Header::default();
        Ok(jsonwebtoken::encode(&header, &claims, &auth_config.jwt_encoding_key)?)
    }

    /// Create a test token with developer role
    pub fn create_developer_token(auth_config: &AuthConfig, user_id: &str) -> Result<String> {
        let scopes = roles::developer_scopes();
        let scope_str = scopes.join(",");
        let claims = Claims::new(user_id.to_string(), auth_config.issuer.clone(), auth_config.audience.clone())
            .with_scope(scope_str)
            .with_expiry(24);
        
        let header = Header::default();
        Ok(jsonwebtoken::encode(&header, &claims, &auth_config.jwt_encoding_key)?)
    }

    /// Create a test token with specific scopes
    pub fn create_token_with_scopes(auth_config: &AuthConfig, user_id: &str, scopes: &[&str]) -> Result<String> {
        let scope_str = scopes.join(",");
        let claims = Claims::new(user_id.to_string(), auth_config.issuer.clone(), auth_config.audience.clone())
            .with_scope(scope_str)
            .with_expiry(24);
        
        let header = Header::default();
        Ok(jsonwebtoken::encode(&header, &claims, &auth_config.jwt_encoding_key)?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_claims_creation() {
        let claims = Claims::new("test_user".to_string(), "test_issuer".to_string(), "test_audience".to_string());
        
        assert_eq!(claims.sub, "test_user");
        assert_eq!(claims.iss, "test_issuer");
        assert_eq!(claims.aud, "test_audience");
        assert!(claims.scope.is_none());
    }

    #[test]
    fn test_claims_with_scope() {
        let claims = Claims::new("test_user".to_string(), "test_issuer".to_string(), "test_audience".to_string())
            .with_scope("read,write".to_string());
        
        assert_eq!(claims.scope, Some("read,write".to_string()));
        assert!(claims.has_scope("read"));
        assert!(claims.has_scope("write"));
        assert!(!claims.has_scope("delete"));
    }

    #[test]
    fn test_scope_validation() {
        let claims = Claims::new("test_user".to_string(), "test_issuer".to_string(), "test_audience".to_string())
            .with_scope("query:read,analysis:write".to_string());
        
        assert!(ensure_scope(&claims, "query:read"));
        assert!(ensure_scope(&claims, "analysis:write"));
        assert!(!ensure_scope(&claims, "admin:system"));
        
        assert!(ensure_any_scope(&claims, &["query:read", "admin:system"]));
        assert!(!ensure_any_scope(&claims, &["admin:system", "delete:write"]));
    }

    #[test]
    fn test_role_validation() {
        let admin_claims = Claims::new("admin".to_string(), "test_issuer".to_string(), "test_audience".to_string())
            .with_scope("role:admin,query:read".to_string());
        
        let dev_claims = Claims::new("dev".to_string(), "test_issuer".to_string(), "test_audience".to_string())
            .with_scope("role:dev,query:read".to_string());
        
        assert!(is_admin(&admin_claims));
        assert!(!is_admin(&dev_claims));
        
        assert!(is_developer(&dev_claims));
        assert!(is_developer(&admin_claims)); // Admin has dev privileges too
    }

    #[tokio::test]
    async fn test_auth_config_creation() {
        let secret = b"test_secret_key_that_is_long_enough";
        let config = AuthConfig::new(secret, secret, "test_issuer".to_string(), "test_audience".to_string(), 24).unwrap();
        
        assert_eq!(config.issuer, "test_issuer");
        assert_eq!(config.audience, "test_audience");
        assert_eq!(config.token_expiry_hours, 24);
    }

    #[tokio::test]
    async fn test_token_generation() {
        let secret = b"test_secret_key_that_is_long_enough";
        let config = AuthConfig::new(secret, secret, "test_issuer".to_string(), "test_audience".to_string(), 24).unwrap();
        
        let token = config.generate_test_token("test_user", &["query:read", "analysis:write"]).unwrap();
        
        assert!(!token.is_empty());
        
        // Validate the token
        let claims = validate_jwt_token(&token, &config).unwrap();
        assert_eq!(claims.sub, "test_user");
        assert!(claims.has_scope("query:read"));
        assert!(claims.has_scope("analysis:write"));
    }
}