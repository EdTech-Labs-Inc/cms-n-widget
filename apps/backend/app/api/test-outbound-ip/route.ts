import { NextResponse } from 'next/server';

const REQUEST_BIN_URL = "https://eodjsdnkysuppvd.m.pipedream.net";

/**
 * GET /api/test-outbound-ip
 * Makes a request to RequestBin to test outbound IP from the backend service
 * Used to verify NAT gateway IP configuration
 */
export async function GET() {
  try {
    await fetch(REQUEST_BIN_URL);
    console.log("[API] Outbound IP test request sent to RequestBin");
    return NextResponse.json({ success: true, message: "Request sent to RequestBin" });
  } catch (error) {
    console.error("[API] Outbound IP test failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send request" },
      { status: 500 }
    );
  }
}
