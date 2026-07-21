import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";
import { getProxyFlag } from "./proxy";
import { VideoFormat, VideoMetadata, ExtractorResponse } from "../../types/downloader";

// Mark this module for Node.js runtime execution in Next.js
export const runtime = "nodejs";

const execFilePromise = promisify(execFile);

// Common yt-dlp CLI arguments to bypass bot checks, age restrictions, and certificate issues
export const YTDLP_COMMON_ARGS = [
  "--user-agent",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "--no-check-certificates",
  "--no-warnings",
  "--prefer-free-formats",
  "--extractor-args",
  "youtube:player_client=android,web",
];

// Define custom error types
export type YtDlpErrorType =
  | "INVALID_URL"
  | "PRIVATE_VIDEO"
  | "DELETED_VIDEO"
  | "AGE_RESTRICTED"
  | "RATE_LIMITED"
  | "GEO_LOCKED"
  | "TIMEOUT"
  | "COMMAND_FAILED"
  | "UNKNOWN";

export class YtDlpError extends Error {
  type: YtDlpErrorType;
  originalError?: string;

  constructor(type: YtDlpErrorType, message: string, originalError?: string) {
    super(message);
    this.name = "YtDlpError";
    this.type = type;
    this.originalError = originalError;

    // Maintain proper stack trace in V8 (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, YtDlpError);
    }
  }
}

// Raw JSON schemas matching yt-dlp's output
interface YtDlpRawFormat {
  format_id: string;
  format_note?: string;
  ext: string;
  url: string;
  filesize?: number | null;
  filesize_approx?: number | null;
  width?: number | null;
  height?: number | null;
  fps?: number | null;
  vcodec?: string;
  acodec?: string;
  resolution?: string;
  container?: string;
  protocol?: string;
  abr?: number | null;
  vbr?: number | null;
}

interface YtDlpRawOutput {
  id: string;
  title: string;
  thumbnail?: string;
  thumbnails?: { url: string; width?: number; height?: number; id?: string }[];
  duration?: number | null;
  description?: string;
  uploader?: string;
  webpage_url?: string;
  formats?: YtDlpRawFormat[];
}

/**
 * Validates if the input string is a valid HTTP/HTTPS URL.
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Parses yt-dlp stderr output to determine the type of failure.
 */
function parseYtDlpError(stderr: string): YtDlpError {
  const lowerStderr = stderr.toLowerCase();

  if (lowerStderr.includes("private video") || lowerStderr.includes("is private")) {
    return new YtDlpError(
      "PRIVATE_VIDEO",
      "The requested video is private and cannot be accessed.",
      stderr
    );
  }

  if (
    lowerStderr.includes("deleted") ||
    lowerStderr.includes("removed by the user") ||
    lowerStderr.includes("video unavailable") ||
    lowerStderr.includes("does not exist") ||
    lowerStderr.includes("not found")
  ) {
    return new YtDlpError(
      "DELETED_VIDEO",
      "The requested video has been deleted or is unavailable.",
      stderr
    );
  }

  if (
    lowerStderr.includes("confirm your age") ||
    lowerStderr.includes("age-gated") ||
    lowerStderr.includes("sign in to confirm your age") ||
    lowerStderr.includes("age restriction")
  ) {
    return new YtDlpError(
      "AGE_RESTRICTED",
      "The video is age-restricted and requires age verification/authentication.",
      stderr
    );
  }

  if (
    lowerStderr.includes("429") ||
    lowerStderr.includes("too many requests") ||
    lowerStderr.includes("rate limit") ||
    lowerStderr.includes("http error 429")
  ) {
    return new YtDlpError(
      "RATE_LIMITED",
      "The platform is rate-limiting requests. Try again later or configure proxies.",
      stderr
    );
  }

  if (
    lowerStderr.includes("geo") ||
    lowerStderr.includes("country") ||
    lowerStderr.includes("not available in your country") ||
    lowerStderr.includes("geoblocked")
  ) {
    return new YtDlpError(
      "GEO_LOCKED",
      "The video is geo-blocked and is not available in the current region.",
      stderr
    );
  }

  if (
    lowerStderr.includes("unsupported url") ||
    lowerStderr.includes("is not a valid url")
  ) {
    return new YtDlpError(
      "INVALID_URL",
      "The provided URL is not supported by yt-dlp.",
      stderr
    );
  }

  return new YtDlpError(
    "COMMAND_FAILED",
    "Failed to retrieve video metadata from yt-dlp.",
    stderr
  );
}

/**
 * Maps raw yt-dlp JSON output to a clean TypeScript VideoMetadata object.
 */
