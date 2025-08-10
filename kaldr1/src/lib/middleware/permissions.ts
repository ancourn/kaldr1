import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface PermissionCheckOptions {
  contractId?: string;
  action: string;
  requireAuth?: boolean;
  globalRoles?: string[];
}

export async function checkPermission(
  request: NextRequest,
  options: PermissionCheckOptions
): Promise<{ authorized: boolean; error?: NextResponse }> {
  const { action, contractId, requireAuth = true, globalRoles = [] } = options;

  // Check authentication
  if (requireAuth) {
    const session = await getServerSession(authOptions);
    if (!session) {
      return {
        authorized: false,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }
  }

  // If no contract-specific check needed, just check global roles
  if (!contractId) {
    if (globalRoles.length === 0) {
      return { authorized: true };
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return {
        authorized: false,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !globalRoles.includes(user.role)) {
      return {
        authorized: false,
        error: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }),
      };
    }

    return { authorized: true };
  }

  // Check contract-specific permissions
  try {
    const permissionResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/permissions/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        contractId,
        action,
      }),
    });

    const permissionData = await permissionResponse.json();

    if (!permissionData.success || !permissionData.data.hasPermission) {
      return {
        authorized: false,
        error: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        ),
      };
    }

    return { authorized: true };
  } catch (error) {
    console.error('Permission check error:', error);
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Failed to check permissions' },
        { status: 500 }
      ),
    };
  }
}

export async function requirePermission(options: PermissionCheckOptions) {
  return async (request: NextRequest) => {
    const result = await checkPermission(request, options);
    if (!result.authorized) {
      return result.error;
    }
    return NextResponse.next();
  };
}