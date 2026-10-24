import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getExecutiveActivityReport } from "@/services/executiveManagementService";

/**
 * GET /api/admin/activity?userId=...
 * Query the rolling 5-day Executive Member session activity report.
 * Strictly restricted to authenticated Admins.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  const { searchParams } = new URL(req.url);
  const filterUserId = searchParams.get("userId") || undefined;

  try {
    const report = await getExecutiveActivityReport(filterUserId);
    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "Failed to load executive activity report.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
