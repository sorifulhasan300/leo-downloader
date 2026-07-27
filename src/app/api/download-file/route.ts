import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Helper to validate whether a string is a valid HTTP/HTTPS URL.
 */
function isValidUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Sanitizes a filename to ensure safe header value and cross-browser support.
 */
function sanitizeFileName(fileName?: string | null): string {
  if (!fileName || !fileName.trim()) {
    return "video.mp4";
  }

  // Strip control characters, slashes, and hazardous header characters
  let cleanName = fileName
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[^\x20-\x7E]/g, ""); // Remove non-ASCII chars for standard header safety

  if (!cleanName || cleanName === "_") {
    cleanName = "video.mp4";
  }

  // Ensure default extension if missing
  if (!/\.[a-zA-Z0-9]+$/.test(cleanName)) {
    cleanName += ".mp4";
  }

  return cleanName;
}

/**
 * Core handler to stream remote video binary content with attachment headers.
 */
async function handleProxyDownload(fileUrl: string | null | undefined, fileName: string | null | undefined) {
  if (!fileUrl || typeof fileUrl !== "string" || !isValidUrl(fileUrl.trim())) {
    return NextResponse.json(
      { success: false, error: "Invalid or missing 'fileUrl' parameter." },
      { status: 400 }
    );
  }

  const cleanFileUrl = fileUrl.trim();
  const sanitizedFileName = sanitizeFileName(fileName);

  try {
    const remoteResponse = await fetch(cleanFileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Encoding": "identity",
      },
    });

    if (!remoteResponse.ok || !remoteResponse.body) {
      console.error(`Proxy download fetch error [${remoteResponse.status}]: ${remoteResponse.statusText}`);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch video stream from remote source (Status ${remoteResponse.status}).`,
        },
        { status: remoteResponse.status || 502 }
      );
    }

    const contentType = remoteResponse.headers.get("content-type") || "video/mp4";
    const contentLength = remoteResponse.headers.get("content-length");

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set(
      "Content-Disposition",
      `attachment; filename="${sanitizedFileName}"`
    );

    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
    responseHeaders.set("Pragma", "no-cache");
    responseHeaders.set("Expires", "0");

    return new Response(remoteResponse.body as unknown as ReadableStream, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Error in /api/download-file proxy route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred while proxying video stream.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/download-file?fileUrl=...&fileName=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get("fileUrl") || searchParams.get("url");
  const fileName = searchParams.get("fileName") || searchParams.get("name") || searchParams.get("title");

  return handleProxyDownload(fileUrl, fileName);
}

/**
 * POST /api/download-file
 * Body: { fileUrl: string, fileName?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fileUrl = body?.fileUrl || body?.url;
    const fileName = body?.fileName || body?.name || body?.title;

    return handleProxyDownload(fileUrl, fileName);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON request body." },
      { status: 400 }
    );
  }
}
