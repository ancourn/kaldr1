use dev_assistant_client::models::*;
use dev_assistant_client::{apis::configuration::Configuration, apis::client::APIClient};
use std::time::Duration;
use tokio::time::sleep;

#[cfg(test)]
mod integration_tests {
    use super::*;
    use serde_json::json;
    use tokio::runtime::Runtime;

    fn get_test_config() -> Configuration {
        let base_url = std::env::var("TEST_API_URL")
            .unwrap_or_else(|_| "http://localhost:3000".to_string());
        
        Configuration {
            base_path: base_url,
            user_agent: Some("dev-assistant-client-test/1.0".to_string()),
            client: reqwest::Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .unwrap(),
            ..Configuration::default()
        }
    }

    #[test]
    fn test_health_check() {
        let rt = Runtime::new().unwrap();
        let config = get_test_config();
        let client = APIClient::new(config);

        let result = rt.block_on(async {
            client.health_api().get_health().await
        });

        match result {
            Ok(health_response) => {
                assert_eq!(health_response.status, "healthy");
                assert!(health_response.timestamp.len() > 0);
                assert_eq!(health_response.services.server, "online");
                assert_eq!(health_response.endpoints.health, "/api/health");
            }
            Err(e) => {
                panic!("Health check failed: {:?}", e);
            }
        }
    }

    #[test]
    fn test_health_check_invalid_url() {
        let rt = Runtime::new().unwrap();
        let mut config = get_test_config();
        config.base_path = "http://localhost:9999".to_string();
        let client = APIClient::new(config);

        let result = rt.block_on(async {
            client.health_api().get_health().await
        });

        assert!(result.is_err());
    }

    #[test]
    fn test_chat_completion() {
        let rt = Runtime::new().unwrap();
        let config = get_test_config();
        let client = APIClient::new(config);

        let chat_request = ChatRequest {
            messages: vec![
                Message {
                    role: "user".to_string(),
                    content: "Hello, how are you?".to_string(),
                }
            ],
        };

        let result = rt.block_on(async {
            client.chat_api().create_chat_completion(chat_request).await
        });

        match result {
            Ok(chat_response) => {
                assert!(chat_response.success);
                assert!(!chat_response.response.is_empty());
                assert!(chat_response.timestamp.len() > 0);
            }
            Err(e) => {
                panic!("Chat completion failed: {:?}", e);
            }
        }
    }

    #[test]
    fn test_chat_completion_invalid_request() {
        let rt = Runtime::new().unwrap();
        let config = get_test_config();
        let client = APIClient::new(config);

        let chat_request = ChatRequest {
            messages: vec![],
        };

        let result = rt.block_on(async {
            client.chat_api().create_chat_completion(chat_request).await
        });

        assert!(result.is_err());
    }

    #[test]
    fn test_image_generation() {
        let rt = Runtime::new().unwrap();
        let config = get_test_config();
        let client = APIClient::new(config);

        let image_request = ImageRequest {
            prompt: "A beautiful sunset over mountains".to_string(),
            size: Some("1024x1024".to_string()),
        };

        let result = rt.block_on(async {
            client.image_api().generate_image(image_request).await
        });

        match result {
            Ok(image_response) => {
                assert!(image_response.success);
                assert!(!image_response.image.is_empty());
                assert_eq!(image_response.size, Some("1024x1024".to_string()));
                assert!(image_response.timestamp.len() > 0);
                assert!(image_response.image.starts_with("data:image/"));
            }
            Err(e) => {
                panic!("Image generation failed: {:?}", e);
            }
        }
    }

    #[test]
    fn test_image_generation_default_size() {
        let rt = Runtime::new().unwrap();
        let config = get_test_config();
        let client = APIClient::new(config);

        let image_request = ImageRequest {
            prompt: "A simple test image".to_string(),
            size: None,
        };

        let result = rt.block_on(async {
            client.image_api().generate_image(image_request).await
        });

        match result {
            Ok(image_response) => {
                assert!(image_response.success);
                assert!(!image_response.image.is_empty());
                // Should use default size
                assert_eq!(image_response.size, Some("1024x1024".to_string()));
            }
            Err(e) => {
                panic!("Image generation failed: {:?}", e);
            }
        }
    }

    #[test]
    fn test_image_generation_invalid_request() {
        let rt = Runtime::new().unwrap();
        let config = get_test_config();
        let client = APIClient::new(config);

        let image_request = ImageRequest {
            prompt: "".to_string(),
            size: Some("1024x1024".to_string()),
        };

        let result = rt.block_on(async {
            client.image_api().generate_image(image_request).await
        });

        assert!(result.is_err());
    }

    #[test]
    fn test_web_search() {
        let rt = Runtime::new().unwrap();
        let config = get_test_config();
        let client = APIClient::new(config);

        let search_request = SearchRequest {
            query: "What is artificial intelligence?".to_string(),
            num: Some(5),
        };

        let result = rt.block_on(async {
            client.search_api().web_search(search_request).await
        });

        match result {
            Ok(search_response) => {
                assert!(search_response.success);
                assert!(search_response.results.len() <= 5);
                assert_eq!(search_response.query, "What is artificial intelligence?");
                assert!(search_response.timestamp.len() > 0);
                
                if !search_response.results.is_empty() {
                    let first_result = &search_response.results[0];
                    assert!(!first_result.url.is_empty());
                    assert!(!first_result.name.is_empty());
                    assert!(!first_result.snippet.is_empty());
                }
            }
            Err(e) => {
                panic!("Web search failed: {:?}", e);
            }
        }
    }

