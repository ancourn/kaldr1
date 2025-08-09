import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  contractId: string;
  type: 'gas_spike' | 'transaction_failure' | 'security_breach' | 'performance_degradation' | 'audit_failure';
  conditions: Record<string, any>;
  actions: {
    email: boolean;
    webhook: boolean;
    push: boolean;
    webhookUrl?: string;
    emailRecipients?: string[];
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');

    // Build query conditions
    const whereClause: any = {};
    if (contractId) whereClause.contractId = contractId;

    // Fetch alert rules
    const rules = await db.alertRule.findMany({
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
    });

    return NextResponse.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error('Alert rules fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert rules' },
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
    const { name, description, contractId, type, conditions, actions, severity, enabled } = body;

    // Validate required fields
    if (!name || !contractId || !type || !conditions || !actions || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has permission to manage this contract
    const contract = await db.smartContract.findUnique({
      where: { id: contractId },
      select: { owner: true },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Only contract owners or admins can manage alert rules
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (contract.owner !== session.user.id && currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Create alert rule
    const rule = await db.alertRule.create({
      data: {
        name,
        description,
        contractId,
        type,
        conditions,
        actions,
        severity,
        enabled: enabled ?? true,
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

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error('Alert rule creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create alert rule' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ruleId, name, description, conditions, actions, severity, enabled } = body;

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Missing ruleId' },
        { status: 400 }
      );
    }

    // Check if user has permission to manage this rule
    const existingRule = await db.alertRule.findUnique({
      where: { id: ruleId },
      include: {
        contract: {
          select: { owner: true },
        },
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Alert rule not found' },
        { status: 404 }
      );
    }

    // Only contract owners or admins can manage alert rules
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (existingRule.contract.owner !== session.user.id && currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update alert rule
    const rule = await db.alertRule.update({
      where: { id: ruleId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(conditions && { conditions }),
        ...(actions && { actions }),
        ...(severity && { severity }),
        ...(enabled !== undefined && { enabled }),
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
      data: rule,
    });
  } catch (error) {
    console.error('Alert rule update error:', error);
    return NextResponse.json(
      { error: 'Failed to update alert rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Missing ruleId' },
        { status: 400 }
      );
    }

    // Check if user has permission to delete this rule
    const existingRule = await db.alertRule.findUnique({
      where: { id: ruleId },
      include: {
        contract: {
          select: { owner: true },
        },
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Alert rule not found' },
        { status: 404 }
      );
    }

    // Only contract owners or admins can delete alert rules
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (existingRule.contract.owner !== session.user.id && currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete alert rule
    await db.alertRule.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({
      success: true,
      message: 'Alert rule deleted successfully',
    });
  } catch (error) {
    console.error('Alert rule deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert rule' },
      { status: 500 }
    );
  }
}