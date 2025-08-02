import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 350));

    const events = [
      {
        id: 'event-001',
        title: 'Global KALDRIX Hackathon 2024',
        type: 'hackathon',
        date: '2024-12-15',
        location: 'Virtual',
        participants: 2500,
        status: 'upcoming',
        description: '48-hour hackathon focused on quantum-resistant blockchain applications',
        registration_link: 'https://hackathon.kaldrix.com',
        organizer: 'KALDRIX Foundation',
        prize_pool: 100000,
        categories: ['DeFi', 'NFTs', 'Gaming', 'Enterprise', 'Research'],
        judges: ['Dr. Sarah Chen', 'Prof. Marcus Weber', 'Elena Rodriguez']
      },
      {
        id: 'event-002',
        title: 'Post-Quantum Cryptography Workshop',
        type: 'workshop',
        date: '2024-11-20',
        location: 'San Francisco, USA',
        participants: 150,
        status: 'upcoming',
        description: 'Deep dive into post-quantum cryptography implementation',
        registration_link: 'https://workshop.kaldrix.com/pqc',
        organizer: 'KALDRIX Research Team',
        duration: '8 hours',
        skill_level: 'advanced',
        prerequisites: ['Basic cryptography', 'Programming experience']
      },
      {
        id: 'event-003',
        title: 'KALDRIX Community Meetup Berlin',
        type: 'meetup',
        date: '2024-11-10',
        location: 'Berlin, Germany',
        participants: 80,
        status: 'ongoing',
        description: 'Monthly community meetup and networking event',
        registration_link: 'https://meetup.kaldrix.com/berlin',
        organizer: 'Berlin KALDRIX Community',
        duration: '3 hours',
        agenda: ['Project updates', 'Technical discussions', 'Networking', 'Food & drinks']
      },
      {
        id: 'event-004',
        title: 'Blockchain Security Conference',
        type: 'conference',
        date: '2024-10-25',
        location: 'Singapore',
        participants: 500,
        status: 'completed',
        description: 'Annual conference on blockchain security and quantum resistance',
        organizer: 'KALDRIX Security Team',
        duration: '2 days',
        speakers: 25,
        topics: ['Quantum resistance', 'Smart contract security', 'Network security', 'Compliance']
      },
      {
        id: 'event-005',
        title: 'Developer Onboarding Webinar',
        type: 'webinar',
        date: '2024-11-25',
        location: 'Virtual',
        participants: 300,
        status: 'upcoming',
        description: 'Get started with KALDRIX development',
        registration_link: 'https://webinar.kaldrix.com/onboarding',
        organizer: 'KALDRIX Developer Relations',
        duration: '2 hours',
        level: 'beginner'
      }
    ];

    const eventStats = {
      total_events: events.length,
      upcoming_events: events.filter(e => e.status === 'upcoming').length,
      ongoing_events: events.filter(e => e.status === 'ongoing').length,
      completed_events: events.filter(e => e.status === 'completed').length,
      total_participants: events.reduce((sum, e) => sum + e.participants, 0),
      average_participants: Math.round(events.reduce((sum, e) => sum + e.participants, 0) / events.length)
    };

    const eventTypes = {
      hackathon: events.filter(e => e.type === 'hackathon').length,
      workshop: events.filter(e => e.type === 'workshop').length,
      conference: events.filter(e => e.type === 'conference').length,
      meetup: events.filter(e => e.type === 'meetup').length,
      webinar: events.filter(e => e.type === 'webinar').length
    };

    return NextResponse.json({
      success: true,
      data: {
        events: events,
        event_stats: eventStats,
        event_types: eventTypes
      }
    });

  } catch (error) {
    console.error('Error fetching community events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch community events' },
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
      case 'create_event':
        // Simulate creating new event
        await new Promise(resolve => setTimeout(resolve, 600));
        return NextResponse.json({
          success: true,
          message: 'Event created successfully',
          event_id: `event-${Date.now()}`,
          event_details: {
            title: data?.title,
            type: data?.type,
            date: data?.date,
            location: data?.location,
            status: 'upcoming'
          }
        });

      case 'register_for_event':
        // Simulate event registration
        await new Promise(resolve => setTimeout(resolve, 400));
        return NextResponse.json({
          success: true,
          message: 'Registration successful',
          event_id: data?.event_id,
          registration_id: `reg-${Date.now()}`,
          confirmation_email: data?.email
        });

      case 'update_event':
        // Simulate updating event
        await new Promise(resolve => setTimeout(resolve, 500));
        return NextResponse.json({
          success: true,
          message: 'Event updated successfully',
          event_id: data?.event_id,
          updated_fields: data?.updated_fields || []
        });

      case 'cancel_event':
        // Simulate event cancellation
        await new Promise(resolve => setTimeout(resolve, 300));
        return NextResponse.json({
          success: true,
          message: 'Event cancelled successfully',
          event_id: data?.event_id,
          refund_policy: 'Full refund available until 48 hours before event'
        });

      case 'send_event_reminder':
        // Simulate sending event reminders
        await new Promise(resolve => setTimeout(resolve, 200));
        return NextResponse.json({
          success: true,
          message: 'Event reminders sent successfully',
          event_id: data?.event_id,
          reminders_sent: data?.participant_count || 0
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in community events POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}