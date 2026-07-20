import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeFilename(filename: string): string {
  // Replace characters that are invalid or problematic in file headers and file systems
  return filename
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamUrl = searchParams.get("url");
    const title = searchParams.get("title");

    if (!streamUrl) {
      return NextResponse.json(
        { error: "Missing 'url' query parameter" },
        { status: 400 }
      );
    }

    // Basic URL structure verification
    try {
      new URL(streamUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid 'url' query parameter format" },
        { status: 400 }
      );
    }

    // Determine filename and sanitize it
    const filename = title ? sanitizeFilename(title) : "download";

    // Build standard-compliant Content-Disposition header supporting UTF-8 filenames
    const safeFilename = encodeURIComponent(filename)
      .replace(/['()]/g, escape)
      .replace(/\*/g, "%2A");
    const contentDisposition = `attachment; filename="${filename.replace(/"/g, '\\"')}"; filename*=UTF-8''${safeFilename}`;

    // Construct headers to mimic browser request to the remote server
    const fetchHeaders: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Encoding": "identity", // Prefer uncompressed data to preserve content-length accuracy
    };

    // Forward the Range header from the client to support seeking and resume capabilities
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    // Fetch the remote stream URL
    const response = await fetch(streamUrl, {
      headers: fetchHeaders,
      method: "GET",
    });

    if (!response.ok && response.status !== 206) {
      return NextResponse.json(
        { error: `Failed to fetch remote stream. Remote server responded with status: ${response.status}` },
        { status: response.status }
      );
    }

    // Prepare response headers to send back to the client
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

    const contentRange = response.headers.get("Content-Range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    // Determine return status (support 206 Partial Content if ranges are used)
    const status = rangeHeader && response.status === 206 ? 206 : 200;

    // Return the response, streaming the body chunk by chunk without buffering in memory
    return new Response(response.body, {
      status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Direct file download stream proxy error:", error);
    return NextResponse.json(
      { error: `Streaming proxy failed: ${error.message || error}` },
      { status: 500 }
    );
  }
}
