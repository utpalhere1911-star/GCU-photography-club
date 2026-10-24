import { NextResponse } from "next/server";

/**
 * Diagnostic and development session bypass route has been permanently decommissioned
 * as part of the security audit and handover hardening.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Not Found" },
    { status: 404 }
  );
}
