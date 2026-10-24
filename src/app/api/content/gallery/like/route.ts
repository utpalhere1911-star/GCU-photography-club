import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";

/**
 * POST /api/content/gallery/like
 * Toggles a visitor's like on a photograph atomically using Supabase RPC.
 * Enforces rate limiting, token validation, row locking, and duplicate prevention.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const photoId = typeof body.photoId === "string" ? body.photoId.trim() : "";
    const visitorToken = typeof body.visitorToken === "string" ? body.visitorToken.trim() : "";

    if (!photoId) {
      return NextResponse.json(
        { success: false, error: "Photo ID is required." },
        { status: 400 }
      );
    }

    // Token must be between 8 and 128 characters, safe alphanumeric/hyphen/underscore
    if (
      !visitorToken ||
      visitorToken.length < 8 ||
      visitorToken.length > 128 ||
      !/^[a-zA-Z0-9_-]+$/.test(visitorToken)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid visitor token format. Must be 8-128 characters." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient() || getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database client is not available." },
        { status: 503 }
      );
    }

    // Call atomic PostgreSQL function toggle_gallery_like(p_photo_id, p_visitor_token)
    const { data, error } = await supabase.rpc("toggle_gallery_like", {
      p_photo_id: photoId,
      p_visitor_token: visitorToken,
    });

    if (error) {
      console.error("Database RPC error in toggle_gallery_like:", error);
      return NextResponse.json(
        { success: false, error: error.message || "Failed to record like in database." },
        { status: 500 }
      );
    }

    if (!data || data.success === false) {
      const errorMessage = data?.error || "Could not toggle like.";
      const status = errorMessage.toLowerCase().includes("rate limit")
        ? 429
        : errorMessage.toLowerCase().includes("not found")
        ? 404
        : 400;

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status }
      );
    }

    try {
      revalidatePath("/gallery");
    } catch (revalidateErr) {
      console.warn("Could not revalidate /gallery after like:", revalidateErr);
    }

    return NextResponse.json({
      success: true,
      photoId: data.photo_id,
      hasLiked: Boolean(data.has_liked),
      likesCount: Number(data.likes_count),
    });
  } catch (err) {
    console.error("Unexpected error in /api/content/gallery/like POST:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected server error while processing like." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/gallery/like?visitorToken=...
 * Reconciles authoritative like counts and fetches the list of photos liked by this visitor.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const visitorToken = (searchParams.get("visitorToken") || "").trim();

    const supabase = getSupabaseAdminClient() || getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        likedPhotoIds: [],
        counts: {},
      });
    }

    // 1. Fetch current counts for all photos from database
    const { data: photos, error: pErr } = await supabase
      .from("gallery_photos")
      .select("id, likes_count");

    if (pErr) {
      console.warn("Could not fetch photo like counts:", pErr.message);
    }

    const counts: Record<string, number> = {};
    if (photos) {
      photos.forEach((p) => {
        counts[p.id] = typeof p.likes_count === "number" ? Math.max(0, p.likes_count) : 0;
      });
    }

    // 2. Fetch liked photos for this visitor via RPC
    let likedPhotoIds: string[] = [];
    if (
      visitorToken &&
      visitorToken.length >= 8 &&
      visitorToken.length <= 128 &&
      /^[a-zA-Z0-9_-]+$/.test(visitorToken)
    ) {
      const { data: likedData, error: lErr } = await supabase.rpc(
        "get_visitor_liked_photo_ids",
        { p_visitor_token: visitorToken }
      );

      if (lErr) {
        console.warn("Could not fetch visitor liked photos:", lErr.message);
      } else if (Array.isArray(likedData)) {
        likedPhotoIds = likedData;
      }
    }

    return NextResponse.json({
      success: true,
      likedPhotoIds,
      counts,
    });
  } catch (err) {
    console.error("Unexpected error in /api/content/gallery/like GET:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected server error while retrieving likes." },
      { status: 500 }
    );
  }
}
