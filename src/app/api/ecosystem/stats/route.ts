import { NextRequest, NextResponse } from "next/server";

interface DeveloperStats {
  active_developers: number;
  total_projects: number;
  grant_funded: number;
  documentation_pages: number;
  api_calls_today: number;
  sdk_downloads: number;
  community_members: number;
  tutorial_completions: number;
  monthly_growth: {
    developers: number;
    projects: number;
    grants: number;
    community: number;
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
    // Mock ecosystem stats for demonstration
    const mockStats: DeveloperStats = {
      active_developers: 1247,
      total_projects: 342,
      grant_funded: 28,
      documentation_pages: 156,
      api_calls_today: 2847392,
      sdk_downloads: 15678,
      community_members: 45632,
      tutorial_completions: 8934,
      monthly_growth: {
        developers: 15.2,  // +15.2%
        projects: 23.8,   // +23.8%
        grants: 5.4,      // +5.4%
        community: 18.7   // +18.7%
      }
    };

    return NextResponse.json({
      success: true,
      data: mockStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ecosystem stats API error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch ecosystem stats",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}