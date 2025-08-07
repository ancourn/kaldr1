import { NextRequest, NextResponse } from "next/server";

interface DagNode {
  id: string;
  transaction: {
    id: string;
    sender: string;
    receiver: string;
    amount: number;
    timestamp: number;
    status: string;
    fee: number;
    quantum_resistance_score: number;
  };
  children: string[];
  weight: number;
  confidence: number;
  status: string;
  quantum_score: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Generate mock DAG nodes
function generateMockDagNodes(count: number): DagNode[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `node_${Math.random().toString(36).substr(2, 9)}`,
    transaction: {
      id: `tx_${Math.random().toString(36).substr(2, 9)}`,
      sender: `0x${Math.random().toString(16).substr(2, 8)}`,
      receiver: `0x${Math.random().toString(16).substr(2, 8)}`,
      amount: Math.floor(Math.random() * 1000) + 1,
      timestamp: Date.now() - i * 60000,
      status: Math.random() > 0.1 ? "confirmed" : "pending",
      fee: Math.floor(Math.random() * 10) + 1,
      quantum_resistance_score: Math.floor(Math.random() * 20) + 80
    },
    children: Array.from({ length: Math.floor(Math.random() * 3) }, () => 
      `node_${Math.random().toString(36).substr(2, 9)}`
    ),
    weight: Math.floor(Math.random() * 100) + 1,
    confidence: Math.random(),
    status: Math.random() > 0.1 ? "confirmed" : "pending",
    quantum_score: Math.floor(Math.random() * 20) + 80
  }));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const nodes = generateMockDagNodes(limit + offset);
    const paginatedNodes = nodes.slice(offset, offset + limit);

    const response: ApiResponse<DagNode[]> = {
      success: true,
      data: paginatedNodes,
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
    console.error('DAG nodes API error:', error);
    
    const response: ApiResponse<DagNode[]> = {
      success: false,
      error: 'Failed to fetch DAG nodes',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create_node':
        // Create a new DAG node
        const newNode: DagNode = {
          id: `node_${Math.random().toString(36).substr(2, 9)}`,
          transaction: {
            id: `tx_${Math.random().toString(36).substr(2, 9)}`,
            sender: data?.sender || `0x${Math.random().toString(16).substr(2, 8)}`,
            receiver: data?.receiver || `0x${Math.random().toString(16).substr(2, 8)}`,
            amount: data?.amount || Math.floor(Math.random() * 1000) + 1,
            timestamp: Date.now(),
            status: "pending",
            fee: data?.fee || Math.floor(Math.random() * 10) + 1,
            quantum_resistance_score: Math.floor(Math.random() * 20) + 80
          },
          children: data?.children || [],
          weight: data?.weight || Math.floor(Math.random() * 100) + 1,
          confidence: 0.0,
          status: "pending",
          quantum_score: Math.floor(Math.random() * 20) + 80
        };

        const response: ApiResponse<DagNode> = {
          success: true,
          data: newNode,
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);

      case 'validate_dag':
        // Validate DAG structure
        const validationResponse: ApiResponse<{ valid: boolean; issues: string[] }> = {
          success: true,
          data: {
            valid: true,
            issues: []
          },
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(validationResponse);

      default:
        const errorResponse: ApiResponse<null> = {
          success: false,
          error: 'Unknown action',
          timestamp: new Date().toISOString()
        };

        return NextResponse.json(errorResponse, { status: 400 });
    }

  } catch (error) {
    console.error('DAG nodes POST error:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to process DAG operation',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 500 });
  }
}