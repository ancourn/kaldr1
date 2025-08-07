import { NextRequest, NextResponse } from "next/server";
import { blockchainService } from "@/lib/blockchain-service";

interface GovernanceStats {
  total_proposals: number;
  active_proposals: number;
  executed_proposals: number;
  rejected_proposals: number;
  average_voting_participation: number;
  proposal_success_rate: number;
  emergency_actions_count: number;
  rollback_count: number;
  total_voting_power: number;
  active_voters: number;
  proposal_types: {
    protocol_upgrade: number;
    parameter_change: number;
    emergency_action: number;
    treasury_management: number;
    custom: number;
  };
  recent_activity: Array<{
    type: "proposal_created" | "vote_cast" | "proposal_executed";
    timestamp: string;
    description: string;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    // Try to get from database first
    try {
      await blockchainService.initializeBlockchain();
      
      // Mock governance stats for now
      const mockStats: GovernanceStats = {
        total_proposals: 15,
        active_proposals: 3,
        executed_proposals: 8,
        rejected_proposals: 4,
        average_voting_participation: 0.67, // 67%
        proposal_success_rate: 0.53, // 53%
        emergency_actions_count: 1,
        rollback_count: 0,
        total_voting_power: 25000,
        active_voters: 12,
        proposal_types: {
          protocol_upgrade: 3,
          parameter_change: 7,
          emergency_action: 1,
          treasury_management: 2,
          custom: 2
        },
        recent_activity: [
          {
            type: "proposal_created",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            description: "New proposal: 'Add New Validator Slots'"
          },
          {
            type: "vote_cast",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            description: "Vote cast on 'Increase Block Size Limit'"
          },
          {
            type: "proposal_executed",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            description: "Protocol Upgrade v1.1.0 executed successfully"
          }
        ]
      };

      return NextResponse.json({
        success: true,
        data: mockStats,
        timestamp: new Date().toISOString()
      });

    } catch (dbError) {
      console.log('Database not available for governance stats:', dbError);
      
      // Fallback to basic stats
      const fallbackStats: GovernanceStats = {
        total_proposals: 1,
        active_proposals: 1,
        executed_proposals: 0,
        rejected_proposals: 0,
        average_voting_participation: 0.0,
        proposal_success_rate: 0.0,
        emergency_actions_count: 0,
        rollback_count: 0,
        total_voting_power: 1000,
        active_voters: 1,
        proposal_types: {
          protocol_upgrade: 0,
          parameter_change: 1,
          emergency_action: 0,
          treasury_management: 0,
          custom: 0
        },
        recent_activity: [
          {
            type: "proposal_created",
            timestamp: new Date().toISOString(),
            description: "System initialized with fallback governance"
          }
        ]
      };

      return NextResponse.json({
        success: true,
        data: fallbackStats,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Governance stats API error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch governance stats",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}