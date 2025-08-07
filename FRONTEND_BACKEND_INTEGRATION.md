# Frontend-Backend Integration Guide

This guide shows how to connect the Next.js frontend with the Rust blockchain backend.

## 🏗️ Architecture Overview

```
Frontend (Next.js) ←→ API Routes ←→ Rust Backend (Localhost)
```

## 🚀 Quick Integration

### Option 1: Direct API Calls (Recommended for Development)

#### 1. Start the Rust Backend
```bash
cd blockchain-backend
cargo run --bin dag-node start --path ./my_blockchain --listen /ip4/127.0.0.1/tcp/8999
```

#### 2. Update Frontend API Routes

Create a new API route that proxies requests to the Rust backend:

```typescript
// src/app/api/backend/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:8999";

export async function GET(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const backendPath = pathname.replace("/api/backend", "");
    
    const response = await fetch(`${BACKEND_URL}${backendPath}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Backend proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const backendPath = pathname.replace("/api/backend", "");
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}${backendPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Backend proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}
```

#### 3. Update Frontend to Use Real Backend

Modify your dashboard component to fetch from the real backend:

```typescript
// src/components/BlockchainDashboard.tsx
useEffect(() => {
  const fetchStatus = async () => {
    try {
      // Try real backend first
      const response = await fetch("/api/backend/status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        return;
      }
    } catch (error) {
      console.log("Backend not available, using mock data");
    }

    // Fallback to mock data
    setStatus({
      total_transactions: 1247,
      network_peers: 8,
      consensus_height: 523,
      quantum_resistance_score: 0.95,
      transactions_per_second: 1250,
      block_time: 3.2,
      active_validators: 3,
      total_stake: 15000,
      network_status: "online",
      last_updated: new Date().toISOString()
    });
  };

  fetchStatus();
  const interval = setInterval(fetchStatus, 5000);
  return () => clearInterval(interval);
}, []);
```

### Option 2: WebSocket Integration (Real-time Updates)

#### 1. Add WebSocket Support to Rust Backend

Add this to your Rust backend:

```rust
// In src/network/mod.rs
use tokio::sync::broadcast;
use futures::StreamExt;

pub struct NetworkLayer {
    // ... existing fields ...
    status_tx: broadcast::Sender<BlockchainStatus>,
}

impl NetworkLayer {
    pub async fn new(config: &NetworkConfig) -> Result<Self, BlockchainError> {
        let (status_tx, _) = broadcast::channel(100);
        
        Ok(Self {
            // ... existing initialization ...
            status_tx,
        })
    }

    pub async fn start(&mut self) -> Result<(), BlockchainError> {
        // ... existing start logic ...
        
        // Start WebSocket server
        self.start_websocket_server().await;
        
        Ok(())
    }

    async fn start_websocket_server(&self) {
        use tokio_tungstenite::tungstenite::protocol::Message;
        
        // This is a simplified example - you'd need to add tokio-tungstenite dependency
        let status_tx = self.status_tx.clone();
        
        tokio::spawn(async move {
            // WebSocket server implementation would go here
            // For now, we'll just broadcast status updates
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(5));
            
            while interval.tick().await.is_some() {
                let status = BlockchainStatus {
                    // ... generate status ...
                };
                
                let _ = status_tx.send(status);
            }
        });
    }
}
```

#### 2. Add WebSocket Client to Frontend

```typescript
// src/hooks/useBlockchainWebSocket.ts
import { useEffect, useState } from 'react';

interface BlockchainStatus {
  total_transactions: number;
  network_peers: number;
  consensus_height: number;
  quantum_resistance_score: number;
  // ... other fields
}

