import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const globalMetrics = {
      total_countries: 147,
      enterprise_adoptions: 2847,
      developer_community: 125000,
      ecosystem_projects: 3420,
      market_cap: 8750000000,
      daily_transactions: 2847000,
      network_nodes: 15420,
      governance_participants: 8750,
      last_updated: new Date().toISOString()
    };

    const regionalData = [
      {
        region: "North America",
        countries: 3,
        enterprises: 892,
        developers: 42500,
        projects: 1240,
        adoption_rate: 87,
        growth_trend: 'rising'
      },
      {
        region: "Europe",
        countries: 28,
        enterprises: 756,
        developers: 38200,
        projects: 980,
        adoption_rate: 82,
        growth_trend: 'rising'
      },
      {
        region: "Asia Pacific",
        countries: 24,
        enterprises: 634,
        developers: 28900,
        projects: 756,
        adoption_rate: 78,
        growth_trend: 'rising'
      },
      {
        region: "Latin America",
        countries: 20,
        enterprises: 287,
        developers: 8900,
        projects: 234,
        adoption_rate: 65,
        growth_trend: 'rising'
      },
      {
        region: "Middle East & Africa",
        countries: 72,
        enterprises: 278,
        developers: 6500,
        projects: 210,
        adoption_rate: 58,
        growth_trend: 'stable'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        global_metrics: globalMetrics,
        regional_data: regionalData
      }
    });

  } catch (error) {
    console.error('Error fetching global adoption data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch global adoption data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Handle different actions
    switch (action) {
      case 'update_metrics':
        // Simulate updating metrics
        await new Promise(resolve => setTimeout(resolve, 300));
        return NextResponse.json({
          success: true,
          message: 'Global metrics updated successfully'
        });

      case 'add_region':
        // Simulate adding new region data
        await new Promise(resolve => setTimeout(resolve, 300));
        return NextResponse.json({
          success: true,
          message: 'Region data added successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in global adoption POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}