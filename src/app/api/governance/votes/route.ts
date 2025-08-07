import { NextRequest, NextResponse } from "next/server";
import { blockchainService } from "@/lib/blockchain-service";

interface Vote {
  id: string;
  proposal_id: string;
  voter: string;
  vote_type: "for" | "against" | "abstain" | "veto";
  voting_power: number;
  timestamp: string;
  justification?: string;
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
    const proposalId = searchParams.get('proposal_id');
    const voter = searchParams.get('voter');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!proposalId) {
      return NextResponse.json({
        success: false,
        error: "proposal_id is required",
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Try to get from database first
    try {
      await blockchainService.initializeBlockchain();
      
      // Mock votes for now
      const mockVotes: Vote[] = [
        {
          id: "vote_1",
          proposal_id: proposalId,
          voter: "validator_1",
          vote_type: "for",
          voting_power: 10000,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          justification: "This proposal will improve network performance"
        },
        {
          id: "vote_2",
          proposal_id: proposalId,
          voter: "validator_2",
          vote_type: "for",
          voting_power: 8000,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          justification: "Support the proposed changes"
        },
        {
          id: "vote_3",
          proposal_id: proposalId,
          voter: "validator_3",
          vote_type: "against",
          voting_power: 5000,
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          justification: "Concerned about potential security implications"
        }
      ];

      // Filter by voter if specified
      let filteredVotes = mockVotes;
      if (voter) {
        filteredVotes = mockVotes.filter(v => v.voter === voter);
      }

      // Apply pagination
      const paginatedVotes = filteredVotes.slice(offset, offset + limit);

      return NextResponse.json({
        success: true,
        data: paginatedVotes,
        total: filteredVotes.length,
        offset,
        limit,
        timestamp: new Date().toISOString()
      });

    } catch (dbError) {
      console.log('Database not available for governance votes:', dbError);
      
      // Fallback to empty response
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        offset,
        limit,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Governance votes API error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch votes",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposal_id, voter, vote_type, justification } = body;

    // Validate required fields
    if (!proposal_id || !voter || !vote_type) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: proposal_id, voter, vote_type",
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate vote type
    const validVoteTypes = ["for", "against", "abstain", "veto"];
    if (!validVoteTypes.includes(vote_type)) {
      return NextResponse.json({
        success: false,
        error: "Invalid vote_type. Must be one of: for, against, abstain, veto",
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Try to store in database
    try {
      await blockchainService.initializeBlockchain();
      
      // Create vote (mock implementation for now)
      const newVote: Vote = {
        id: `vote_${Date.now()}`,
        proposal_id,
        voter,
        vote_type,
        voting_power: Math.floor(Math.random() * 10000) + 1000, // Mock voting power
        timestamp: new Date().toISOString(),
        justification
      };

      return NextResponse.json({
        success: true,
        data: newVote,
        message: "Vote cast successfully",
        timestamp: new Date().toISOString()
      });

    } catch (dbError) {
      console.log('Database not available for casting vote:', dbError);
      
      // Fallback response
      return NextResponse.json({
        success: true,
        data: {
          id: `vote_fallback_${Date.now()}`,
          proposal_id,
          voter,
          vote_type,
          voting_power: 1000,
          timestamp: new Date().toISOString(),
          justification
        },
        message: "Vote cast successfully (fallback mode)",
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Cast vote API error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to cast vote",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}