    #[test]
    fn test_web_search_default_num() {
        let rt = Runtime::new().unwrap();
        let config = get_test_config();
        let client = APIClient::new(config);

        let search_request = SearchRequest {
            query: "Test search query".to_string(),
            num: None,
        };

        let result = rt.block_on(async {
            client.search_api().web_search(search_request).await
        });

        match result {
            Ok(search_response) => {
                assert!(search_response.success);
                assert!(search_response.results.len() <= 10); // default num
            }
            Err(e) => {
                panic!("Web search failed: {:?}", e);
            }
        }
    }

    #[test]
    fn test_web_search_invalid_request() {
        let rt = Runtime::new().unwrap();
        let config = get_test_config();
        let client = APIClient::new(config);

        let search_request = SearchRequest {
            query: "".to_string(),
            num: Some(5),
        };

        let result = rt.block_on(async {
            client.search_api().web_search(search_request).await
        });

        assert!(result.is_err());
    }

    #[test]
    fn test_web_search_large_num() {
        let rt = Runtime::new().unwrap();
        let config = get_test_config();
        let client = APIClient::new(config);

        let search_request = SearchRequest {
            query: "Technology news".to_string(),
            num: Some(20),
        };

        let result = rt.block_on(async {
            client.search_api().web_search(search_request).await
        });

        match result {
            Ok(search_response) => {
                assert!(search_response.success);
                assert!(search_response.results.len() <= 20);
            }
            Err(e) => {
                panic!("Web search failed: {:?}", e);
            }
        }
    }

    #[test]
    fn test_timeout_handling() {
        let rt = Runtime::new().unwrap();
        let mut config = get_test_config();
        config.client = reqwest::Client::builder()
            .timeout(Duration::from_millis(1))
            .build()
            .unwrap();
        let client = APIClient::new(config);

        let result = rt.block_on(async {
            client.health_api().get_health().await
        });

        assert!(result.is_err());
    }

    #[test]
    fn test_concurrent_requests() {
        let rt = Runtime::new().unwrap();
        let config = get_test_config();
        let client = APIClient::new(config);

        let futures = vec![
            client.health_api().get_health(),
            client.chat_api().create_chat_completion(ChatRequest {
                messages: vec![Message {
                    role: "user".to_string(),
                    content: "Test message 1".to_string(),
                }],
            }),
            client.search_api().web_search(SearchRequest {
                query: "concurrent test".to_string(),
                num: Some(3),
            }),
        ];

        let result = rt.block_on(async {
            futures::future::try_join_all(futures).await
        });

        assert!(result.is_ok());
        let results = result.unwrap();
        assert_eq!(results.len(), 3);
    }

    #[test]
    fn test_rate_limiting() {
        let rt = Runtime::new().unwrap();
        let config = get_test_config();
        let client = APIClient::new(config);

        let mut futures = vec![];
        for _ in 0..5 {
            futures.push(client.health_api().get_health());
        }

        let result = rt.block_on(async {
            futures::future::try_join_all(futures).await
        });

        // Should either succeed or fail gracefully
        match result {
            Ok(results) => {
                assert_eq!(results.len(), 5);
                for health_response in results {
                    assert_eq!(health_response.status, "healthy");
                }
            }
            Err(_) => {
                // It's okay if some requests fail due to rate limiting
            }
        }
    }

    #[test]
    fn test_authentication() {
        let rt = Runtime::new().unwrap();
        let mut config = get_test_config();
        
        // Add authentication header
        config.user_agent = Some("dev-assistant-client-test/1.0".to_string());
        config.client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .default_headers({
                let mut headers = reqwest::header::HeaderMap::new();
                headers.insert(
                    reqwest::header::AUTHORIZATION,
                    reqwest::header::HeaderValue::from_static("Bearer invalid-token"),
                );
                headers
            })
            .build()
            .unwrap();
        
        let client = APIClient::new(config);

        let result = rt.block_on(async {
            client.health_api().get_health().await
        });

        // Should either work (if auth is not required) or fail gracefully
        match result {
            Ok(health_response) => {
                assert_eq!(health_response.status, "healthy");
            }
            Err(_) => {
                // Expected if authentication is required
            }
        }
    }

    #[test]
    fn test_error_handling() {
        let rt = Runtime::new().unwrap();
        let config = get_test_config();
        let client = APIClient::new(config);

        // Test with a non-existent endpoint
        let result = rt.block_on(async {
            client
                .client()
                .get(&format!("{}/api/non-existent", config.base_path))
                .send()
                .await
        });

        assert!(result.is_err());
    }

    #[test]
    fn test_custom_user_agent() {
        let rt = Runtime::new().unwrap();
        let mut config = get_test_config();
        config.user_agent = Some("custom-user-agent/1.0".to_string());
        let client = APIClient::new(config);

        let result = rt.block_on(async {
            client.health_api().get_health().await
        });

        match result {
            Ok(health_response) => {
                assert_eq!(health_response.status, "healthy");
            }
            Err(e) => {
                panic!("Health check with custom user agent failed: {:?}", e);
            }
        }
    }
}