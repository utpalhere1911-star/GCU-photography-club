import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireContentManager } from "@/lib/auth";
import { teamMembers, TeamMember } from "@/data/team";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";
import { isValidIdentifier, isSafeUrl } from "@/lib/validation";

export async function GET() {
  const supabase = getSupabaseAdminClient() || getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({
      success: true,
      data: teamMembers,
    });
  }

  try {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      const mapped: TeamMember[] = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        category: row.category,
        initials: row.initials,
        department: row.department || undefined,
        photoUrl: row.photo_url || undefined,
        objectPosition: row.object_position || undefined,
      }));
      return NextResponse.json({
        success: true,
        data: mapped,
      });
    }

    // If table is completely empty, safely seed official committee into database
    if (!error && (!data || data.length === 0)) {
      try {
        const seedPayload = teamMembers.map((m, idx) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          category: m.category,
          initials: m.initials,
          department: m.department || null,
          photo_url: m.photoUrl || null,
          object_position: m.objectPosition || "center 25%",
          display_order: idx + 1,
          published: true,
        }));
        await supabase.from("team_members").upsert(seedPayload, { onConflict: "id" });
      } catch (seedErr) {
        console.warn("Could not seed baseline team into database:", seedErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: teamMembers,
    });
  } catch (err) {
    console.warn("Error querying team_members table:", err);
    return NextResponse.json({
      success: true,
      data: teamMembers,
    });
  }
}

export async function POST(req: NextRequest) {
  // Strict backend authorization guard: both Admin & Executive have equal access
  const auth = await requireContentManager();
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const payload = await req.json();

    // Supports updating a single member or batch updating (for reordering)
    const members: TeamMember[] = Array.isArray(payload) ? payload : [payload];

    for (const member of members) {
      if (!member || !member.id || !member.name || !member.role) {
        return NextResponse.json(
          {
            success: false,
            error: "Member ID, name, and role are required.",
          },
          { status: 400 }
        );
      }

      if (!isValidIdentifier(member.id)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid team member ID format for "${member.name}".`,
          },
          { status: 400 }
        );
      }

      if (member.photoUrl && !isSafeUrl(member.photoUrl)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid photo URL for "${member.name}". Only safe URLs are allowed.`,
          },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseAdminClient() || getSupabaseServerClient();
    if (supabase) {
      const dbPayload = members.map((m, idx) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        category: m.category,
        initials: m.initials,
        department: m.department || null,
        photo_url: m.photoUrl || null,
        object_position: m.objectPosition || "center 25%",
        display_order: idx + 1,
        published: true,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("team_members")
        .upsert(dbPayload, { onConflict: "id" });

      if (error) {
        console.error("Database error saving team members:", error);
        return NextResponse.json(
          { success: false, error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }
    }

    try {
      revalidatePath("/");
      revalidatePath("/about");
    } catch (revalidateErr) {
      console.warn("Could not revalidate paths after team save:", revalidateErr);
    }

    return NextResponse.json({
      success: true,
      message: `${members.length} team member(s) saved successfully.`,
      user: {
        email: auth.user.email,
        role: auth.user.role,
      },
      count: members.length,
    });
  } catch (err) {
    console.error("Error saving team member:", err);
    return NextResponse.json(
      { success: false, error: "Failed to parse team member data." },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Strict backend authorization guard
  const auth = await requireContentManager();
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id || !isValidIdentifier(id)) {
    return NextResponse.json(
      { success: false, error: "A valid Member ID is required for deletion." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdminClient() || getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Database error deleting team member:", error);
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
  }

  try {
    revalidatePath("/");
    revalidatePath("/about");
  } catch (revalidateErr) {
    console.warn("Could not revalidate paths after team delete:", revalidateErr);
  }

  return NextResponse.json({
    success: true,
    message: `Team member '${id}' deleted successfully.`,
    user: {
      email: auth.user.email,
      role: auth.user.role,
    },
    deletedId: id,
  });
}
