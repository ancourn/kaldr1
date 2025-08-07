import { NextRequest, NextResponse } from "next/server";
import { blockchainService } from "@/lib/blockchain-service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'health':
        const health = await blockchainService.healthCheck();
        return NextResponse.json({
          success: true,
          data: health,
          timestamp: new Date().toISOString()
        });

      case 'seed':
        try {
          await blockchainService.seedDatabase();
          return NextResponse.json({
            success: true,
            message: "Database seeded successfully",
            timestamp: new Date().toISOString()
          });
        } catch (seedError) {
          return NextResponse.json({
            success: false,
            error: "Failed to seed database",
            details: seedError instanceof Error ? seedError.message : "Unknown error",
            timestamp: new Date().toISOString()
          }, { status: 500 });
        }

      case 'init':
        try {
          await blockchainService.initializeBlockchain();
          return NextResponse.json({
            success: true,
            message: "Blockchain initialized successfully",
            timestamp: new Date().toISOString()
          });
        } catch (initError) {
          return NextResponse.json({
            success: false,
            error: "Failed to initialize blockchain",
            details: initError instanceof Error ? initError.message : "Unknown error",
            timestamp: new Date().toISOString()
          }, { status: 500 });
        }

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action. Use: health, seed, or init",
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Database API error:', error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'seed':
        try {
          await blockchainService.seedDatabase();
          return NextResponse.json({
            success: true,
            message: "Database seeded successfully",
            timestamp: new Date().toISOString()
          });
        } catch (seedError) {
          return NextResponse.json({
            success: false,
            error: "Failed to seed database",
            details: seedError instanceof Error ? seedError.message : "Unknown error",
            timestamp: new Date().toISOString()
          }, { status: 500 });
        }

      case 'reset':
        try {
          // This would implement a database reset functionality
          // For now, just return success
          return NextResponse.json({
            success: true,
            message: "Database reset functionality not implemented yet",
            timestamp: new Date().toISOString()
          });
        } catch (resetError) {
          return NextResponse.json({
            success: false,
            error: "Failed to reset database",
            details: resetError instanceof Error ? resetError.message : "Unknown error",
            timestamp: new Date().toISOString()
          }, { status: 500 });
        }

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action",
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Database API POST error:', error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}