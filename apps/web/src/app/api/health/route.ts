import { NextResponse } from "next/server";

/**
 * Health check for deployments.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
