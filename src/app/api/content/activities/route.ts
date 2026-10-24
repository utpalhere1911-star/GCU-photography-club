import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireContentManager, getSessionUser, canManageContent } from "@/lib/auth";
import { Activity, ActivityStatus } from "@/data/activities";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";
import { isValidIdentifier, isSafeUrl, sanitizeString } from "@/lib/validation";

export async function GET() {
  const client = getSupabaseAdminClient() || getSupabaseServerClient();
  if (!client) {
    return NextResponse.json(
      { success: false, error: "Database client is not available." },
      { status: 503 }
    );
  }

  try {
    // Determine if caller is an authorized content manager
    const sessionUser = await getSessionUser();
    const isManager = canManageContent(sessionUser);

    let query = client
      .from("activities")
      .select("*")
      .order("display_order", { ascending: true })
      .order("start_date", { ascending: false });

    // Public visitors only see published activities
    if (!isManager) {
      query = query.eq("published", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase activities query failed:", error.message);
      return NextResponse.json(
        { success: false, error: `Database query failed: ${error.message}` },
        { status: 500 }
      );
    }

    const rows = data || [];
    const mapped: Activity[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      shortDescription: row.short_description,
      fullDescription: row.full_description || "",
      coverImage: row.cover_image,
      galleryImages: Array.isArray(row.gallery_images) ? row.gallery_images : [],
      startDate: row.start_date,
      endDate: row.end_date || undefined,
      time: row.time || undefined,
      venue: row.venue,
      status: (row.status || "upcoming").toLowerCase() as ActivityStatus,
      registrationStatus: row.registration_status || undefined,
      registrationUrl: row.registration_url || undefined,
      isFeaturedUpcoming: Boolean(row.is_featured_upcoming),
      published: row.published ?? true,
      year: typeof row.year === "number"
        ? row.year
        : parseInt(row.year, 10) || (row.start_date ? parseInt(row.start_date.split("-")[0], 10) : new Date().getFullYear()),
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (err) {
    console.error("Unexpected error in activities GET route:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected server error while fetching activities." },
      { status: 500 }
    );
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
    const activity: Activity = await req.json();

    if (!activity || !activity.id || !activity.title) {
      return NextResponse.json(
        { success: false, error: "Activity title and ID are required." },
        { status: 400 }
      );
    }

    if (!isValidIdentifier(activity.id)) {
      return NextResponse.json(
        { success: false, error: "Invalid activity ID format." },
        { status: 400 }
      );
    }

    if (activity.registrationUrl && !isSafeUrl(activity.registrationUrl)) {
      return NextResponse.json(
        { success: false, error: "Invalid registration URL. Only safe http, https, or mailto links are allowed." },
        { status: 400 }
      );
    }

    if (activity.coverImage && !isSafeUrl(activity.coverImage)) {
      return NextResponse.json(
        { success: false, error: "Invalid cover image URL format." },
        { status: 400 }
      );
    }

    if (Array.isArray(activity.galleryImages)) {
      for (const imgUrl of activity.galleryImages) {
        if (typeof imgUrl === "string" && imgUrl.trim() && !isSafeUrl(imgUrl.trim())) {
          return NextResponse.json(
            { success: false, error: "Invalid gallery image URL format detected." },
            { status: 400 }
          );
        }
      }
    }

    // Persist to Supabase public.activities table if client is configured
    const client = getSupabaseAdminClient() || getSupabaseServerClient();
    if (client) {
      const dbPayload = {
        id: activity.id,
        title: activity.title,
        category: activity.category,
        short_description: activity.shortDescription,
        full_description: activity.fullDescription || null,
        cover_image: activity.coverImage,
        gallery_images: activity.galleryImages || [],
        start_date: activity.startDate,
        end_date: activity.endDate || null,
        time: activity.time || null,
        venue: activity.venue,
        status: activity.status ? activity.status.toLowerCase() : "upcoming",
        registration_status: activity.registrationStatus || null,
        registration_url: activity.registrationUrl || null,
        is_featured_upcoming: Boolean(activity.isFeaturedUpcoming),
        published: activity.published ?? true,
        year: String(activity.year || new Date().getFullYear()),
        updated_at: new Date().toISOString(),
        created_by: auth.user.id || null,
      };

      const { error: upsertError } = await client
        .from("activities")
        .upsert(dbPayload, { onConflict: "id" });

      if (upsertError) {
        console.error("Supabase activities upsert failed:", upsertError.message);
        return NextResponse.json(
          {
            success: false,
            error: `Database save failed: ${upsertError.message}`,
          },
          { status: 500 }
        );
      }
    }

    try {
      revalidatePath("/");
      revalidatePath("/activities");
    } catch (revalidateErr) {
      console.warn("Could not revalidate paths after activity save:", revalidateErr);
    }

    return NextResponse.json({
      success: true,
      message: "Activity saved successfully.",
      user: {
        email: auth.user.email,
        role: auth.user.role,
      },
      activity,
    });
  } catch (err) {
    console.error("Error saving activity:", err);
    return NextResponse.json(
      { success: false, error: "Failed to parse activity data." },
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
      { success: false, error: "A valid Activity ID is required for deletion." },
      { status: 400 }
    );
  }

  // Remove from Supabase if configured
  const client = getSupabaseAdminClient() || getSupabaseServerClient();
  if (client) {
    // 1. Fetch activity to retrieve associated media before deletion
    const { data: existingActivity } = await client
      .from("activities")
      .select("cover_image, gallery_images")
      .eq("id", id)
      .maybeSingle();

    // 2. Delete database record
    const { error: deleteError } = await client
      .from("activities")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Supabase activities delete failed:", deleteError.message);
      return NextResponse.json(
        {
          success: false,
          error: `Database delete failed: ${deleteError.message}`,
        },
        { status: 500 }
      );
    }

    // 3. Narrowly-scoped storage cleanup: remove images uploaded to Supabase Storage
    if (existingActivity) {
      const allUrls = [
        existingActivity.cover_image,
        ...(Array.isArray(existingActivity.gallery_images)
          ? existingActivity.gallery_images
          : []),
      ].filter((u): u is string => typeof u === "string" && Boolean(u));

      for (const url of allUrls) {
        for (const bucket of ["event-posters", "shutterscape-media"]) {
          const marker = `/${bucket}/`;
          const idx = url.indexOf(marker);
          if (idx !== -1) {
            const rawPath = url.substring(idx + marker.length).split("?")[0];
            const storagePath = decodeURIComponent(rawPath);
            // Strictly guard: only delete paths under activities/ folder
            if (storagePath.startsWith("activities/")) {
              await client.storage
                .from(bucket)
                .remove([storagePath])
                .catch((storageErr) => {
                  console.warn(
                    `Storage cleanup warning for ${bucket}/${storagePath}:`,
                    storageErr instanceof Error ? storageErr.message : storageErr
                  );
                });
            }
          }
        }
      }
    }
  }

  try {
    revalidatePath("/");
    revalidatePath("/activities");
  } catch (revalidateErr) {
    console.warn("Could not revalidate paths after activity delete:", revalidateErr);
  }

  return NextResponse.json({
    success: true,
    message: `Activity '${id}' deleted successfully.`,
    user: {
      email: auth.user.email,
      role: auth.user.role,
    },
    deletedId: id,
  });
}
