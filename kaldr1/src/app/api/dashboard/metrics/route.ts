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
    const timeframe = searchParams.get('timeframe') || '24h';

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

    // Fetch monitoring metrics
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
      take: 1000,
    });

    // Fetch contract executions for timeline
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
      take: 100,
    });

    // Calculate gas usage statistics
    const gasStats = await db.contractExecution.aggregate({
      where: {
        ...(contractId && { contractId }),
        createdAt: {
          gte: startTime,
          lte: now,
        },
        status: 'SUCCESS',
      },
      _avg: {
        gasUsed: true,
        gasPrice: true,
      },
      _max: {
        gasUsed: true,
        gasPrice: true,
      },
      _min: {
        gasUsed: true,
        gasPrice: true,
      },
      _count: true,
    });

    // Fetch recent security audits
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
      take: 10,
    });

    // Fetch active alerts
    const alerts = await db.alert.findMany({
      where: {
        ...(contractId && { contractId }),
        status: 'ACTIVE',
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
      take: 20,
    });

    // Process metrics for heatmap and charts
    const processedMetrics = metrics.map(metric => ({
      timestamp: metric.timestamp,
      gasUsed: metric.gasUsed,
      gasPrice: metric.gasPrice,
      executionTime: metric.executionTime,
      successRate: metric.successRate,
      tps: metric.tps,
      memoryUsage: metric.memoryUsage,
    }));

    // Group metrics by hour for heatmap
    const hourlyMetrics = {};
    metrics.forEach(metric => {
      const hour = new Date(metric.timestamp).getHours();
      if (!hourlyMetrics[hour]) {
        hourlyMetrics[hour] = [];
      }
      hourlyMetrics[hour].push(metric.gasUsed);
    });

    const gasHeatmap = Object.keys(hourlyMetrics).map(hour => ({
      hour: parseInt(hour),
      avgGas: hourlyMetrics[hour].reduce((a, b) => a + b, 0) / hourlyMetrics[hour].length,
      count: hourlyMetrics[hour].length,
    }));

    return NextResponse.json({
      metrics: processedMetrics,
      executions,
      gasStats: {
        avgGasUsed: gasStats._avg.gasUsed || 0,
        avgGasPrice: gasStats._avg.gasPrice || 0,
        maxGasUsed: gasStats._max.gasUsed || 0,
        maxGasPrice: gasStats._max.gasPrice || 0,
        minGasUsed: gasStats._min.gasUsed || 0,
        minGasPrice: gasStats._min.gasPrice || 0,
        totalExecutions: gasStats._count,
      },
      audits,
      alerts,
      gasHeatmap,
      timeframe,
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}