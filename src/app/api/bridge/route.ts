import { NextRequest, NextResponse } from 'next/server';
import { CrossChainBridge, BridgeConfig } from '@/modules/bridge/cross-chain-bridge';

// Global bridge instance
let bridge: CrossChainBridge | null = null;

function getBridge(): CrossChainBridge {
  if (!bridge) {
    const config: BridgeConfig = {
      supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'avalanche'],
      relayerNodes: ['relayer1.kaldrix.network', 'relayer2.kaldrix.network', 'relayer3.kaldrix.network'],
      validatorThreshold: 3,
      confirmationBlocks: 12,
      gasLimits: {
        ethereum: 300000n,
        polygon: 200000n,
        arbitrum: 150000n,
        optimism: 150000n,
        bsc: 250000n,
        avalanche: 200000n
      },
      feeStructure: {
        baseFee: BigInt(1000000000000000000), // 1 ETH
        percentageFee: 0.001, // 0.1%
        minFee: BigInt(500000000000000000), // 0.5 ETH
        maxFee: BigInt(5000000000000000000) // 5 ETH
      }
    };

    bridge = new CrossChainBridge(config);
    bridge.start().catch(console.error);
  }

  return bridge;
}

export async function GET(request: NextRequest) {
  try {
    const bridge = getBridge();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return NextResponse.json({
          status: 'operational',
          state: bridge.getState(),
          stats: bridge.getStats(),
          config: bridge.getConfig()
        });

      case 'transfers':
        const filters: any = {};
        const status = searchParams.get('status');
        const sourceChain = searchParams.get('sourceChain');
        const targetChain = searchParams.get('targetChain');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        if (status) filters.status = status as any;
        if (sourceChain) filters.sourceChain = sourceChain;
        if (targetChain) filters.targetChain = targetChain;
        if (from) filters.from = from;
        if (to) filters.to = to;

        const transfers = bridge.getTransfers(filters);
        return NextResponse.json({ transfers });

      case 'transfer':
        const transferId = searchParams.get('id');
        if (!transferId) {
          return NextResponse.json({ error: 'Transfer ID required' }, { status: 400 });
        }

        const transfer = bridge.getTransfer(transferId);
        if (!transfer) {
          return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
        }

        return NextResponse.json({ transfer });

      case 'validators':
        return NextResponse.json({
          validators: bridge.getValidators(),
          count: bridge.getValidators().length
        });

      case 'relayers':
        return NextResponse.json({
          relayers: bridge.getRelayers(),
          count: bridge.getRelayers().length
        });

      case 'health':
        return NextResponse.json({
          timestamp: Date.now(),
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          bridge: bridge.getState()
        });

      default:
        return NextResponse.json({
          message: 'KALDRIX Cross-Chain Bridge API',
          version: '1.0.0',
          endpoints: [
            '/bridge?action=status',
            '/bridge?action=transfers',
            '/bridge?action=transfer&id=<id>',
            '/bridge?action=validators',
            '/bridge?action=relayers',
            '/bridge?action=health'
          ]
        });
    }
  } catch (error) {
    console.error('Bridge API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const bridge = getBridge();
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'initiate':
        const { sourceChain, targetChain, from, to, amount, token, gasUsed } = data;
        
        if (!sourceChain || !targetChain || !from || !to || !amount || !token) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const transferId = await bridge.initiateTransfer({
          sourceChain,
          targetChain,
          from,
          to,
          amount: BigInt(amount),
          token,
          gasUsed: BigInt(gasUsed || 210000),
          blockNumber: 0,
          txHash: ''
        });

        return NextResponse.json({
          success: true,
          transferId,
          message: 'Transfer initiated successfully'
        });

      case 'addValidator':
        const { validator } = data;
        if (!validator) {
          return NextResponse.json(
            { error: 'Validator address required' },
            { status: 400 }
          );
        }

        bridge.addValidator(validator);
        return NextResponse.json({
          success: true,
          message: 'Validator added successfully'
        });

      case 'removeValidator':
        const { validator: validatorToRemove } = data;
        if (!validatorToRemove) {
          return NextResponse.json(
            { error: 'Validator address required' },
            { status: 400 }
          );
        }

        bridge.removeValidator(validatorToRemove);
        return NextResponse.json({
          success: true,
          message: 'Validator removed successfully'
        });

      case 'addRelayer':
        const { relayer } = data;
        if (!relayer) {
          return NextResponse.json(
            { error: 'Relayer address required' },
            { status: 400 }
          );
        }

        bridge.addRelayer(relayer);
        return NextResponse.json({
          success: true,
          message: 'Relayer added successfully'
        });

      case 'removeRelayer':
        const { relayer: relayerToRemove } = data;
        if (!relayerToRemove) {
          return NextResponse.json(
            { error: 'Relayer address required' },
            { status: 400 }
          );
        }

        bridge.removeRelayer(relayerToRemove);
        return NextResponse.json({
          success: true,
          message: 'Relayer removed successfully'
        });

      case 'configure':
        const { config } = data;
        if (!config) {
          return NextResponse.json(
            { error: 'Configuration required' },
            { status: 400 }
          );
        }

        bridge.configure(config);
        return NextResponse.json({
          success: true,
          message: 'Bridge configuration updated successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Bridge API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}