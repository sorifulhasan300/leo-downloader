"use client";

import React, { useState, useEffect, useRef } from "react";

/**
 * Interface representing individual media items returned by ZM API / backend
 */
export interface MediaItem {
  url: string;
  quality?: string;
  extension?: string;
  type?: string;
  width?: number | null;
  height?: number | null;
  data_size?: number | null;
  formatId?: string;
  ext?: string;
  filesize?: number | null;
  hasAudio?: boolean;
  hasVideo?: boolean;
}

/**
 * Interface representing the video metadata returned by ZM API / backend
 */
export interface DownloaderData {
  title: string;
  author?: string;
  thumbnail?: string;
  source?: string;
  duration?: number;
  medias: MediaItem[];
}

export interface DownloaderProps {
  initialUrl?: string;
  placeholder?: string;
  onSuccess?: (data: DownloaderData) => void;
  onError?: (errorMsg: string) => void;
  className?: string;
}

/**
 * Helper to format raw byte counts into human-readable MB / KB strings.
 */
function formatSizeInMB(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) {
    return "N/A";
  }
  const mb = bytes / (1024 * 1024);
  if (mb < 0.1) {
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
}

/**
 * Helper to format duration in seconds to MM:SS or HH:MM:SS format.
 */
function formatDuration(seconds?: number | null): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return "";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Helper to detect social media platform from source or URL string
 */
function getPlatformInfo(sourceOrUrl?: string) {
  const str = (sourceOrUrl || "").toLowerCase();
  if (str.includes("tiktok.com") || str.includes("tiktok")) {
    return {
      name: "TikTok",
      bgColor: "bg-pink-500/10",
      textColor: "text-pink-400",
      borderColor: "border-pink-500/30",
      badgeGradient: "from-pink-500 to-rose-500",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V5.8a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 12a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.45 8.45 0 0 0 4.92 1.56V6.8a4.85 4.85 0 0 1-1-.11z" />
        </svg>
      ),
    };
  }
  if (str.includes("facebook.com") || str.includes("fb.watch") || str.includes("facebook")) {
    return {
      name: "Facebook",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/30",
      badgeGradient: "from-blue-600 to-cyan-600",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    };
  }
  if (str.includes("instagram.com") || str.includes("instagram")) {
    return {
      name: "Instagram",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-400",
      borderColor: "border-purple-500/30",
      badgeGradient: "from-purple-600 via-pink-600 to-amber-500",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    };
  }
  if (str.includes("youtube.com") || str.includes("youtu.be") || str.includes("youtube")) {
    return {
      name: "YouTube",
      bgColor: "bg-red-500/10",
      textColor: "text-red-400",
      borderColor: "border-red-500/30",
      badgeGradient: "from-red-600 to-rose-600",
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    };
  }
  return {
    name: "Social Media",
    bgColor: "bg-indigo-500/10",
    textColor: "text-indigo-400",
    borderColor: "border-indigo-500/30",
    badgeGradient: "from-violet-600 to-indigo-600",
    icon: (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    ),
  };
}

/**
 * Generate formatted dynamic badge for each media format item
 */
function getMediaBadge(media: MediaItem) {
  const quality = (media.quality || "").toLowerCase();
  const type = (media.type || "").toLowerCase();
  const ext = (media.ext || media.extension || "mp4").toUpperCase();

  if (type === "audio" || quality.includes("audio") || ext === "MP3") {
    return {
      label: "Audio MP3",
      style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    };
  }

  if (quality.includes("hd_no_watermark") || (quality.includes("hd") && quality.includes("no_watermark"))) {
    return {
      label: "HD MP4 (No Watermark)",
      style: "bg-purple-500/15 text-purple-300 border-purple-500/40 font-semibold shadow-purple-500/10",
    };
  }

  if (quality.includes("no_watermark") || quality === "nowatermark") {
    return {
      label: "No Watermark",
      style: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-medium",
    };
  }

  if (quality.includes("watermark")) {
    return {
      label: "Watermark",
      style: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    };
  }

  if (quality.includes("1080") || quality.includes("hd")) {
    return {
      label: `HD ${ext}`,
      style: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 font-semibold",
    };
  }

  return {
    label: media.quality || `${ext} Media`,
    style: "bg-zinc-800 text-zinc-300 border-zinc-700/50",
  };
}

