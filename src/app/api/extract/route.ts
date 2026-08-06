import { NextRequest, NextResponse } from "next/server";
import { fetchSocialMediaData, ApiResponse } from "@/lib/socialApi";
import {
  cleanMediaUrl,
  fetchContentLengthIfMissing,
  isValidUrl,
  parseMediaSize,
} from "@/lib/mediaUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    // 4. Parse metadata details
    const title = apiResponse.title || "Social Media Video";

    let author = "";
    if (typeof apiResponse.author === "string") {
      author = apiResponse.author;
    } else if (apiResponse.author && typeof apiResponse.author === "object") {
      author = apiResponse.author.name || apiResponse.author.username || "";
    }

    const thumbnail = cleanMediaUrl(apiResponse.thumbnail || "");
    const source = apiResponse.source || trimmedUrl;

    let duration: number = 0;
    if (typeof apiResponse.duration === "number") {
      duration = apiResponse.duration;
    } else if (typeof apiResponse.duration === "string") {
      duration = parseFloat(apiResponse.duration) || 0;
    }

    // 5. Parse media formats and sizes
    const rawMedias = apiResponse.medias;

    const medias = await Promise.all(
      rawMedias.map(async (media, index) => {
        const mediaUrl = cleanMediaUrl(media.url);
        const extension = media.extension || (media.type === "audio" ? "mp3" : "mp4");
        let quality = media.quality || (media.type === "audio" ? "Audio MP3" : "HD No Watermark");

        // Format quality label for 1080p / Full HD if detected
        if (
          quality.toLowerCase().includes("1080") ||
          quality.toLowerCase().includes("full hd") ||
          (media.height && media.height >= 1080)
        ) {
          if (!quality.toLowerCase().includes("full hd")) {
            quality = "Full HD 1080p";
          }
        }

        const mediaType = media.type || (quality.toLowerCase().includes("audio") ? "audio" : "video");
        const hasAudio = mediaType !== "video_only";
        const hasVideo = mediaType !== "audio";

        // Extract or fetch file size
        let parsedSize = parseMediaSize(media);
        if (parsedSize === null && mediaUrl) {
          parsedSize = await fetchContentLengthIfMissing(mediaUrl);
        }

        return {
          url: mediaUrl,
          quality,
          extension,
          type: mediaType,
          width: media.width || null,
          height: media.height || null,
          data_size: parsedSize,
          size: parsedSize,
          filesize: parsedSize,

          // Frontend compatibility properties
          formatId: `media-${index}-${extension}`,
          ext: extension,
          hasAudio,
          hasVideo,
          fps: null,
        };
      })
    );

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
