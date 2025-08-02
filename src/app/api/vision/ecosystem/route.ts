import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 450));

    const ecosystemMaturity = {
      sustainability_score: 92,
      governance_health: 88,
      economic_vitality: 85,
      community_engagement: 90,
      innovation_rate: 87,
      self_sufficiency: 84,
      last_updated: new Date().toISOString()
    };

    const ecosystemHealth = {
      overall_score: 88,
      categories: [
        {
          name: "Sustainability",
          score: 92,
          weight: 0.20,
          description: "Long-term ecosystem viability and environmental impact"
        },
        {
          name: "Governance Health",
          score: 88,
          weight: 0.18,
          description: "Decentralized governance effectiveness and participation"
        },
        {
          name: "Economic Vitality",
          score: 85,
          weight: 0.16,
          description: "Economic activity, token utility, and financial health"
        },
        {
          name: "Community Engagement",
          score: 90,
          weight: 0.15,
          description: "Community participation, retention, and growth"
        },
        {
          name: "Innovation Rate",
          score: 87,
          weight: 0.16,
          description: "Pace of innovation and technological advancement"
        },
        {
          name: "Self-Sufficiency",
          score: 84,
          weight: 0.15,
          description: "Ecosystem independence and sustainability"
        }
      ]
    };

    const maturityIndicators = [
      {
        indicator: "Developer Activity",
        value: 94,
        trend: "increasing",
        description: "Active developer contributions and engagement"
      },
      {
        indicator: "Project Diversity",
        value: 87,
        trend: "stable",
        description: "Variety and quality of ecosystem projects"
      },
      {
        indicator: "Token Distribution",
        value: 82,
        trend: "improving",
        description: "Fair and decentralized token distribution"
      },
      {
        indicator: "Network Effect",
        value: 89,
        trend: "increasing",
        description: "Value growth through network expansion"
      },
      {
        indicator: "Regulatory Compliance",
        value: 91,
        trend: "stable",
        description: "Adherence to regulatory requirements"
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        ecosystem_maturity: ecosystemMaturity,
        ecosystem_health: ecosystemHealth,
        maturity_indicators: maturityIndicators
      }
    });

  } catch (error) {
    console.error('Error fetching ecosystem maturity data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ecosystem maturity data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Handle different actions
    switch (action) {
      case 'update_maturity_score':
        // Simulate updating maturity score
        await new Promise(resolve => setTimeout(resolve, 300));
        return NextResponse.json({
          success: true,
          message: 'Maturity score updated successfully'
        });

      case 'add_indicator':
        // Simulate adding new indicator
        await new Promise(resolve => setTimeout(resolve, 300));
        return NextResponse.json({
          success: true,
          message: 'Indicator added successfully'
        });

      case 'update_health_metrics':
        // Simulate updating health metrics
        await new Promise(resolve => setTimeout(resolve, 300));
        return NextResponse.json({
          success: true,
          message: 'Health metrics updated successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in ecosystem maturity POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}