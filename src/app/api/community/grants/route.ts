import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const grantPrograms = [
      {
        id: 'grant-001',
        name: 'Quantum Resistance Innovation Grant',
        category: 'Research & Development',
        total_funding: 5000000,
        awarded_projects: 24,
        active_projects: 8,
        success_rate: 87,
        application_deadline: '2024-12-31',
        description: 'Funding for innovative quantum-resistant blockchain solutions',
        eligibility_criteria: ['Open source projects', 'Technical innovation', 'Community impact'],
        funding_range: [50000, 500000],
        review_process: 'Technical review + Community vote',
        duration: '3-12 months',
        mentorship_available: true
      },
      {
        id: 'grant-002',
        name: 'Ecosystem Development Grant',
        category: 'Community',
        total_funding: 2500000,
        awarded_projects: 18,
        active_projects: 6,
        success_rate: 92,
        application_deadline: '2024-11-30',
        description: 'Support for community projects and ecosystem expansion',
        eligibility_criteria: ['Community projects', 'Educational content', 'Developer tools'],
        funding_range: [10000, 100000],
        review_process: 'Community review + Team evaluation',
        duration: '1-6 months',
        mentorship_available: true
      },
      {
        id: 'grant-003',
        name: 'Educational Content Grant',
        category: 'Education',
        total_funding: 1000000,
        awarded_projects: 32,
        active_projects: 12,
        success_rate: 95,
        application_deadline: '2024-12-15',
        description: 'Funding for educational content and learning resources',
        eligibility_criteria: ['Educational projects', 'Content creation', 'Learning platforms'],
        funding_range: [5000, 50000],
        review_process: 'Content review + Educational value assessment',
        duration: '1-3 months',
        mentorship_available: true
      },
      {
        id: 'grant-004',
        name: 'Startup Acceleration Grant',
        category: 'Startup',
        total_funding: 3000000,
        awarded_projects: 12,
        active_projects: 4,
        success_rate: 83,
        application_deadline: '2025-01-15',
        description: 'Funding for early-stage startups building on KALDRIX',
        eligibility_criteria: ['Early-stage startups', 'KALDRIX integration', 'Growth potential'],
        funding_range: [100000, 500000],
        review_process: 'Business review + Technical assessment',
        duration: '6-18 months',
        mentorship_available: true
      }
    ];

    const grantStats = {
      total_programs: grantPrograms.length,
      total_funding: grantPrograms.reduce((sum, g) => sum + g.total_funding, 0),
      total_awarded_projects: grantPrograms.reduce((sum, g) => sum + g.awarded_projects, 0),
      total_active_projects: grantPrograms.reduce((sum, g) => sum + g.active_projects, 0),
      average_success_rate: Math.round(grantPrograms.reduce((sum, g) => sum + g.success_rate, 0) / grantPrograms.length),
      total_funding_distributed: grantPrograms.reduce((sum, g) => sum + (g.total_funding * g.awarded_projects / (g.awarded_projects + g.active_projects)), 0)
    };

    const categoryBreakdown = {
      'Research & Development': grantPrograms.filter(g => g.category === 'Research & Development'),
      'Community': grantPrograms.filter(g => g.category === 'Community'),
      'Education': grantPrograms.filter(g => g.category === 'Education'),
      'Startup': grantPrograms.filter(g => g.category === 'Startup')
    };

    const recentApplications = [
      {
        id: 'app-001',
        project_name: 'Quantum-Resistant DeFi Platform',
        grant_program: 'Quantum Resistance Innovation Grant',
        applicant: 'QuantumDeFi Labs',
        status: 'under_review',
        submission_date: '2024-11-01',
        requested_amount: 250000
      },
      {
        id: 'app-002',
        project_name: 'KALDRIX Developer Documentation',
        grant_program: 'Educational Content Grant',
        applicant: 'DevDocs Team',
        status: 'approved',
        submission_date: '2024-10-25',
        requested_amount: 35000,
        approved_amount: 35000
      },
      {
        id: 'app-003',
        project_name: 'Community Mobile App',
        grant_program: 'Ecosystem Development Grant',
        applicant: 'Mobile Community Builders',
        status: 'pending',
        submission_date: '2024-11-05',
        requested_amount: 75000
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        grant_programs: grantPrograms,
        grant_stats: grantStats,
        category_breakdown: categoryBreakdown,
        recent_applications: recentApplications
      }
    });

  } catch (error) {
    console.error('Error fetching community grants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch community grants' },
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
      case 'submit_application':
        // Simulate grant application submission
        await new Promise(resolve => setTimeout(resolve, 800));
        return NextResponse.json({
          success: true,
          message: 'Grant application submitted successfully',
          application_id: `app-${Date.now()}`,
          grant_program: data?.grant_program,
          project_name: data?.project_name,
          review_timeline: '4-6 weeks'
        });

      case 'review_application':
        // Simulate application review
        await new Promise(resolve => setTimeout(resolve, 600));
        return NextResponse.json({
          success: true,
          message: 'Application review completed',
          application_id: data?.application_id,
          decision: data?.decision || 'approved',
          feedback: 'Application shows strong potential and community impact'
        });

      case 'approve_grant':
        // Simulate grant approval
        await new Promise(resolve => setTimeout(resolve, 700));
        return NextResponse.json({
          success: true,
          message: 'Grant approved successfully',
          application_id: data?.application_id,
          approved_amount: data?.approved_amount,
          funding_schedule: 'Quarterly disbursements',
          next_milestone_review: data?.next_review_date
        });

      case 'create_grant_program':
        // Simulate creating new grant program
        await new Promise(resolve => setTimeout(resolve, 900));
        return NextResponse.json({
          success: true,
          message: 'Grant program created successfully',
          program_id: `grant-${Date.now()}`,
          program_details: {
            name: data?.program_name,
            category: data?.category,
            total_funding: data?.total_funding,
            application_deadline: data?.application_deadline
          }
        });

      case 'generate_grant_report':
        // Simulate generating grant report
        await new Promise(resolve => setTimeout(resolve, 500));
        return NextResponse.json({
          success: true,
          message: 'Grant report generated successfully',
          report_type: data?.report_type || 'program_summary',
          report_url: '/reports/grant-program-summary.pdf',
          generated_at: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in community grants POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}