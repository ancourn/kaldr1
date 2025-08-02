import { NextRequest, NextResponse } from "next/server";

interface Partnership {
  id: string;
  name: string;
  industry: string;
  status: "active" | "pending" | "completed" | "terminated";
  integration_level: number;
  projects_count: number;
  contact_email: string;
  website?: string;
  logo_url?: string;
  partnership_type: "technology" | "enterprise" | "financial" | "community";
  started_at: string;
  updated_at: string;
  description: string;
  achievements: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    // Mock partnerships for demonstration
    const mockPartnerships: Partnership[] = [
      {
        id: "partner1",
        name: "TechCorp Solutions",
        industry: "Technology",
        status: "active",
        integration_level: 95,
        projects_count: 8,
        contact_email: "partnerships@techcorp.com",
        website: "https://techcorp.com",
        partnership_type: "technology",
        started_at: "2023-06-01T00:00:00Z",
        updated_at: "2024-02-01T00:00:00Z",
        description: "Leading technology provider specializing in blockchain integration solutions",
        achievements: [
          "Integrated KALDRIX with 8 enterprise systems",
          "Processed over 1M transactions",
          "Achieved 99.9% uptime",
          "Reduced operational costs by 40%"
        ]
      },
      {
        id: "partner2",
        name: "FinanceChain Inc",
        industry: "Finance",
        status: "active",
        integration_level: 87,
        projects_count: 5,
        contact_email: "bd@financechain.com",
        website: "https://financechain.com",
        partnership_type: "financial",
        started_at: "2023-08-15T00:00:00Z",
        updated_at: "2024-01-28T00:00:00Z",
        description: "Financial services company leveraging KALDRIX for DeFi solutions",
        achievements: [
          "Launched 5 DeFi protocols",
          "Managed $50M in assets",
          "Onboarded 10,000+ users",
          "Achieved regulatory compliance"
        ]
      },
      {
        id: "partner3",
        name: "HealthSecure",
        industry: "Healthcare",
        status: "pending",
        integration_level: 45,
        projects_count: 2,
        contact_email: "innovation@healthsecure.com",
        website: "https://healthsecure.com",
        partnership_type: "enterprise",
        started_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-02-01T00:00:00Z",
        description: "Healthcare technology company implementing secure medical data solutions",
        achievements: [
          "Completed security audit",
          "Developed prototype system",
          "Received regulatory approval",
          "Pilot program with 3 hospitals"
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockPartnerships,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Partnerships API error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch partnerships",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'industry', 'partnership_type', 'contact_email'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    // Create new partnership
    const newPartnership: Partnership = {
      id: `partner${Date.now()}`,
      name: body.name,
      industry: body.industry,
      status: "pending",
      integration_level: 0,
      projects_count: 0,
      contact_email: body.contact_email,
      website: body.website,
      partnership_type: body.partnership_type,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: body.description || "",
      achievements: []
    };

    return NextResponse.json({
      success: true,
      data: newPartnership,
      message: "Partnership created successfully",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create partnership API error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to create partnership",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}