export default function Downloader({
  initialUrl = "",
  placeholder = "Paste TikTok, Facebook, Instagram or YouTube link here...",
  onSuccess,
  onError,
  className = "",
}: DownloaderProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DownloaderData | null>(null);
  const [canPaste, setCanPaste] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check browser clipboard support
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.clipboard && typeof navigator.clipboard.readText === "function") {
      setCanPaste(true);
    }
  }, []);

  // Form submit handler to trigger download API
  const handleExtract = async (targetUrl?: string) => {
    const queryUrl = (targetUrl || url).trim();
    if (!queryUrl) {
      setError("Please paste or enter a valid video link.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: queryUrl }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || data.message || "Failed to extract video details. Please verify the URL.";
        throw new Error(errorMsg);
      }

      // Structure metadata and medias cleanly from API response
      const extractedData: DownloaderData = {
        title: data.data?.title || data.title || "Extracted Social Video",
        author: data.data?.author || data.author || "",
        thumbnail: data.data?.thumbnail || data.thumbnail || "",
        source: data.data?.source || data.source || queryUrl,
        duration: data.data?.duration || data.duration || 0,
        medias: data.data?.medias || data.medias || data.formats || [],
      };

      setResult(extractedData);
      if (onSuccess) onSuccess(extractedData);
    } catch (err: any) {
      const errorMsg = err.message || "An unexpected error occurred while fetching video data.";
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct paste handler from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        if (inputRef.current) inputRef.current.focus();
        // Automatically trigger download if it looks like a URL
        if (text.startsWith("http://") || text.startsWith("https://")) {
          handleExtract(text);
        }
      }
    } catch (err) {
      console.warn("Clipboard access failed:", err);
    }
  };

  // Direct Download action handler
  const handleDirectDownload = (mediaUrl: string, formatTitle?: string) => {
    if (!mediaUrl) return;
    
    // Trigger opening direct URL in a new tab / force download
    const link = document.createElement("a");
    link.href = mediaUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    if (formatTitle) {
      link.download = formatTitle;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy link handler
  const handleCopyLink = (mediaUrl: string) => {
    navigator.clipboard.writeText(mediaUrl);
    setCopiedUrl(mediaUrl);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const platformInfo = result ? getPlatformInfo(result.source || url) : getPlatformInfo(url);

  return (
    <div className={`w-full max-w-4xl mx-auto flex flex-col gap-6 ${className}`}>
      
      {/* 1. FORM INPUT SECTION */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleExtract();
        }}
        className="relative group w-full"
      >
        {/* Glow effect background */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 opacity-25 blur transition duration-700 group-focus-within:opacity-50 group-hover:opacity-40" />

        <div className="relative flex flex-col sm:flex-row items-center gap-2.5 p-2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/90 rounded-2xl shadow-2xl">
          {/* Input field & paste / clear action */}
          <div className="relative flex-1 flex items-center w-full">
            <div className="pl-4 text-zinc-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>

            <input
              ref={inputRef}
              id="downloader-url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={placeholder}
              disabled={isLoading}
              className="w-full px-3 py-3.5 bg-transparent text-white placeholder-zinc-500 text-sm md:text-base border-none outline-none focus:ring-0 disabled:opacity-50"
            />

            {/* Clear input button */}
            {url && (
              <button
                type="button"
                onClick={() => {
                  setUrl("");
                  setResult(null);
                  setError(null);
                  if (inputRef.current) inputRef.current.focus();
                }}
                className="p-1.5 mr-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors shrink-0"
                title="Clear input"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Clipboard Paste button */}
            {canPaste && !url && (
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition duration-200 shrink-0"
                title="Paste URL from clipboard & trigger download"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0A2.25 2.25 0 0113.5 5.25h-3a2.25 2.25 0 01-2.166-1.362m7.332 0c.055.194.084.4.084.612v1.5a.75.75 0 01-.75.75H8.25a.75.75 0 01-.75-.75V3.125c0-.212.03-.418.084-.612m1.104 2.188A9 9 0 118.25 18v-7.375c0-.621.504-1.125 1.125-1.125H18" />
                </svg>
                <span>Paste</span>
              </button>
            )}
          </div>

          {/* Extract / Download Submit Button */}
          <button
            type="submit"
            id="downloader-submit-btn"
            disabled={!url.trim() || isLoading}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm md:text-base tracking-wide transition-all duration-300 shadow-lg ${
              url.trim() && !isLoading
                ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white cursor-pointer active:scale-95 shadow-indigo-500/25"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/30"
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <span>Download</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 2. ERROR STATE ALERT */}
      {error && (
        <div className="p-4.5 rounded-2xl bg-red-500/10 border border-red-500/25 backdrop-blur-md text-red-200 text-sm flex items-start gap-3.5 shadow-xl animate-fadeIn">
          <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-red-300 text-base">Extraction Failed</h4>
            <p className="mt-1 text-red-300/90 leading-relaxed text-xs md:text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 transition-colors"
            title="Dismiss alert"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 2. LOADING STATE SKELETON */}
      {isLoading && (
        <div className="w-full bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 md:p-6 shadow-2xl animate-pulse flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-5 pb-6 border-b border-zinc-800/60">
            <div className="w-full md:w-64 aspect-video rounded-xl bg-zinc-800 shrink-0" />
            <div className="flex-1 flex flex-col justify-between py-1 gap-3">
              <div className="space-y-2">
                <div className="h-6 bg-zinc-800 rounded-md w-4/5" />
                <div className="h-4 bg-zinc-800 rounded-md w-2/5" />
              </div>
              <div className="flex gap-3">
                <div className="h-6 bg-zinc-800 rounded-full w-24" />
                <div className="h-6 bg-zinc-800 rounded-full w-20" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-zinc-800 rounded-md w-40" />
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-2 space-y-2">
              <div className="h-12 bg-zinc-900 rounded-lg w-full" />
              <div className="h-12 bg-zinc-900 rounded-lg w-full" />
              <div className="h-12 bg-zinc-900 rounded-lg w-full" />
            </div>
          </div>
        </div>
      )}

      {/* 3. MEDIA CARD RENDERING */}
      {result && !isLoading && (
        <div className="w-full bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-5 md:p-7 shadow-2xl animate-fadeIn">
          
          {/* Metadata Card Header */}
          <div className="flex flex-col md:flex-row gap-6 pb-6 border-b border-zinc-800/80">
            {/* Thumbnail */}
            <div className="relative group shrink-0 w-full md:w-64 aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/80 shadow-lg">
              {result.thumbnail ? (
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
              )}

              {/* Duration Badge */}
              {result.duration ? (
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/85 text-white font-mono text-xs font-semibold tracking-wide border border-white/10 shadow-md backdrop-blur-sm">
                  {formatDuration(result.duration)}
                </div>
              ) : null}
            </div>

            {/* Metadata Text Content */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Platform Tag */}
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${platformInfo.bgColor} ${platformInfo.textColor} ${platformInfo.borderColor}`}
                  >
                    {platformInfo.icon}
                    <span>{platformInfo.name}</span>
                  </span>
                </div>

                {/* Video Title */}
                <h2 className="text-lg md:text-xl font-extrabold text-white leading-snug tracking-tight line-clamp-2">
                  {result.title}
                </h2>

                {/* Author / Username */}
                {result.author && (
                  <div className="mt-2.5 flex items-center gap-2 text-xs md:text-sm text-zinc-400">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-zinc-200 font-medium">
                      <svg className="w-3.5 h-3.5 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {result.author}
                    </span>
                  </div>
                )}
              </div>

              {/* Source link badge */}
              {result.source && (
                <div className="mt-4 pt-3 border-t border-zinc-800/50">
                  <a
                    href={result.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    <span>View original post</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 3. MEDIA OPTIONS LIST */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Available Media Options ({result.medias.length})
              </h3>
            </div>

            {/* Media Items Table / Grid */}
            <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/60 shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-900/60 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Format / Quality</th>
                    <th className="px-4 py-3">File Size</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Download Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-sm">
                  {result.medias.map((media, idx) => {
                    const badge = getMediaBadge(media);
                    const sizeInMB = formatSizeInMB(media.data_size || media.filesize);
                    const ext = (media.extension || media.ext || (media.type === "audio" ? "mp3" : "mp4")).toUpperCase();

                    return (
                      <tr key={idx} className="hover:bg-zinc-900/40 transition-colors group">
                        
                        {/* Quality Badge */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs border ${badge.style}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* File Size in MB */}
                        <td className="px-4 py-3.5 text-zinc-300 font-mono text-xs font-medium">
                          {sizeInMB}
                        </td>

                        {/* Format Extension */}
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-xs uppercase border border-zinc-700/50">
                            {ext}
                          </span>
                        </td>

                        {/* 4. DIRECT DOWNLOAD HANDLER */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            
                            {/* Copy direct URL button */}
                            <button
                              type="button"
                              onClick={() => handleCopyLink(media.url)}
                              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="Copy direct download link"
                            >
                              {copiedUrl === media.url ? (
                                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.75v-6.75a2.25 2.25 0 00-2.25-2.25H15" />
                                </svg>
                              )}
                            </button>

                            {/* Direct Download Button */}
                            <button
                              type="button"
                              onClick={() => handleDirectDownload(media.url, `${result.title || "media"}.${ext.toLowerCase()}`)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all"
                            >
                              <span>Download</span>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
