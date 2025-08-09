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
    const format = searchParams.get('format') || 'json';
    const timeframe = searchParams.get('timeframe') || '24h';
    const dataType = searchParams.get('dataType') || 'all';

    // Calculate time range based on timeframe
    const now = new Date();
    let startTime: Date;
    switch (timeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const exportData: any = {
      exportInfo: {
        timestamp: now.toISOString(),
        timeframe,
        format,
        dataType,
        contractId,
        exportedBy: session.user?.email,
      },
    };

    // Fetch data based on requested type
    if (dataType === 'all' || dataType === 'executions') {
      const executions = await db.contractExecution.findMany({
        where: {
          ...(contractId && { contractId }),
          createdAt: {
            gte: startTime,
            lte: now,
          },
        },
        include: {
          contract: {
            select: {
              name: true,
              address: true,
              bytecode: false, // Exclude large bytecode
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      exportData.executions = executions;
    }

    if (dataType === 'all' || dataType === 'metrics') {
      const metrics = await db.monitoringMetric.findMany({
        where: {
          ...(contractId && { contractId }),
          timestamp: {
            gte: startTime,
            lte: now,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      exportData.metrics = metrics;
    }

    if (dataType === 'all' || dataType === 'audits') {
      const audits = await db.securityAudit.findMany({
        where: {
          ...(contractId && { contractId }),
          createdAt: {
            gte: startTime,
            lte: now,
          },
        },
        include: {
          contract: {
            select: {
              name: true,
              address: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      exportData.audits = audits;
    }

    if (dataType === 'all' || dataType === 'alerts') {
      const alerts = await db.alert.findMany({
        where: {
          ...(contractId && { contractId }),
          createdAt: {
            gte: startTime,
            lte: now,
          },
        },
        include: {
          contract: {
            select: {
              name: true,
              address: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      exportData.alerts = alerts;
    }

    // Generate response based on format
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(exportData);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="kaldrix-dashboard-${timeframe}-${Date.now()}.csv"`,
        },
      });
    } else {
      // Return JSON format
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="kaldrix-dashboard-${timeframe}-${Date.now()}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Dashboard export error:', error);
    return NextResponse.json(
      { error: 'Failed to export dashboard data' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any): string {
  const rows: string[] = [];
  
  // Add header
  rows.push('Data Type,Timestamp,Contract ID,Contract Name,Details');
  
  // Process executions
  if (data.executions) {
    data.executions.forEach((execution: any) => {
      rows.push([
        'Execution',
        execution.createdAt,
        execution.contractId,
        execution.contract?.name || '',
        `Status: ${execution.status}, Gas Used: ${execution.gasUsed}, Function: ${execution.functionName}`
      ].join(','));
    });
  }
  
  // Process metrics
  if (data.metrics) {
    data.metrics.forEach((metric: any) => {
      rows.push([
        'Metric',
        metric.timestamp,
        metric.contractId,
        '',
        `Gas Used: ${metric.gasUsed}, TPS: ${metric.tps}, Success Rate: ${metric.successRate}%`
      ].join(','));
    });
  }
  
  // Process audits
  if (data.audits) {
    data.audits.forEach((audit: any) => {
      rows.push([
        'Audit',
        audit.createdAt,
        audit.contractId,
        audit.contract?.name || '',
        `Score: ${audit.score}, Status: ${audit.status}, Vulnerabilities: ${audit.vulnerabilities.length}`
      ].join(','));
    });
  }
  
  // Process alerts
  if (data.alerts) {
    data.alerts.forEach((alert: any) => {
      rows.push([
        'Alert',
        alert.createdAt,
        alert.contractId,
        alert.contract?.name || '',
        `Type: ${alert.type}, Severity: ${alert.severity}, Message: ${alert.message}`
      ].join(','));
    });
  }
  
  return rows.join('\n');
}