import { NextRequest, NextResponse } from "next/server";

interface NetworkInfo {
  network_id: string;
  version: string;
  protocol_version: string;
  total_peers: number;
  active_peers: number;
  network_hashrate: number;
  difficulty: number;
  block_time: number;
  last_block_hash: string;
  chain_height: number;
  is_synced: boolean;
  sync_progress: number;
  network_status: "online" | "degraded" | "offline";
  quantum_resistance_enabled: boolean;
  post_quantum_algorithms: string[];
  uptime: number;
  total_transactions: number;
  mempool_size: number;
  network_tps: number;
}

interface NetworkPeer {
  id: string;
  address: string;
  port: number;
  version: string;
  latency: number;
  is_connected: boolean;
  last_seen: number;
  reputation: number;
  country?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Generate mock network info
function generateMockNetworkInfo(): NetworkInfo {
  return {
    network_id: "kaldrix-mainnet-1",
    version: "1.0.0",
    protocol_version: "1.0.0",
    total_peers: 25,
    active_peers: 18,
    network_hashrate: 15000000,
    difficulty: 4500000000000,
    block_time: 3.2,
    last_block_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
    chain_height: 523,
    is_synced: true,
    sync_progress: 100,
    network_status: "online",
    quantum_resistance_enabled: true,
    post_quantum_algorithms: ["Kyber", "Dilithium", "SPHINCS+"],
    uptime: 86400 * 7, // 7 days
    total_transactions: 1247,
    mempool_size: 45,
    network_tps: 1250
  };
}

// Generate mock peers
function generateMockPeers(count: number): NetworkPeer[] {
  const countries = ["US", "DE", "SG", "JP", "GB", "FR", "CA", "AU", "NL", "CH"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `peer_${Math.random().toString(36).substr(2, 9)}`,
    address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    port: 8080 + Math.floor(Math.random() * 1000),
    version: "1.0.0",
    latency: Math.floor(Math.random() * 200) + 10,
    is_connected: Math.random() > 0.2,
    last_seen: Date.now() - Math.floor(Math.random() * 3600000),
    reputation: Math.floor(Math.random() * 100),
    country: countries[Math.floor(Math.random() * countries.length)]
  }));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const include_peers = searchParams.get('include_peers') === 'true';
    const peer_limit = parseInt(searchParams.get('peer_limit') || '10');

    const networkInfo = generateMockNetworkInfo();
    
    const response: ApiResponse<NetworkInfo & { peers?: NetworkPeer[] }> = {
      success: true,
      data: {
        ...networkInfo,
        ...(include_peers && { peers: generateMockPeers(peer_limit) })
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Network info API error:', error);
    
    const response: ApiResponse<NetworkInfo> = {
      success: false,
      error: 'Failed to fetch network information',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'scan_network':
        // Simulate network scan
        const scanResponse: ApiResponse<{ 
          scanned_peers: number; 
          new_peers: number; 
          scan_duration: number;
          issues_found: string[];
        }> = {
          success: true,
          data: {
            scanned_peers: 25,
            new_peers: 3,
            scan_duration: 2.5,
            issues_found: []
          },
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(scanResponse);

      case 'connect_peer':
        // Simulate peer connection
        const connectResponse: ApiResponse<{ 
          peer_id: string; 
          connected: boolean; 
          message: string;
        }> = {
          success: true,
          data: {
            peer_id: body.peer_id || `peer_${Math.random().toString(36).substr(2, 9)}`,
            connected: true,
            message: "Successfully connected to peer"
          },
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(connectResponse);

      case 'disconnect_peer':
        // Simulate peer disconnection
        const disconnectResponse: ApiResponse<{ 
          peer_id: string; 
          disconnected: boolean; 
          message: string;
        }> = {
          success: true,
          data: {
            peer_id: body.peer_id || `peer_${Math.random().toString(36).substr(2, 9)}`,
            disconnected: true,
            message: "Successfully disconnected from peer"
          },
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(disconnectResponse);

      default:
        const errorResponse: ApiResponse<null> = {
          success: false,
          error: 'Unknown action',
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(errorResponse, { status: 400 });
    }

  } catch (error) {
    console.error('Network info POST error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to process network operation',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 500 });
  }
}