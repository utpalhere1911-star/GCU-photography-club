import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireContentManager, getSessionUser, canManageContent } from "@/lib/auth";
import { GalleryPhoto, GalleryCategory } from "@/data/gallery";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";
import { isValidIdentifier, isSafeUrl } from "@/lib/validation";

export async function GET() {
  const client = getSupabaseAdminClient() || getSupabaseServerClient();
  if (!client) {
    return NextResponse.json(
      { success: false, error: "Database client is not available." },
      { status: 503 }
    );
  }

  try {
    const sessionUser = await getSessionUser();
    const isManager = canManageContent(sessionUser);

    let query = client
      .from("gallery_photos")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!isManager) {
      query = query.eq("published", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase gallery query failed:", error.message);
      return NextResponse.json(
        { success: false, error: `Database query failed: ${error.message}` },
        { status: 500 }
      );
    }

    const rows = data || [];
    const mapped: GalleryPhoto[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      caption: row.caption || "",
      category: (row.category || "Campus") as GalleryCategory,
      additionalCategories: Array.isArray(row.additional_categories) ? row.additional_categories : [],
      photographer: row.photographer,
      avatarInitials: row.avatar_initials || "",
      date: row.photo_date || row.created_at?.split("T")[0] || "",
      formattedDate: row.formatted_date || undefined,
      location: row.location || "GCU Campus, Azara",
      imageSrc: row.image_src,
      alt: row.alt || `${row.title} by ${row.photographer}`,
      aspectRatio: (row.aspect_ratio || "standard") as "landscape" | "portrait" | "standard" | "wide",
      gridSpanClass: row.grid_span_class || "col-span-6 md:col-span-6 lg:col-span-3",
      initialLikes: typeof row.likes_count === "number" ? Math.max(0, row.likes_count) : 0,
      likesCount: typeof row.likes_count === "number" ? Math.max(0, row.likes_count) : 0,
      published: row.published ?? true,
      displayOrder: row.display_order ?? 0,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (err) {
    console.error("Unexpected error in gallery GET route:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected server error while fetching gallery photographs." },
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
    const payload = await req.json();

    // Support single photo or bulk batch of photos
    const photos: GalleryPhoto[] = Array.isArray(payload) ? payload : [payload];

    for (const photo of photos) {
      if (!photo || !photo.id || !photo.title || !photo.imageSrc) {
        return NextResponse.json(
          {
            success: false,
            error: "Photo ID, title, and image source are required.",
          },
          { status: 400 }
        );
      }

      if (!isValidIdentifier(photo.id)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid photograph ID format for "${photo.title}".`,
          },
          { status: 400 }
        );
      }

      const isDataImg = typeof photo.imageSrc === "string" && photo.imageSrc.startsWith("data:image/");
      if (!isDataImg && !isSafeUrl(photo.imageSrc)) {
        return NextResponse.json(
          {
            success: false,
            error: `Disallowed or unsafe image URL for "${photo.title}".`,
          },
          { status: 400 }
        );
      }
    }

    const client = getSupabaseAdminClient() || getSupabaseServerClient();
    if (client) {
      // Check which photos already exist in database to preserve existing likes_count
      const photoIds = photos.map((p) => p.id);
      const { data: existingRows } = await client
        .from("gallery_photos")
        .select("id, likes_count, initial_likes")
        .in("id", photoIds);

      const existingMap = new Map<string, { likes_count: number; initial_likes: number }>();
      if (existingRows) {
        existingRows.forEach((r) => {
          existingMap.set(r.id, {
            likes_count: typeof r.likes_count === "number" ? r.likes_count : 0,
            initial_likes: typeof r.initial_likes === "number" ? r.initial_likes : 0,
          });
        });
      }

      const dbPayloads = photos.map((photo, idx) => {
        const existing = existingMap.get(photo.id);
        const resolvedLikesCount = existing
          ? existing.likes_count
          : (typeof photo.likesCount === "number" ? photo.likesCount : (photo.initialLikes || 0));
        const resolvedInitialLikes = existing
          ? existing.initial_likes
          : (photo.initialLikes || 0);

        return {
          id: photo.id,
          title: photo.title,
          caption: photo.caption || null,
          category: photo.category,
          additional_categories: photo.additionalCategories || [],
          photographer: photo.photographer,
          avatar_initials: photo.avatarInitials || null,
          photo_date: photo.date || null,
          formatted_date: photo.formattedDate || null,
          image_src: photo.imageSrc,
          alt: photo.alt || `${photo.title} by ${photo.photographer}`,
          aspect_ratio: photo.aspectRatio || "standard",
          grid_span_class: photo.gridSpanClass || "col-span-6 md:col-span-6 lg:col-span-3",
          initial_likes: resolvedInitialLikes,
          likes_count: resolvedLikesCount,
          location: photo.location || "GCU Campus, Azara",
          display_order: photo.displayOrder ?? idx,
          published: photo.published ?? true,
          created_by: auth.user.id || null,
          updated_at: new Date().toISOString(),
        };
      });

      const { error: upsertError } = await client
        .from("gallery_photos")
        .upsert(dbPayloads, { onConflict: "id" });

      if (upsertError) {
        console.error("Supabase gallery upsert failed:", upsertError.message);
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
      revalidatePath("/gallery");
    } catch (revalidateErr) {
      console.warn("Could not revalidate paths after gallery save:", revalidateErr);
    }

    return NextResponse.json({
      success: true,
      message: `${photos.length} photograph(s) saved successfully.`,
      user: {
        email: auth.user.email,
        role: auth.user.role,
      },
      savedCount: photos.length,
    });
  } catch (err) {
    console.error("Error saving gallery photo:", err);
    return NextResponse.json(
      { success: false, error: "Failed to parse gallery photo data." },
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
      { success: false, error: "A valid Photograph ID is required for deletion." },
      { status: 400 }
    );
  }

  const client = getSupabaseAdminClient() || getSupabaseServerClient();
  if (client) {
    const { error: deleteError } = await client
      .from("gallery_photos")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Supabase gallery delete failed:", deleteError.message);
      return NextResponse.json(
        {
          success: false,
          error: `Database delete failed: ${deleteError.message}`,
        },
        { status: 500 }
      );
    }
  }

  try {
    revalidatePath("/");
    revalidatePath("/gallery");
  } catch (revalidateErr) {
    console.warn("Could not revalidate paths after gallery delete:", revalidateErr);
  }

  return NextResponse.json({
    success: true,
    message: `Photograph '${id}' deleted successfully.`,
    user: {
      email: auth.user.email,
      role: auth.user.role,
    },
    deletedId: id,
  });
}
