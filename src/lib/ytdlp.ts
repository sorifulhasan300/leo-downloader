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

// Modern User Agent string
export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

// Client strategies for YouTube extractor retries
export const YOUTUBE_CLIENT_STRATEGIES = [
  "youtube:player_client=android,web,tv",
  "youtube:player_client=android,web",
  "youtube:player_client=web,mweb",
  "youtube:player_client=tv,android",
];

// Common yt-dlp CLI arguments to bypass bot checks, age restrictions, and certificate issues
export const YTDLP_COMMON_ARGS = [
  "--user-agent",
  DEFAULT_USER_AGENT,
  "--no-check-certificates",
  "--no-warnings",
  "--dump-single-json",
  "--flat-playlist",
  "--skip-download",
];

/**
 * Resolves cookie file path if a cookies.txt file exists in:
 * 1. process.env.YTDLP_COOKIES_PATH
 * 2. Root project directory (process.cwd() + '/cookies.txt')
 * 3. /tmp/cookies.txt or os.tmpdir() + '/cookies.txt'
 * 
 * @returns Array with ['--cookies', filePath] if found, or empty array []
 */
export function getCookieFlag(): string[] {
  const candidatePaths = [
    process.env.YTDLP_COOKIES_PATH,
    path.join(process.cwd(), "cookies.txt"),
    path.join(os.tmpdir(), "cookies.txt"),
    "/tmp/cookies.txt",
  ].filter(Boolean) as string[];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return ["--cookies", candidate];
      }
    } catch {
      // Ignore filesystem check errors
    }
  }

  return [];
}

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
  entries?: YtDlpRawOutput[];
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
  // If flat playlist resulted in entries, pick the first video entry or raw
  const target = raw.entries && raw.entries.length > 0 ? raw.entries[0] : raw;

  const filteredFormats = (target.formats || [])
    .filter((f) => {
      if (f.protocol === "mhtml" || f.format_note === "storyboard") {
        return false;
      }
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
    id: target.id || raw.id,
    title: target.title || raw.title || "Unknown Title",
    thumbnail: target.thumbnail || raw.thumbnail || "",
    thumbnails: (target.thumbnails || raw.thumbnails || []).map((t) => ({
      url: t.url,
      width: t.width,
      height: t.height,
    })),
    duration: target.duration ?? raw.duration ?? 0,
    description: target.description || raw.description || undefined,
    uploader: target.uploader || raw.uploader || undefined,
    webpageUrl: target.webpage_url || raw.webpage_url || "",
    formats: filteredFormats,
  };
}

/**
 * Safely extracts video details using yt-dlp with retry logic, dynamic extractor flags,
 * proxy rotation, and cookies support.
 * 
 * @param url The target video URL to inspect
 * @param maxRetries Maximum retry attempts (default: 2 retries = 3 total attempts)
 * @returns ExtractorResponse with video metadata or structured error details
 */
export async function getVideoMetadata(
  url: string,
  maxRetries: number = 2
): Promise<ExtractorResponse> {
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

  // Resolve cookie and proxy flags
  const cookieArgs = getCookieFlag();

  let lastError: any = null;
  let lastStderr: string = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Get fresh proxy for each attempt (rotates if PROXY_LIST is provided)
    const proxyArgs = getProxyFlag();

    // Select player client extractor argument for this attempt
    const clientStrategy = YOUTUBE_CLIENT_STRATEGIES[attempt % YOUTUBE_CLIENT_STRATEGIES.length];

    const args = [
      ...YTDLP_COMMON_ARGS,
      "--extractor-args",
      clientStrategy,
      ...proxyArgs,
      ...cookieArgs,
      url,
    ];

    try {
      console.log(
        `[yt-dlp metadata extraction] Attempt ${attempt + 1}/${maxRetries + 1} for URL: ${url} (Strategy: ${clientStrategy}, Proxy: ${proxyArgs.length ? proxyArgs[1] : "none"}, Cookies: ${cookieArgs.length ? cookieArgs[1] : "none"})`
      );

      const { stdout, stderr } = await execFilePromise(ytdlpPath, args, {
        maxBuffer: 1024 * 1024 * 15, // 15MB buffer
        timeout: 30000, // 30s timeout
      });

      if (stderr) {
        console.warn(`[yt-dlp stderr] Attempt ${attempt + 1}: ${stderr.trim()}`);
      }

      if (!stdout.trim()) {
        throw new Error("yt-dlp returned empty JSON stdout.");
      }

      const rawData = JSON.parse(stdout) as YtDlpRawOutput;
      const data = mapRawMetadata(rawData);

      return {
        success: true,
        data,
      };
    } catch (err: any) {
      lastError = err;
      lastStderr = err.stderr || err.message || "";

      console.error(
        `[yt-dlp extraction error] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${err.message}`
      );
      if (lastStderr) {
        console.error(`[yt-dlp stderr details]:\n${lastStderr}`);
      }

      // If it's an invalid URL, retrying won't help
      if (lastStderr.toLowerCase().includes("unsupported url")) {
        break;
      }
    }
  }

  // Handle final failure after retries
  if (lastError?.code === "ETIMEDOUT" || lastError?.signal === "SIGTERM" || lastError?.killed) {
    return {
      success: false,
      error: "The metadata extraction request timed out after multiple attempts.",
      errorType: "TIMEOUT",
    };
  }

  if (lastStderr) {
    const parsedErr = parseYtDlpError(lastStderr);
    return {
      success: false,
      error: parsedErr.message,
      errorType: parsedErr.type,
    };
  }

  return {
    success: false,
    error: `yt-dlp execution failed: ${lastError?.message || "Unknown error"}`,
    errorType: lastError?.code === "ENOENT" ? "COMMAND_FAILED" : "UNKNOWN",
  };
}

