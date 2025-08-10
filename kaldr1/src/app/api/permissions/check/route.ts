import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contractId, action } = body;

    if (!contractId || !action) {
      return NextResponse.json(
        { error: 'Missing contractId or action' },
        { status: 400 }
      );
    }

    // Get user's role and permissions for this contract
    const userPermission = await db.contractPermission.findUnique({
      where: {
        contractId_userId: {
          contractId,
          userId: session.user.id,
        },
      },
    });

    // Get contract details to check ownership
    const contract = await db.smartContract.findUnique({
      where: { id: contractId },
      select: { owner: true, status: true },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if user is the contract owner
    const isOwner = contract.owner === session.user.id;

    // Get user's global role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const globalRole = user?.role || 'DEVELOPER';

    // Define permission matrix
    const permissionMatrix = {
      // Global admin permissions
      ADMIN: {
        read: true,
        write: true,
        deploy: true,
        invoke: true,
        freeze: true,
        unfreeze: true,
        audit: true,
        manage_permissions: true,
        delete: true,
      },
      // Global auditor permissions
      AUDITOR: {
        read: true,
        write: false,
        deploy: false,
        invoke: false,
        freeze: false,
        unfreeze: false,
        audit: true,
        manage_permissions: false,
        delete: false,
      },
      // Default developer permissions
      DEVELOPER: {
        read: true,
        write: false,
        deploy: false,
        invoke: false,
        freeze: false,
        unfreeze: false,
        audit: false,
        manage_permissions: false,
        delete: false,
      },
    };

    // Check permissions based on role hierarchy
    let hasPermission = false;

    // 1. Check global role permissions
    if (globalRole === 'ADMIN') {
      hasPermission = permissionMatrix.ADMIN[action] || false;
    } else if (globalRole === 'AUDITOR') {
      hasPermission = permissionMatrix.AUDITOR[action] || false;
    } else if (globalRole === 'DEVELOPER') {
      hasPermission = permissionMatrix.DEVELOPER[action] || false;
    }

    // 2. If not allowed by global role, check contract-specific permissions
    if (!hasPermission && userPermission) {
      const contractRole = userPermission.role;
      const contractPermissions = userPermission.permissions;

      // Check role-based permissions
      if (contractRole === 'OWNER') {
        hasPermission = permissionMatrix.ADMIN[action] || false;
      } else if (contractRole === 'DEVELOPER') {
        hasPermission = permissionMatrix.DEVELOPER[action] || false;
      } else if (contractRole === 'AUDITOR') {
        hasPermission = permissionMatrix.AUDITOR[action] || false;
      }

      // Check specific permissions if still not allowed
      if (!hasPermission && contractPermissions && contractPermissions.includes(action)) {
        hasPermission = true;
      }
    }

    // 3. Contract owners always have full permissions
    if (isOwner) {
      hasPermission = true;
    }

    // Special checks for contract status
    if (action === 'invoke' && contract.status === 'FROZEN') {
      hasPermission = false;
    }

    return NextResponse.json({
      success: true,
      data: {
        hasPermission,
        isOwner,
        globalRole,
        contractRole: userPermission?.role || null,
        action,
        contractStatus: contract.status,
      },
    });
  } catch (error) {
    console.error('Permission check error:', error);
    return NextResponse.json(
      { error: 'Failed to check permissions' },
      { status: 500 }
    );
  }
}