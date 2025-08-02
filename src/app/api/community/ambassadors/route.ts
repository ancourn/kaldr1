import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 450));

    const ambassadors = [
      {
        id: 'amb-001',
        name: 'Sarah Chen',
        country: 'Singapore',
        role: 'Technical Lead',
        contributions: 147,
        events_organized: 12,
        community_score: 95,
        join_date: '2023-06-15',
        expertise: ['Post-Quantum Cryptography', 'Blockchain Development', 'Smart Contracts'],
        languages: ['English', 'Mandarin', 'Japanese'],
        social_media: {
          twitter: '@sarahchen_dev',
          github: 'sarahchen',
          linkedin: 'sarahchen-blockchain'
        },
        achievements: ['Best Technical Contributor 2023', 'Community Builder Award', 'Top 10 KALDRIX Contributors']
      },
      {
        id: 'amb-002',
        name: 'Marcus Weber',
        country: 'Germany',
        role: 'Community Manager',
        contributions: 203,
        events_organized: 18,
        community_score: 98,
        join_date: '2023-03-20',
        expertise: ['Community Building', 'Event Management', 'Developer Relations'],
        languages: ['English', 'German', 'French'],
        social_media: {
          twitter: '@marcusweber_kdx',
          github: 'marcusweber',
          linkedin: 'marcusweber-community'
        },
        achievements: ['Community Manager of the Year 2023', 'Event Excellence Award', '100+ Events Organized']
      },
      {
        id: 'amb-003',
        name: 'Elena Rodriguez',
        country: 'Spain',
        role: 'Developer Advocate',
        contributions: 189,
        events_organized: 15,
        community_score: 92,
        join_date: '2023-08-10',
        expertise: ['Developer Education', 'Technical Writing', 'API Documentation'],
        languages: ['English', 'Spanish', 'Portuguese'],
        social_media: {
          twitter: '@elenarodriguez_dev',
          github: 'elenarodriguez',
          linkedin: 'elenarodriguez-devrel'
        },
        achievements: ['Best Documentation 2023', 'Developer Advocate of the Quarter', 'Top 5 Content Creators']
      },
      {
        id: 'amb-004',
        name: 'Akira Tanaka',
        country: 'Japan',
        role: 'Research Lead',
        contributions: 167,
        events_organized: 8,
        community_score: 89,
        join_date: '2023-09-05',
        expertise: ['Quantum Computing', 'Cryptographic Research', 'Academic Partnerships'],
        languages: ['English', 'Japanese', 'Korean'],
        social_media: {
          twitter: '@akiratanaka_qc',
          github: 'akiratanaka',
          linkedin: 'akiratanaka-research'
        },
        achievements: ['Research Excellence Award 2023', 'Academic Partnership Builder', 'Top Research Contributor']
      },
      {
        id: 'amb-005',
        name: 'Priya Patel',
        country: 'India',
        role: 'Regional Lead',
        contributions: 156,
        events_organized: 22,
        community_score: 94,
        join_date: '2023-07-12',
        expertise: ['Regional Community Building', 'Event Management', 'Partnership Development'],
        languages: ['English', 'Hindi', 'Gujarati'],
        social_media: {
          twitter: '@priyapatel_kdx',
          github: 'priyapatel',
          linkedin: 'priyapatel-community'
        },
        achievements: ['Regional Community Builder 2023', 'Partnership Excellence Award', 'Fastest Growing Community']
      }
    ];

    const ambassadorStats = {
      total_ambassadors: ambassadors.length,
      total_contributions: ambassadors.reduce((sum, a) => sum + a.contributions, 0),
      total_events_organized: ambassadors.reduce((sum, a) => sum + a.events_organized, 0),
      average_community_score: Math.round(ambassadors.reduce((sum, a) => sum + a.community_score, 0) / ambassadors.length),
      countries_represented: [...new Set(ambassadors.map(a => a.country))].length,
      languages_spoken: [...new Set(ambassadors.flatMap(a => a.languages))].length
    };

    const regionalDistribution = {
      'Asia-Pacific': ambassadors.filter(a => ['Singapore', 'Japan', 'India'].includes(a.country)).length,
      'Europe': ambassadors.filter(a => ['Germany', 'Spain'].includes(a.country)).length,
      'Americas': ambassadors.filter(a => ['USA', 'Canada', 'Brazil'].includes(a.country)).length,
      'Africa': ambassadors.filter(a => ['South Africa', 'Nigeria', 'Kenya'].includes(a.country)).length,
      'Middle East': ambassadors.filter(a => ['UAE', 'Saudi Arabia', 'Israel'].includes(a.country)).length
    };

    const contributionBreakdown = {
      'Technical': ambassadors.filter(a => a.expertise.includes('Post-Quantum Cryptography') || a.expertise.includes('Blockchain Development')).reduce((sum, a) => sum + a.contributions, 0),
      'Community': ambassadors.filter(a => a.expertise.includes('Community Building') || a.expertise.includes('Event Management')).reduce((sum, a) => sum + a.contributions, 0),
      'Research': ambassadors.filter(a => a.expertise.includes('Quantum Computing') || a.expertise.includes('Cryptographic Research')).reduce((sum, a) => sum + a.contributions, 0),
      'Education': ambassadors.filter(a => a.expertise.includes('Developer Education') || a.expertise.includes('Technical Writing')).reduce((sum, a) => sum + a.contributions, 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        ambassadors: ambassadors,
        ambassador_stats: ambassadorStats,
        regional_distribution: regionalDistribution,
        contribution_breakdown: contributionBreakdown
      }
    });

  } catch (error) {
    console.error('Error fetching community ambassadors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch community ambassadors' },
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
      case 'nominate_ambassador':
        // Simulate ambassador nomination
        await new Promise(resolve => setTimeout(resolve, 800));
        return NextResponse.json({
          success: true,
          message: 'Ambassador nomination submitted successfully',
          nomination_id: `nom-${Date.now()}`,
          nominee: data?.nominee_name,
          review_timeline: '2-3 weeks'
        });

      case 'update_ambassador_profile':
        // Simulate updating ambassador profile
        await new Promise(resolve => setTimeout(resolve, 500));
        return NextResponse.json({
          success: true,
          message: 'Ambassador profile updated successfully',
          ambassador_id: data?.ambassador_id,
          updated_fields: data?.updated_fields || []
        });

      case 'record_contribution':
        // Simulate recording contribution
        await new Promise(resolve => setTimeout(resolve, 400));
        return NextResponse.json({
          success: true,
          message: 'Contribution recorded successfully',
          ambassador_id: data?.ambassador_id,
          contribution_id: `cont-${Date.now()}`,
          contribution_type: data?.contribution_type
        });

      case 'organize_event':
        // Simulate event organization
        await new Promise(resolve => setTimeout(resolve, 600));
        return NextResponse.json({
          success: true,
          message: 'Event organization request submitted',
          ambassador_id: data?.ambassador_id,
          event_id: `event-${Date.now()}`,
          approval_status: 'pending'
        });

      case 'generate_ambassador_report':
        // Simulate generating ambassador report
        await new Promise(resolve => setTimeout(resolve, 700));
        return NextResponse.json({
          success: true,
          message: 'Ambassador report generated successfully',
          ambassador_id: data?.ambassador_id,
          report_url: '/reports/ambassador-performance.pdf',
          report_period: data?.period || 'last_30_days'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in community ambassadors POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}