/**
 * Downloads a video/audio file directly to OS temporary directory
 * using yt-dlp with anti-bot bypass parameters, proxy, and cookie flags.
 * Dynamic file detection matches any output extension (.mp4, .webm, .mkv, .mp3, etc.)
 */
export async function downloadMediaFile(
  url: string,
  formatId?: string
): Promise<{ filePath: string; cleanup: () => void }> {
  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
  const proxyArgs = getProxyFlag();
  const cookieArgs = getCookieFlag();

  // 1. Ensure temp downloads folder exists in OS temporary directory
  const tempDir = path.join(os.tmpdir(), "downloads");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // 2. Generate a unique output file template prefix
  const uniqueId = `dl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const outputTemplate = path.join(tempDir, `${uniqueId}.%(ext)s`);

  // 3. Prepare yt-dlp arguments
  const args = [
    "--user-agent",
    DEFAULT_USER_AGENT,
    "--no-check-certificates",
    "--no-warnings",
    "--extractor-args",
    "youtube:player_client=android,web,tv",
    ...proxyArgs,
    ...cookieArgs,
    "-o",
    outputTemplate,
    "--no-playlist",
  ];

  // Handle formatId selection and virtual MP3 extraction
  if (formatId) {
    if (formatId.endsWith("-mp3")) {
      const cleanFormatId = formatId.replace("-mp3", "");
      args.push("-f", cleanFormatId, "-x", "--audio-format", "mp3");
    } else {
      args.push("-f", formatId);
    }
  }

  args.push(url);

  console.log(`[yt-dlp download] Executing download for ${url} (uniqueId: ${uniqueId})`);

  try {
    const { stderr } = await execFilePromise(ytdlpPath, args, {
      maxBuffer: 1024 * 1024 * 50,
      timeout: 120000, // 2 minutes max download time
    });

    if (stderr) {
      console.warn(`[yt-dlp download stderr]: ${stderr.trim()}`);
    }
  } catch (err: any) {
    console.error(`[yt-dlp download error]: ${err.message}`);
    if (err.stderr) {
      console.error(`[yt-dlp download stderr details]:\n${err.stderr}`);
    }
    throw parseYtDlpError(err.stderr || err.message);
  }

  // 4. Dynamic File Detection: Read directory to find the generated file matching uniqueId
  const files = fs.readdirSync(tempDir);
  const matchedFile = files.find(
    (f) =>
      f.startsWith(uniqueId) &&
      !f.endsWith(".part") &&
      !f.endsWith(".ytdl") &&
      !f.endsWith(".tmp")
  );

  if (!matchedFile) {
    console.error(`[yt-dlp download match failure] uniqueId: ${uniqueId}. Files in ${tempDir}:`, files);
    throw new YtDlpError(
      "COMMAND_FAILED",
      "Downloaded file could not be found in temporary directory."
    );
  }

  const absolutePath = path.join(tempDir, matchedFile);

  // 5. Safe Cleanup callback
  const cleanup = () => {
    try {
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        console.log(`[yt-dlp cleanup] Deleted temporary file: ${absolutePath}`);
      }
    } catch (err) {
      console.error(`Failed to cleanup temp file ${absolutePath}:`, err);
    }
  };

  return { filePath: absolutePath, cleanup };
}



