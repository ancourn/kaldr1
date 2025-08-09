import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query conditions
    const whereClause: any = {};
    if (contractId) whereClause.contractId = contractId;
    if (status) whereClause.status = status;
    if (severity) whereClause.severity = severity;

    // Fetch alerts
    const alerts = await db.alert.findMany({
      where: whereClause,
      include: {
        contract: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contractId, type, severity, message, metadata } = body;

    // Validate required fields
    if (!contractId || !type || !severity || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create alert
    const alert = await db.alert.create({
      data: {
        contractId,
        type,
        severity,
        message,
        metadata: metadata || {},
        status: 'ACTIVE',
        createdBy: session.user.id,
      },
      include: {
        contract: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    // Send notifications (this would integrate with email/webhook services)
    await sendAlertNotifications(alert);

    return NextResponse.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('Alert creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, status, acknowledgedBy } = body;

    if (!alertId || !status) {
      return NextResponse.json(
        { error: 'Missing alertId or status' },
        { status: 400 }
      );
    }

    // Update alert
    const alert = await db.alert.update({
      where: { id: alertId },
      data: {
        status,
        acknowledgedBy: acknowledgedBy || session.user.id,
        acknowledgedAt: status === 'ACKNOWLEDGED' ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        contract: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('Alert update error:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

async function sendAlertNotifications(alert: any) {
  try {
    // This would integrate with email and webhook services
    console.log('Sending alert notifications:', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      contract: alert.contract.name,
    });

    // Mock notification sending
    // In a real implementation, this would:
    // 1. Send email notifications to subscribed users
    // 2. Trigger webhook calls to external monitoring systems
    // 3. Push notifications to connected clients via WebSocket
    // 4. Log to external monitoring services
  } catch (error) {
    console.error('Error sending alert notifications:', error);
  }
}