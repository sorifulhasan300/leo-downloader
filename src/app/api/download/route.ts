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
 * Helper to parse any raw size input (number of bytes, numeric string, or string formatted size like "15.4 MB")
 */
function parseMediaSize(media: any): number | string | null {
  if (!media || typeof media !== "object") return null;

  const rawVal =
    media.data_size ??
    media.size ??
    media.filesize ??
    media.file_size ??
    media.bytes ??
    media.formatted_size ??
    media.content_length;

  if (rawVal === null || rawVal === undefined || rawVal === "" || rawVal === "N/A") {
    return null;
  }

  if (typeof rawVal === "number" && !isNaN(rawVal) && rawVal > 0) {
    return rawVal;
  }

  if (typeof rawVal === "string") {
    const trimmed = rawVal.trim();
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    const match = trimmed.match(/^([\d.]+)\s*(gb|mb|kb|b)?$/i);
    if (match) {
      const val = parseFloat(match[1]);
      const unit = (match[2] || "").toLowerCase();
      if (!isNaN(val) && val > 0) {
        if (unit === "gb") return Math.round(val * 1024 * 1024 * 1024);
        if (unit === "mb") return Math.round(val * 1024 * 1024);
        if (unit === "kb") return Math.round(val * 1024);
        if (unit === "b") return Math.round(val);
        if (val > 1000) return Math.round(val);
        return Math.round(val * 1024 * 1024);
      }
    }
    return trimmed;
  }

  return null;
}

/**
 * Lightweight fetch fallback to retrieve Content-Length header for media missing size
 */
async function fetchContentLengthIfMissing(mediaUrl: string): Promise<number | null> {
  if (!mediaUrl || typeof mediaUrl !== "string") return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const res = await fetch(mediaUrl, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const len = res.headers.get("content-length");
      if (len && /^\d+$/.test(len)) {
        const bytes = parseInt(len, 10);
        if (bytes > 0) return bytes;
      }
    }
  } catch {
    // Ignore error silently
  }
  return null;
}

/**
 * Helper to process social media download requests via ZM API.
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

    const rawMedias = apiResponse.medias;

    const medias = await Promise.all(
      rawMedias.map(async (media, index) => {
        const extension = media.extension || (media.type === "audio" ? "mp3" : "mp4");
        let quality = media.quality || (media.type === "audio" ? "Audio MP3" : "HD No Watermark");

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

        let parsedSize = parseMediaSize(media);
        if (parsedSize === null && media.url) {
          parsedSize = await fetchContentLengthIfMissing(media.url);
        }

        return {
          url: media.url,
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
    console.error("ZM API Downloader Route Error:", error);
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
 * POST /api/download
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
 * GET /api/download
 * Accept Query Param: ?url=https://...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") || searchParams.get("videoUrl");
  return await processSocialMediaRequest(url);
}
