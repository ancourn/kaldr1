import { NextRequest, NextResponse } from "next/server";

interface GrantProgram {
  id: string;
  title: string;
  description: string;
  funding_amount: number;
  status: "open" | "in_review" | "awarded" | "completed";
  applicants: number;
  deadline: string;
  category: string;
  created_at: string;
  updated_at: string;
  requirements: string[];
  benefits: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    // Mock grant programs for demonstration
    const mockGrants: GrantProgram[] = [
      {
        id: "grant1",
        title: "DeFi Innovation Grant",
        description: "Building next-generation DeFi applications on KALDRIX",
        funding_amount: 50000,
        status: "open",
        applicants: 47,
        deadline: "2024-03-15",
        category: "DeFi",
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-02-01T00:00:00Z",
        requirements: [
          "Experience with blockchain development",
          "Understanding of DeFi protocols",
          "KALDRIX ecosystem knowledge",
          "Innovative project proposal"
        ],
        benefits: [
          "Funding up to $50,000",
          "Technical mentorship",
          "Marketing support",
          "Community exposure"
        ]
      },
      {
        id: "grant2",
        title: "NFT Ecosystem Grant",
        description: "Creating NFT platforms and marketplaces",
        funding_amount: 30000,
        status: "in_review",
        applicants: 23,
        deadline: "2024-02-28",
        category: "NFT",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-02-01T00:00:00Z",
        requirements: [
          "NFT development experience",
          "Smart contract expertise",
          "UI/UX design skills",
          "Community building experience"
        ],
        benefits: [
          "Funding up to $30,000",
          "NFT platform support",
          "Artist partnerships",
          "Marketplace integration"
        ]
      },
      {
        id: "grant3",
        title: "Enterprise Integration Grant",
        description: "Integrating KALDRIX with enterprise systems",
        funding_amount: 75000,
        status: "awarded",
        applicants: 12,
        deadline: "2024-01-31",
        category: "Enterprise",
        created_at: "2023-12-01T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
        requirements: [
          "Enterprise software experience",
          "System integration expertise",
          "Security certifications",
          "Scalability knowledge"
        ],
        benefits: [
          "Funding up to $75,000",
          "Enterprise partnerships",
          "Security audits",
          "Production deployment support"
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockGrants,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Grants API error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch grant programs",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'funding_amount', 'category', 'deadline'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    // Create new grant program
    const newGrant: GrantProgram = {
      id: `grant${Date.now()}`,
      title: body.title,
      description: body.description,
      funding_amount: body.funding_amount,
      status: "open",
      applicants: 0,
      deadline: body.deadline,
      category: body.category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      requirements: body.requirements || [],
      benefits: body.benefits || []
    };

    return NextResponse.json({
      success: true,
      data: newGrant,
      message: "Grant program created successfully",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create grant API error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to create grant program",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}