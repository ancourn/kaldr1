import { NextResponse } from "next/server";

export async function GET() {
  const healthData = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      server: "online",
      database: "connected",
      ai_services: "active"
    },
    endpoints: {
      health: "/api/health",
      chat: "/api/chat",
      image: "/api/image",
      search: "/api/search"
    },
    uptime: process.uptime()
  };

  return NextResponse.json(healthData);
}