export function useBlockchainWebSocket() {
  const [status, setStatus] = useState<BlockchainStatus | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket;

    const connectWebSocket = () => {
      ws = new WebSocket('ws://localhost:8999/ws');

      ws.onopen = () => {
        setConnected(true);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setStatus(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('WebSocket disconnected, reconnecting...');
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return { status, connected };
}
```

#### 3. Update Dashboard to Use WebSocket

```typescript
// src/app/page.tsx
import { useBlockchainWebSocket } from '@/hooks/useBlockchainWebSocket';

export default function BlockchainDashboard() {
  const { status, connected } = useBlockchainWebSocket();

  if (!status) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Connection status */}
      <div className={`flex items-center gap-2 ${connected ? 'text-green-600' : 'text-red-600'}`}>
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span>{connected ? 'Connected to backend' : 'Disconnected'}</span>
      </div>
      
      {/* Rest of your dashboard */}
      {/* ... */}
    </div>
  );
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the frontend:

```env
# Backend configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8999
NEXT_PUBLIC_WS_URL=ws://localhost:8999/ws

# API configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### Next.js Configuration

Update `next.config.ts` for proxy support:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:8999/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

## 🧪 Testing the Integration

### 1. Test Backend API

```bash
# Start backend
cd blockchain-backend
cargo run --bin dag-node start --path ./my_blockchain

# Test API in another terminal
curl http://localhost:8999/status
```

### 2. Test Frontend Integration

```bash
# Start frontend
cd blockchain-frontend
npm run dev

# Open http://localhost:3000
# Check browser console for API calls
```

### 3. Test End-to-End

```bash
# In terminal 1: Start backend
cd blockchain-backend
cargo run --bin dag-node start --path ./my_blockchain

# In terminal 2: Start frontend
cd blockchain-frontend
npm run dev

# In browser: Open http://localhost:3000
# - Check if real data appears
# - Try creating transactions
# - Verify real-time updates
```

## 🔒 Security Considerations

### 1. CORS Configuration

Add CORS middleware to your Rust backend:

```rust
// In your backend server setup
use tower_http::cors::CorsLayer;

let app = Router::new()
    .route("/status", get(handlers::get_status))
    .route("/transactions", get(handlers::get_transactions))
    .layer(
        CorsLayer::new()
            .allow_origin("http://localhost:3000")
            .allow_methods(Method::GET | Method::POST)
            .allow_headers(ContentType)
    );
```

### 2. API Authentication

Add JWT authentication to your API:

```typescript
// Frontend API route
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const token = authHeader.substring(7);
  
  // Validate token
  if (!validateToken(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  
  // Proceed with request...
}
```

## 🚀 Production Deployment

### 1. Docker Setup

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  blockchain-backend:
    build: ./blockchain-backend
    ports:
      - "8999:8999"
    environment:
      - RUST_LOG=info
    volumes:
      - ./blockchain-data:/app/data

  blockchain-frontend:
    build: ./blockchain-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://blockchain-backend:8999
    depends_on:
      - blockchain-backend

volumes:
  blockchain-data:
```

### 2. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name blockchain.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8999;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Monitoring

### 1. Health Check Endpoint

Add to your backend:

```rust
// src/handlers/health.rs
pub async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now(),
        "version": env!("CARGO_PKG_VERSION"),
        "uptime": uptime()
    }))
}
```

### 2. Metrics Endpoint

```rust
use prometheus::{Counter, Histogram, TextEncoder, Encoder};

lazy_static! {
    static ref REQUEST_COUNT: Counter = Counter::new("blockchain_requests_total", "Total requests").unwrap();
    static ref REQUEST_DURATION: Histogram = Histogram::new("blockchain_request_duration_seconds", "Request duration").unwrap();
}

pub async fn metrics() -> impl IntoResponse {
    let encoder = TextEncoder::new();
    let metric_families = prometheus::gather();
    let mut buffer = Vec::new();
    encoder.encode(&metric_families, &mut buffer).unwrap();
    
    (
        StatusCode::OK,
        [(header::CONTENT_TYPE, "text/plain")],
        buffer
    )
}
```

This comprehensive integration guide provides everything you need to connect your Next.js frontend with the Rust blockchain backend, from basic API calls to real-time WebSocket communication and production deployment.