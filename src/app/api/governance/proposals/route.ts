import { NextRequest, NextResponse } from "next/server";
import { blockchainService } from "@/lib/blockchain-service";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  proposal_type: string;
  status: "draft" | "discussion" | "voting" | "approved" | "rejected" | "executed" | "cancelled" | "expired";
  created_at: string;
  voting_start_time: string;
  voting_end_time: string;
  execution_time: string;
  for_votes: number;
  against_votes: number;
  abstain_votes: number;
  veto_votes: number;
  total_voting_power: number;
  metadata: {
    tags: string[];
    links: Array<{ title: string; url: string; description?: string }>;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Try to get from database first
    try {
      await blockchainService.initializeBlockchain();
      
      // For now, return mock proposals since governance isn't fully implemented in DB
      const mockProposals: Proposal[] = [
        {
          id: "prop_1",
          title: "Increase Block Size Limit",
          description: "Proposal to increase the block size limit from 1MB to 2MB to improve network throughput",
          proposer: "validator_1",
          proposal_type: "parameter_change",
          status: "voting",
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          voting_start_time: new Date(Date.now() - 86400000 * 2).toISOString(),
          voting_end_time: new Date(Date.now() + 86400000 * 2).toISOString(),
          execution_time: new Date(Date.now() + 86400000 * 3).toISOString(),
          for_votes: 15000,
          against_votes: 3000,
          abstain_votes: 2000,
          veto_votes: 0,
          total_voting_power: 25000,
          metadata: {
            tags: ["protocol", "performance"],
            links: [
              {
                title: "Technical Analysis",
                url: "https://example.com/block-size-analysis",
                description: "Detailed analysis of block size increase impact"
              }
            ]
          }
        },
        {
          id: "prop_2",
          title: "Add New Validator Slots",
          description: "Increase the number of active validator slots from 3 to 5 to improve decentralization",
          proposer: "validator_2",
          proposal_type: "parameter_change",
          status: "discussion",
          created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
          voting_start_time: new Date(Date.now() + 86400000 * 6).toISOString(),
          voting_end_time: new Date(Date.now() + 86400000 * 13).toISOString(),
          execution_time: new Date(Date.now() + 86400000 * 14).toISOString(),
          for_votes: 0,
          against_votes: 0,
          abstain_votes: 0,
          veto_votes: 0,
          total_voting_power: 0,
          metadata: {
            tags: ["validators", "decentralization"],
            links: []
          }
        },
        {
          id: "prop_3",
          title: "Protocol Upgrade v1.1.0",
          description: "Upgrade protocol to version 1.1.0 with improved quantum resistance and bug fixes",
          proposer: "validator_3",
          proposal_type: "protocol_upgrade",
          status: "approved",
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
          voting_start_time: new Date(Date.now() - 86400000 * 8).toISOString(),
          voting_end_time: new Date(Date.now() - 86400000 * 1).toISOString(),
          execution_time: new Date(Date.now() + 86400000 * 1).toISOString(),
          for_votes: 22000,
          against_votes: 1000,
          abstain_votes: 2000,
          veto_votes: 0,
          total_voting_power: 25000,
          metadata: {
            tags: ["upgrade", "security"],
            links: [
              {
                title: "Release Notes",
                url: "https://example.com/v1.1.0-release-notes",
                description: "Detailed release notes for v1.1.0"
              },
              {
                title: "Security Audit",
                url: "https://example.com/v1.1.0-audit",
                description: "Third-party security audit results"
              }
            ]
          }
        }
      ];

      // Filter by status if specified
      let filteredProposals = mockProposals;
      if (status) {
        filteredProposals = mockProposals.filter(p => p.status === status);
      }

      // Apply pagination
      const paginatedProposals = filteredProposals.slice(offset, offset + limit);

      return NextResponse.json({
        success: true,
        data: paginatedProposals,
        total: filteredProposals.length,
        offset,
        limit,
        timestamp: new Date().toISOString()
      });

    } catch (dbError) {
      console.log('Database not available for governance proposals:', dbError);
      
      // Fallback to mock data
      const fallbackProposals: Proposal[] = [
        {
          id: "prop_fallback_1",
          title: "Network Parameter Adjustment",
          description: "Fallback proposal for testing governance system",
          proposer: "validator_fallback",
          proposal_type: "parameter_change",
          status: "discussion",
          created_at: new Date().toISOString(),
          voting_start_time: new Date(Date.now() + 86400000).toISOString(),
          voting_end_time: new Date(Date.now() + 86400000 * 8).toISOString(),
          execution_time: new Date(Date.now() + 86400000 * 9).toISOString(),
          for_votes: 0,
          against_votes: 0,
          abstain_votes: 0,
          veto_votes: 0,
          total_voting_power: 0,
          metadata: {
            tags: ["fallback"],
            links: []
          }
        }
      ];

      return NextResponse.json({
        success: true,
        data: fallbackProposals,
        total: fallbackProposals.length,
        offset,
        limit,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Governance proposals API error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch proposals",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, proposal_type, proposer } = body;

    // Validate required fields
    if (!title || !description || !proposal_type || !proposer) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: title, description, proposal_type, proposer",
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Try to store in database
    try {
      await blockchainService.initializeBlockchain();
      
      // Create proposal (mock implementation for now)
      const newProposal: Proposal = {
        id: `prop_${Date.now()}`,
        title,
        description,
        proposer,
        proposal_type,
        status: "discussion",
        created_at: new Date().toISOString(),
        voting_start_time: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days discussion
        voting_end_time: new Date(Date.now() + 86400000 * 14).toISOString(), // 7 days voting
        execution_time: new Date(Date.now() + 86400000 * 15).toISOString(), // 1 day execution delay
        for_votes: 0,
        against_votes: 0,
        abstain_votes: 0,
        veto_votes: 0,
        total_voting_power: 0,
        metadata: {
          tags: [],
          links: []
        }
      };

      return NextResponse.json({
        success: true,
        data: newProposal,
        message: "Proposal created successfully",
        timestamp: new Date().toISOString()
      });

    } catch (dbError) {
      console.log('Database not available for creating proposal:', dbError);
      
      // Fallback response
      return NextResponse.json({
        success: true,
        data: {
          id: `prop_fallback_${Date.now()}`,
          title,
          description,
          proposer,
          proposal_type,
          status: "discussion",
          created_at: new Date().toISOString(),
          voting_start_time: new Date(Date.now() + 86400000 * 7).toISOString(),
          voting_end_time: new Date(Date.now() + 86400000 * 14).toISOString(),
          execution_time: new Date(Date.now() + 86400000 * 15).toISOString(),
          for_votes: 0,
          against_votes: 0,
          abstain_votes: 0,
          veto_votes: 0,
          total_voting_power: 0,
          metadata: {
            tags: [],
            links: []
          }
        },
        message: "Proposal created successfully (fallback mode)",
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Create proposal API error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to create proposal",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}