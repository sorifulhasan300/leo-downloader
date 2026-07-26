import { NextRequest, NextResponse } from "next/server";
import { fetchSocialMediaData, ApiResponse } from "@/lib/socialApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Validates whether a string is a valid HTTP/HTTPS URL.
 */
function isValidUrl(urlString: string): boolean {
  try {
    const parsedUrl = new URL(urlString);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Helper to process social media extract/download requests via ZM API.
 */
async function processSocialMediaRequest(urlParam: unknown) {
  // 1. Validate incoming URL string
  if (!urlParam || typeof urlParam !== "string" || !urlParam.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing or invalid 'url' parameter. Please provide a valid video link.",
      },
      { status: 400 }
    );
  }

  const trimmedUrl = urlParam.trim();

  if (!isValidUrl(trimmedUrl)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid video URL. Must be a valid HTTP or HTTPS link.",
      },
      { status: 400 }
    );
  }

  try {
    // 2. Call fetchSocialMediaData from @/lib/socialApi
    const apiResponse: ApiResponse = await fetchSocialMediaData(trimmedUrl);

    // 3. If ZM API returns an error or empty media list, return failure response
    if (
      !apiResponse ||
      apiResponse.error ||
      !Array.isArray(apiResponse.medias) ||
      apiResponse.medias.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: apiResponse?.message || "Failed to process video link.",
        },
        { status: 400 }
      );
    }

    // 4. Parse response & format properly for frontend
    const title = apiResponse.title || "Social Media Video";

    let author = "";
    if (typeof apiResponse.author === "string") {
      author = apiResponse.author;
    } else if (apiResponse.author && typeof apiResponse.author === "object") {
      author = apiResponse.author.name || apiResponse.author.username || "";
    }

    const thumbnail = apiResponse.thumbnail || "";
    const source = apiResponse.source || trimmedUrl;

    let duration: number = 0;
    if (typeof apiResponse.duration === "number") {
      duration = apiResponse.duration;
    } else if (typeof apiResponse.duration === "string") {
      duration = parseFloat(apiResponse.duration) || 0;
    }

    const medias = apiResponse.medias.map((media, index) => {
      const extension = media.extension || (media.type === "audio" ? "mp3" : "mp4");
      const quality = media.quality || (media.type === "audio" ? "Audio MP3" : "HD No Watermark");
      const mediaType = media.type || (quality.toLowerCase().includes("audio") ? "audio" : "video");
      const hasAudio = mediaType !== "video_only";
      const hasVideo = mediaType !== "audio";

      return {
        url: media.url,
        quality,
        extension,
        type: mediaType,
        width: media.width || null,
        height: media.height || null,
        data_size: media.data_size || null,

        // Frontend compatibility properties
        formatId: `media-${index}-${extension}`,
        ext: extension,
        filesize: media.data_size || null,
        hasAudio,
        hasVideo,
        fps: null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        title,
        author,
        thumbnail,
        source,
        duration,
        medias,
      },
      // Convenience properties
      title,
      author,
      thumbnail,
      source,
      duration,
      medias,
      // Backward compatibility for existing UI components
      metadata: {
        id: source,
        title,
        thumbnail,
        duration,
        uploader: author,
        author,
        webpageUrl: source,
      },
      formats: medias,
    });
  } catch (error: any) {
    console.error("ZM API Extract Route Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process video link.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/extract
 * Accept JSON body: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return await processSocialMediaRequest(body?.url);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON request body." },
      { status: 400 }
    );
  }
}

/**
 * GET /api/extract
 * Accept Query Param: ?url=https://...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") || searchParams.get("videoUrl");
  return await processSocialMediaRequest(url);
}

