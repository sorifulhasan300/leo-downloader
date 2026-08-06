import { NextRequest, NextResponse } from "next/server";
import {
  cleanMediaUrl,
  getRefererForUrl,
  isValidUrl,
  sanitizeFileName,
  DEFAULT_BROWSER_USER_AGENT,
} from "@/lib/mediaUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Core handler to stream remote video binary content with attachment headers.
 * Implements fallback direct redirect to original URL if proxy streaming fails.
 */
async function handleProxyDownload(fileUrl: string | null | undefined, fileName: string | null | undefined) {
  const cleanUrl = cleanMediaUrl(fileUrl);

  if (!cleanUrl || !isValidUrl(cleanUrl)) {
    return NextResponse.json(
      { success: false, error: "Invalid or missing 'fileUrl' parameter." },
      { status: 400 }
    );
  }

  const sanitizedFileName = sanitizeFileName(fileName);
  const referer = getRefererForUrl(cleanUrl);

  try {
    const remoteResponse = await fetch(cleanUrl, {
      headers: {
        "User-Agent": DEFAULT_BROWSER_USER_AGENT,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": referer,
        "Sec-Fetch-Dest": "video",
        "Sec-Fetch-Mode": "no-cors",
      },
      redirect: "follow",
    });

    if (!remoteResponse.ok || !remoteResponse.body) {
      console.warn(
        `Proxy download fetch returned status [${remoteResponse.status}]. Fallback redirecting to origin CDN: ${cleanUrl}`
      );
      // Redirect to direct CDN URL as fallback so browser download does not fail
      return NextResponse.redirect(cleanUrl, 302);
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
    console.error("Error in /api/download-file proxy route, redirecting to origin URL:", error);
    // On network or fetch error, fallback redirect to original CDN URL
    return NextResponse.redirect(cleanUrl, 302);
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
