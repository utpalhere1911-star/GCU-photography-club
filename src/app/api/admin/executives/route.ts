import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isAllowedOrigin } from "@/lib/rateLimit";
import {
  listExecutiveMembers,
  createExecutiveMember,
  updateExecutiveStatus,
  resetExecutivePassword,
  deleteExecutiveMember,
} from "@/services/executiveManagementService";

/**
 * GET /api/admin/executives
 * List all Executive Members. Strictly restricted to authenticated Admins.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const executives = await listExecutiveMembers();
    return NextResponse.json({
      success: true,
      data: executives,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load executive accounts.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/admin/executives
 * Create a new Executive Member login account. Strictly restricted to authenticated Admins.
 */
export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json(
      { success: false, error: "Cross-site request rejected." },
      { status: 403 }
    );
  }

  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { fullName, email, password, confirmPassword } = body;

    // 1. Validate full name
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter the member's full name (at least 2 characters)." },
        { status: 400 }
      );
    }

    // 2. Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // 3. Validate passwords
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Initial password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match. Please re-enter to confirm." },
        { status: 400 }
      );
    }

    // 4. Create Executive Member (Transactional in Supabase Auth & public.user_roles)
    const newMember = await createExecutiveMember({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      adminUserId: auth.user.id || "",
    });

    return NextResponse.json(
      {
        success: true,
        message: `Executive Member account for ${newMember.fullName} created successfully.`,
        member: newMember,
      },
      { status: 201 }
    );
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "Failed to create Executive Member account.";
    const status = msg.toLowerCase().includes("already exists") ? 409 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

/**
 * PATCH /api/admin/executives
 * Update Executive Member account: toggle active/disabled status or reset password.
 */
export async function PATCH(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json(
      { success: false, error: "Cross-site request rejected." },
      { status: 403 }
    );
  }

  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const id = body.id || body.userId;
    const action = body.action;
    const status = body.status;
    const newPassword = body.newPassword || body.password;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Target Executive Member ID is required." },
        { status: 400 }
      );
    }

    if (action === "toggle-status" || action === "update_status") {
      if (status !== "active" && status !== "disabled") {
        return NextResponse.json(
          { success: false, error: "Status must be 'active' or 'disabled'." },
          { status: 400 }
        );
      }

      const result = await updateExecutiveStatus(id, status);
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    }

    if (action === "reset-password" || action === "reset_password") {
      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      const result = await resetExecutivePassword(id, newPassword);
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action specified. Use 'toggle-status' or 'reset-password'." },
      { status: 400 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update executive account.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/executives?id=... (or JSON body { id / userId })
 * Permanently delete an Executive Member account after confirmation.
 */
export async function DELETE(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json(
      { success: false, error: "Cross-site request rejected." },
      { status: 403 }
    );
  }

  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  const { searchParams } = new URL(req.url);
  let targetId = searchParams.get("id") || searchParams.get("userId");

  if (!targetId) {
    const body = await req.json().catch(() => null);
    if (body && typeof body === "object") {
      targetId = body.id || body.userId;
    }
  }

  if (!targetId) {
    return NextResponse.json(
      { success: false, error: "Executive Member ID is required for deletion." },
      { status: 400 }
    );
  }

  try {
    const result = await deleteExecutiveMember(targetId, auth.user.id || "");
    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete executive account.";
    const status = msg.includes("Cannot delete") ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
