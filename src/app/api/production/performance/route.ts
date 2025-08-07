import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 450));

    const performanceMetrics = {
      system: {
        cpu_usage: 67,
        memory_usage: 72,
        disk_usage: 58,
        network_latency: 12,
        load_average: 2.1,
        uptime: 86400 * 30, // 30 days
        processes: 1247
      },
      network: {
        throughput_tps: 2847,
        block_confirmation_time: 2.1,
        api_response_time: 45,
        peer_connections: 15420,
        bandwidth_utilization: 67,
        packet_loss: 0.01
      },
      database: {
        performance_score: 94,
        query_cache_hit_rate: 94,
        connection_pool_utilization: 87,
        index_usage: 92,
        replication_lag: 12,
        slow_queries: 2
      },
      blockchain: {
        block_height: 1584720,
        transactions_per_second: 2847,
        average_block_time: 2.1,
        orphan_rate: 0.001,
        mempool_size: 1247,
        gas_price: 25
      }
    };

    const performanceHistory = {
      last_24h: {
        cpu_usage: [65, 68, 72, 69, 67, 71, 74, 70, 68, 66, 64, 67, 69, 71, 73, 72, 70, 68, 67, 66, 65, 67, 69, 71],
        memory_usage: [70, 72, 74, 73, 72, 71, 73, 75, 74, 72, 71, 70, 72, 74, 76, 75, 74, 73, 72, 71, 70, 72, 74, 75],
        throughput_tps: [2800, 2850, 2900, 2875, 2847, 2890, 2920, 2885, 2860, 2840, 2820, 2847, 2870, 2895, 2910, 2890, 2870, 2850, 2847, 2830, 2820, 2847, 2860, 2880]
      },
      trends: {
        cpu: 'stable',
        memory: 'stable',
        throughput: 'increasing',
        latency: 'decreasing'
      }
    };

    const alerts = [
      {
        id: 'perf-001',
        type: 'warning',
        message: 'CPU usage approaching 75% threshold',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        severity: 'medium',
        resolved: false
      },
      {
        id: 'perf-002',
        type: 'info',
        message: 'Network throughput increased by 15%',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        severity: 'low',
        resolved: true
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        performance_metrics: performanceMetrics,
        performance_history: performanceHistory,
        alerts: alerts
      }
    });

  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance metrics' },
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
      case 'optimize_performance':
        // Simulate performance optimization
        await new Promise(resolve => setTimeout(resolve, 800));
        return NextResponse.json({
          success: true,
          message: 'Performance optimization completed',
          improvements: {
            cpu_usage: { before: 72, after: 65 },
            memory_usage: { before: 75, after: 68 },
            response_time: { before: 55, after: 42 }
          }
        });

      case 'scale_resources':
        // Simulate resource scaling
        await new Promise(resolve => setTimeout(resolve, 1200));
        return NextResponse.json({
          success: true,
          message: 'Resources scaled successfully',
          scaling_details: {
            instances_added: 2,
            cpu_allocated: 8,
            memory_allocated: 32,
            storage_allocated: 1000
          }
        });

      case 'clear_cache':
        // Simulate cache clearing
        await new Promise(resolve => setTimeout(resolve, 300));
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully',
          cache_size_cleared: '2.4GB'
        });

      case 'restart_services':
        // Simulate service restart
        await new Promise(resolve => setTimeout(resolve, 1500));
        return NextResponse.json({
          success: true,
          message: 'Services restarted successfully',
          services_restarted: ['api-gateway', 'blockchain-node', 'database-primary']
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in performance POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}