import { NextResponse } from "next/server";

export const DEFAULT_BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/**
 * Unescapes HTML entities like &amp; in URLs and trims whitespace.
 */
export function cleanMediaUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let url = rawUrl.trim();
  url = url.replace(/&amp;/g, "&");
  return url;
}

/**
 * Determines domain-appropriate Referer header for fetching remote media assets.
 */
export function getRefererForUrl(urlStr: string): string {
  const lower = urlStr.toLowerCase();
  if (lower.includes("instagram.com") || lower.includes("cdninstagram.com")) {
    return "https://www.instagram.com/";
  }
  if (lower.includes("facebook.com") || lower.includes("fbcdn.net") || lower.includes("fb.watch")) {
    return "https://www.facebook.com/";
  }
  if (lower.includes("tiktok.com") || lower.includes("byteoversea.com") || lower.includes("ibyteimg.com") || lower.includes("tiktokcdn.com")) {
    return "https://www.tiktok.com/";
  }
  if (lower.includes("twitter.com") || lower.includes("x.com") || lower.includes("twimg.com")) {
    return "https://x.com/";
  }
  if (lower.includes("youtube.com") || lower.includes("googlevideo.com") || lower.includes("youtu.be")) {
    return "https://www.youtube.com/";
  }
  return "https://www.google.com/";
}

/**
 * Strips server-session-bound parameters (ip, ei, xpc, bui) from YouTube/GoogleVideo
 * CDN URLs so they can be safely used in browser redirects or client-side fetches.
 * Also cleans sparams/lsparams comma-separated whitelists to stay consistent.
 */
export function cleanYouTubeCdnUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (!host.includes("googlevideo.com") && !host.includes("youtube.com")) {
      return url;
    }

    const paramsToRemove = new Set(["ip", "ei", "xpc", "bui"]);

    for (const key of paramsToRemove) {
      parsed.searchParams.delete(key);
    }

    for (const whitelistKey of ["sparams", "lsparams"]) {
      const whitelist = parsed.searchParams.get(whitelistKey);
      if (whitelist) {
        const cleaned = whitelist
          .split(",")
          .filter((p) => !paramsToRemove.has(p))
          .join(",");
        if (cleaned) {
          parsed.searchParams.set(whitelistKey, cleaned);
        } else {
          parsed.searchParams.delete(whitelistKey);
        }
      }
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Validates whether a string is a valid HTTP/HTTPS URL.
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Parses raw size inputs (number of bytes, numeric string, or string formatted size like "15.4 MB").
 */
export function parseMediaSize(media: any): number | string | null {
  if (!media || typeof media !== "object") return null;

  const rawVal =
    media.data_size ??
    media.size ??
    media.filesize ??
    media.file_size ??
    media.bytes ??
    media.formatted_size ??
    media.content_length ??
    media.contentLength ??
    media.file_bytes ??
    media.fileSize ??
    media.length;

  if (rawVal === null || rawVal === undefined || rawVal === "" || rawVal === "N/A") {
    return null;
  }

  if (typeof rawVal === "number" && !isNaN(rawVal) && rawVal > 0) {
    return rawVal;
  }

  if (typeof rawVal === "string") {
    const trimmed = rawVal.trim();
    if (!trimmed || trimmed === "N/A") return null;

    if (/^\d+$/.test(trimmed)) {
      const bytes = parseInt(trimmed, 10);
      return bytes > 0 ? bytes : null;
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
 * Enhanced fetch fallback to retrieve Content-Length or Content-Range header for media missing size.
 * Uses HEAD first, then GET with Range: bytes=0-0 to extract size from Content-Range (bytes 0-0/TOTAL_BYTES).
 */
export async function fetchContentLengthIfMissing(mediaUrl: string): Promise<number | null> {
  const cleanUrl = cleanMediaUrl(mediaUrl);
  if (!cleanUrl || !isValidUrl(cleanUrl)) return null;

  const referer = getRefererForUrl(cleanUrl);
  const commonHeaders = {
    "User-Agent": DEFAULT_BROWSER_USER_AGENT,
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": referer,
  };

  // Step 1: Try HEAD request
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(cleanUrl, {
      method: "HEAD",
      headers: commonHeaders,
      signal: controller.signal,
      redirect: "follow",
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
    // Ignore HEAD failure, proceed to GET Range check
  }

  // Step 2: Try GET request with Range: bytes=0-0 to get Content-Range header
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(cleanUrl, {
      method: "GET",
      headers: {
        ...commonHeaders,
        "Range": "bytes=0-0",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    if (res.ok || res.status === 206) {
      const contentRange = res.headers.get("content-range");
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)$/);
        if (match && match[1]) {
          const totalBytes = parseInt(match[1], 10);
          if (totalBytes > 0) return totalBytes;
        }
      }

      const len = res.headers.get("content-length");
      if (len && /^\d+$/.test(len)) {
        const bytes = parseInt(len, 10);
        if (bytes > 0 && res.status === 200) return bytes;
      }
    }
  } catch {
    // Ignore error silently
  }

  return null;
}

/**
 * Sanitizes a filename to ensure safe header value and cross-browser support.
 */
export function sanitizeFileName(fileName?: string | null): string {
  if (!fileName || !fileName.trim()) {
    return "video.mp4";
  }

  let cleanName = fileName
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[^\x20-\x7E]/g, "");

  if (!cleanName || cleanName === "_") {
    cleanName = "video.mp4";
  }

  if (!/\.[a-zA-Z0-9]+$/.test(cleanName)) {
    cleanName += ".mp4";
  }

  return cleanName;
}