function mapRawMetadata(raw: YtDlpRawOutput): VideoMetadata {
  // Filter out storyboards, mhtml streams, and other formats that aren't download targets
  const filteredFormats = (raw.formats || [])
    .filter((f) => {
      // Exclude storyboards and mhtml layouts
      if (f.protocol === "mhtml" || f.format_note === "storyboard") {
        return false;
      }
      // Ensure we have a valid direct stream URL
      return !!f.url;
    })
    .map((f): VideoFormat => ({
      formatId: f.format_id,
      formatNote: f.format_note || undefined,
      ext: f.ext,
      url: f.url,
      filesize: f.filesize ?? f.filesize_approx ?? null,
      width: f.width ?? null,
      height: f.height ?? null,
      fps: f.fps ?? null,
      vcodec: f.vcodec || "none",
      acodec: f.acodec || "none",
      container: f.container || undefined,
      resolution: f.resolution || undefined,
      audioBitrate: f.abr ?? null,
      videoBitrate: f.vbr ?? null,
    }));

  return {
    id: raw.id,
    title: raw.title || "Unknown Title",
    thumbnail: raw.thumbnail || "",
    thumbnails: (raw.thumbnails || []).map((t) => ({
      url: t.url,
      width: t.width,
      height: t.height,
    })),
    duration: raw.duration || 0,
    description: raw.description || undefined,
    uploader: raw.uploader || undefined,
    webpageUrl: raw.webpage_url || "",
    formats: filteredFormats,
  };
}

/**
 * Safely extracts video details (title, thumbnail, duration, formats, direct links) using yt-dlp.
 * Bypasses shell execution to prevent injection attacks and handles rotating proxies dynamically.
 * 
 * @param url The target video URL to inspect
 * @returns Object with success status, data (VideoMetadata) on success, or error details on failure
 */
export async function getVideoMetadata(url: string): Promise<ExtractorResponse> {
  // 1. Validate input URL format
  if (!url || !isValidUrl(url)) {
    return {
      success: false,
      error: "The provided string is not a valid HTTP or HTTPS URL.",
      errorType: "INVALID_URL",
    };
  }

  // Determine path of the yt-dlp executable
  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";

  // Get next proxy argument from rotation list
  const proxyArgs = getProxyFlag();

  // Command arguments (safer than using a raw shell command)
  const args = [
    ...YTDLP_COMMON_ARGS,
    ...proxyArgs,
    "--dump-json",
    "--no-playlist",
    url,
  ];

  try {
    const { stdout } = await execFilePromise(ytdlpPath, args, {
      maxBuffer: 1024 * 1024 * 10, // Allow up to 10MB buffer for large metadata outputs
      timeout: 30000, // Timeout after 30 seconds
    });

    if (!stdout.trim()) {
      return {
        success: false,
        error: "yt-dlp completed successfully but returned empty output.",
        errorType: "COMMAND_FAILED",
      };
    }

    const rawData = JSON.parse(stdout) as YtDlpRawOutput;
    const data = mapRawMetadata(rawData);
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    // Check if the command timed out
    if (error.code === "ETIMEDOUT" || error.signal === "SIGTERM" || error.killed) {
      return {
        success: false,
        error: "The metadata extraction request timed out after 30 seconds.",
        errorType: "TIMEOUT",
      };
    }

    // Capture standard stderr from execFile failure
    const stderr = error.stderr || "";
    if (stderr) {
      const parsedErr = parseYtDlpError(stderr);
      return {
        success: false,
        error: parsedErr.message,
        errorType: parsedErr.type,
      };
    }

    // Fallback for general execution errors (e.g. executable not found)
    return {
      success: false,
      error: `yt-dlp execution failed: ${error.message}`,
      errorType: error.code === "ENOENT" ? "COMMAND_FAILED" : "UNKNOWN",
    };
  }
}

/**
 * Downloads a video/audio file directly to OS temporary directory (/tmp/downloads or os.tmpdir()/downloads)
 * using yt-dlp with anti-bot bypass parameters.
 * Returns the exact absolute path to the downloaded file and a cleanup function.
 */
export async function downloadMediaFile(
  url: string,
  formatId?: string
): Promise<{ filePath: string; cleanup: () => void }> {
  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
  const proxyArgs = getProxyFlag();

  // 1. Ensure temp downloads folder exists
  const tempDir = path.join(os.tmpdir(), "downloads");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // 2. Generate a unique output file template
  const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const outputTemplate = path.join(tempDir, `${fileId}.%(ext)s`);

  // 3. Prepare yt-dlp arguments
  const args = [
    ...YTDLP_COMMON_ARGS,
    ...proxyArgs,
    "-o",
    outputTemplate,
    "--no-playlist",
  ];

  if (formatId) {
    args.push("-f", formatId);
  }

  args.push(url);

  // Execute yt-dlp to download the file into temp directory
  await execFilePromise(ytdlpPath, args, {
    maxBuffer: 1024 * 1024 * 50,
    timeout: 120000, // 2 minutes max download time
  });

  // Find the generated output file matching fileId
  const files = fs.readdirSync(tempDir);
  const matchedFile = files.find((f) => f.startsWith(fileId));

  if (!matchedFile) {
    throw new YtDlpError(
      "COMMAND_FAILED",
      "Downloaded file could not be found in temporary directory."
    );
  }

  const absolutePath = path.join(tempDir, matchedFile);

  const cleanup = () => {
    try {
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (err) {
      console.error(`Failed to cleanup temp file ${absolutePath}:`, err);
    }
  };

  return { filePath: absolutePath, cleanup };
}

