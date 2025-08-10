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
    const userId = searchParams.get('userId');

    // Build query conditions
    const whereClause: any = {};
    if (contractId) whereClause.contractId = contractId;
    if (userId) whereClause.userId = userId;

    // Fetch permissions
    const permissions = await db.contractPermission.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        contract: {
          select: {
            id: true,
            name: true,
            address: true,
            owner: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('Permissions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
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
    const { contractId, userId, role, permissions } = body;

    // Validate required fields
    if (!contractId || !userId || !role || !permissions) {
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

    // Only contract owners or admins can manage permissions
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

    // Check if permission already exists
    const existingPermission = await db.contractPermission.findUnique({
      where: {
        contractId_userId: {
          contractId,
          userId,
        },
      },
    });

    let permission;
    if (existingPermission) {
      // Update existing permission
      permission = await db.contractPermission.update({
        where: {
          contractId_userId: {
            contractId,
            userId,
          },
        },
        data: {
          role,
          permissions,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          contract: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });
    } else {
      // Create new permission
      permission = await db.contractPermission.create({
        data: {
          contractId,
          userId,
          role,
          permissions,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          contract: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: permission,
    });
  } catch (error) {
    console.error('Permission creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create permission' },
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
    const contractId = searchParams.get('contractId');
    const userId = searchParams.get('userId');

    if (!contractId || !userId) {
      return NextResponse.json(
        { error: 'Missing contractId or userId' },
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

    // Only contract owners or admins can manage permissions
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

    // Delete permission
    await db.contractPermission.delete({
      where: {
        contractId_userId: {
          contractId,
          userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Permission deleted successfully',
    });
  } catch (error) {
    console.error('Permission deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    );
  }
}