import { NextResponse, NextRequest } from "next/server";
import { getVideoMetadata, YtDlpError } from "@/lib/ytdlp";

// Force Node.js runtime since yt-dlp execution requires child_process
export const runtime = "nodejs";

// Basic in-memory rate limiting map to prevent abuse
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const LIMIT = 30; // Max 30 requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute window

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Prune expired entries to prevent memory leaks
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }

  const record = rateLimitMap.get(ip);
  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }

  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > LIMIT;
}

export async function POST(request: NextRequest) {
  // Get request IP for rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { url } = body;
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'url' parameter in request body" },
        { status: 400 }
      );
    }

    // Call helper to retrieve metadata from yt-dlp
    const response = await getVideoMetadata(url);

    if (!response.success || !response.data) {
      const errorType = response.errorType || "UNKNOWN";
      const message = response.error || "An internal server error occurred.";
      let status = 500;

      switch (errorType) {
        case "INVALID_URL":
          status = 400;
          break;
        case "PRIVATE_VIDEO":
        case "AGE_RESTRICTED":
        case "GEO_LOCKED":
          status = 403;
          break;
        case "DELETED_VIDEO":
          status = 404;
          break;
        case "RATE_LIMITED":
          status = 429;
          break;
        case "TIMEOUT":
          status = 504;
          break;
        default:
          status = 500;
      }

      return NextResponse.json(
        { error: message, type: errorType },
        { status }
      );
    }

    const metadata = response.data;

    // Map raw format lists into user-friendly download options
    const formatOptions = metadata.formats.map((f) => {
      const hasVideo = f.vcodec && f.vcodec !== "none";
      const hasAudio = f.acodec && f.acodec !== "none";

      let qualityLabel = "";
      if (hasVideo && hasAudio) {
        qualityLabel = `${f.height ? f.height + "p" : f.resolution || "Video"} (${f.ext})`;
      } else if (hasVideo) {
        qualityLabel = `${f.height ? f.height + "p" : f.resolution || "Video"} (${f.ext}) [Video Only]`;
      } else if (hasAudio) {
        qualityLabel = `Audio (${f.ext || "m4a"})`;
      } else {
        qualityLabel = `Format ${f.formatId} (${f.ext})`;
      }

      return {
        formatId: f.formatId,
        quality: qualityLabel,
        ext: f.ext,
        filesize: f.filesize,
        url: f.url,
        fps: f.fps,
        hasAudio,
        hasVideo,
        width: f.width,
        height: f.height,
      };
    });

    // Extract audio-only formats to create a dedicated MP3 download option
    const audioOnlyFormats = metadata.formats.filter(
      (f) => f.vcodec === "none" && f.acodec !== "none"
    );

    if (audioOnlyFormats.length > 0) {
      // Find the best audio format based on audioBitrate
      const bestAudio = audioOnlyFormats.reduce((prev, current) => {
        const prevBitrate = prev.audioBitrate || 0;
        const currentBitrate = current.audioBitrate || 0;
        return currentBitrate > prevBitrate ? current : prev;
      }, audioOnlyFormats[0]);

      // Add a virtual MP3 option which the client can download as MP3
      formatOptions.push({
        formatId: `${bestAudio.formatId}-mp3`,
        quality: "Audio (MP3)",
        ext: "mp3",
        filesize: bestAudio.filesize,
        url: bestAudio.url,
        fps: null,
        hasAudio: true,
        hasVideo: false,
        width: null,
        height: null,
      });
    }

    // Sort video formats from highest quality to lowest, then append audio formats
    const videoOptions = formatOptions
      .filter((o) => o.hasVideo)
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    const audioOptions = formatOptions.filter((o) => !o.hasVideo);

    const sortedOptions = [...videoOptions, ...audioOptions];

    return NextResponse.json({
      metadata: {
        id: metadata.id,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        thumbnails: metadata.thumbnails,
        duration: metadata.duration,
        description: metadata.description,
        uploader: metadata.uploader,
        webpageUrl: metadata.webpageUrl,
      },
      formats: sortedOptions,
    });
  } catch (error: any) {
    let status = 500;
    let message = "An internal server error occurred.";

    if (error instanceof YtDlpError) {
      message = error.message;
      switch (error.type) {
        case "INVALID_URL":
          status = 400;
          break;
        case "PRIVATE_VIDEO":
        case "AGE_RESTRICTED":
        case "GEO_LOCKED":
          status = 403;
          break;
        case "DELETED_VIDEO":
          status = 404;
          break;
        case "RATE_LIMITED":
          status = 429;
          break;
        case "TIMEOUT":
          status = 504;
          break;
        default:
          status = 500;
      }
    }

    return NextResponse.json(
      { error: message, type: error.type || "UNKNOWN" },
      { status }
    );
  }
}
