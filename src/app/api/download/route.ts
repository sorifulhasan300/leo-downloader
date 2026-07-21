import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { downloadMediaFile, YtDlpError } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeFilename(filename: string): string {
  // Replace characters that are invalid or problematic in file headers and file systems
  return filename
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mkv":
      return "video/x-matroska";
    case ".mp3":
      return "audio/mpeg";
    case ".m4a":
      return "audio/mp4";
    case ".ogg":
      return "audio/ogg";
    case ".wav":
      return "audio/wav";
    case ".aac":
      return "audio/aac";
    default:
      return "application/octet-stream";
  }
}

export async function GET(request: NextRequest) {
  let tempCleanup: (() => void) | null = null;

  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url") || searchParams.get("videoUrl");
    const formatId = searchParams.get("formatId") || undefined;
    const title = searchParams.get("title");

    if (!targetUrl) {
      return NextResponse.json(
        { error: "Missing 'url' or 'videoUrl' query parameter" },
        { status: 400 }
      );
    }

    // Attempt direct fetch first for light/fast direct media links if no formatId is specified,
    // but fall back immediately to yt-dlp file download on 403/404 or formatId presence.
    if (!formatId && targetUrl.match(/^https?:\/\//i)) {
      try {
        const fetchHeaders: HeadersInit = {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "*/*",
        };

        const response = await fetch(targetUrl, {
          headers: fetchHeaders,
          method: "GET",
        });

        if (response.ok || response.status === 206) {
          const filename = title ? sanitizeFilename(title) : "download";
          const safeFilename = encodeURIComponent(filename)
            .replace(/['()]/g, escape)
            .replace(/\*/g, "%2A");
          const contentDisposition = `attachment; filename="${filename.replace(/"/g, '\\"')}"; filename*=UTF-8''${safeFilename}`;

          const responseHeaders = new Headers();
          responseHeaders.set(
            "Content-Type",
            response.headers.get("Content-Type") || "application/octet-stream"
          );
          responseHeaders.set("Content-Disposition", contentDisposition);
          responseHeaders.set("Accept-Ranges", "bytes");
          responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");

          const contentLength = response.headers.get("Content-Length");
          if (contentLength) {
            responseHeaders.set("Content-Length", contentLength);
          }

          return new Response(response.body, {
            status: response.status,
            headers: responseHeaders,
          });
        }
      } catch {
        // Fall back to yt-dlp download handler below
      }
    }

    // Fallback/Primary Handler: Download file to /tmp/downloads (os.tmpdir()/downloads) using yt-dlp
    const { filePath, cleanup } = await downloadMediaFile(targetUrl, formatId);
    tempCleanup = cleanup;

    if (!fs.existsSync(filePath)) {
      if (tempCleanup) tempCleanup();
      return NextResponse.json(
        { error: "Downloaded file not found in temporary storage directory." },
        { status: 404 }
      );
    }

    const fileStats = fs.statSync(filePath);
    const downloadedExt = path.extname(filePath);
    const rawFilename = title ? sanitizeFilename(title) : `download${downloadedExt}`;
    const filename = path.extname(rawFilename) ? rawFilename : `${rawFilename}${downloadedExt}`;

    const safeFilename = encodeURIComponent(filename)
      .replace(/['()]/g, escape)
      .replace(/\*/g, "%2A");
    const contentDisposition = `attachment; filename="${filename.replace(/"/g, '\\"')}"; filename*=UTF-8''${safeFilename}`;

    const mimeType = getMimeType(filename);

    const nodeStream = fs.createReadStream(filePath);

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => {
          controller.enqueue(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        });

        nodeStream.on("end", () => {
          controller.close();
          if (tempCleanup) tempCleanup();
        });

        nodeStream.on("error", (err) => {
          controller.error(err);
          if (tempCleanup) tempCleanup();
        });
      },
      cancel() {
        nodeStream.destroy();
        if (tempCleanup) tempCleanup();
      },
    });

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": contentDisposition,
        "Content-Length": fileStats.size.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    if (tempCleanup) {
      tempCleanup();
    }
    console.error("Download route error:", error);

    let status = 500;
    if (error instanceof YtDlpError) {
      if (error.type === "INVALID_URL") status = 400;
      if (error.type === "RATE_LIMITED" || error.type === "AGE_RESTRICTED") status = 403;
      if (error.type === "DELETED_VIDEO") status = 404;
    }

    return NextResponse.json(
      { error: error.message || "Failed to process and stream video download." },
      { status }
    );
  }
}

