"use client";

import React, { useState } from "react";
import AdBanner from "./AdBanner";

export interface MediaOption {
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
  fps?: number | null;
}

export interface VideoMetadata {
  id?: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  description?: string;
  uploader?: string;
  author?: string;
  webpageUrl?: string;
  source?: string;
  medias?: MediaOption[];
}

export interface VideoResultProps {
  metadata: VideoMetadata | null;
  formats?: MediaOption[];
  isLoading: boolean;
}

/**
 * Format bytes or raw size input to MB string (e.g. 5.4 MB)
 */
function formatSizeInMB(input?: number | string | null, rawMedia?: any): string {
  let val: number | string | null = input ?? null;

  if (val === null || val === undefined || val === "" || val === "N/A") {
    if (rawMedia && typeof rawMedia === "object") {
      val =
        rawMedia.data_size ??
        rawMedia.size ??
        rawMedia.filesize ??
        rawMedia.file_size ??
        rawMedia.bytes ??
        rawMedia.formatted_size ??
        null;
    }
  }

  if (val === null || val === undefined || val === "" || val === "N/A") {
    return "N/A";
  }

  if (typeof val === "number") {
    if (isNaN(val) || val <= 0) return "N/A";
    const mb = val / (1024 * 1024);
    if (mb < 0.1) {
      return `${(val / 1024).toFixed(1)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  }

  if (typeof val === "string") {
    const str = val.trim();
    if (!str || str === "N/A") return "N/A";

    if (/[a-zA-Z]/.test(str)) {
      return str;
    }

    const num = Number(str);
    if (!isNaN(num) && num > 0) {
      const mb = num / (1024 * 1024);
      if (mb < 0.1) {
        return `${(num / 1024).toFixed(1)} KB`;
      }
      return `${mb.toFixed(1)} MB`;
    }
  }

  return "N/A";
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds <= 0) return "";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Detect social platform tag (TikTok, Facebook, Instagram, YouTube, etc.)
 */
function getPlatformTag(sourceUrl?: string) {
  const url = (sourceUrl || "").toLowerCase();
  if (url.includes("tiktok")) {
    return { name: "TikTok", badge: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30" };
  }
  if (url.includes("facebook") || url.includes("fb.watch")) {
    return { name: "Facebook", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" };
  }
  if (url.includes("instagram")) {
    return { name: "Instagram", badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30" };
  }
  if (url.includes("youtube") || url.includes("youtu.be")) {
    return { name: "YouTube", badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30" };
  }
  return { name: "Social Media", badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30" };
}

/**
 * Generate dynamic badges for media options
 */
function getDynamicBadge(item: MediaOption) {
  const quality = (item.quality || "").toLowerCase();
  const type = (item.type || "").toLowerCase();
  const ext = (item.extension || item.ext || "mp4").toUpperCase();
  const height = item.height || 0;
  const width = item.width || 0;

  if (type === "audio" || quality.includes("audio") || ext === "MP3") {
    return {
      label: "Audio MP3",
      style: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium",
    };
  }

  if (
    quality.includes("1080") ||
    quality.includes("full hd") ||
    quality.includes("fhd") ||
    quality.includes("1080p") ||
    height >= 1080 ||
    width >= 1920
  ) {
    return {
      label: `Full HD 1080p (${ext})`,
      style: "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 font-extrabold shadow-sm",
    };
  }

  if (quality.includes("720") || quality.includes("720p") || height >= 720 || (quality.includes("hd") && !quality.includes("sd"))) {
    return {
      label: `HD 720p (${ext})`,
      style: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 font-semibold",
    };
  }

  if (quality.includes("hd_no_watermark") || (quality.includes("hd") && quality.includes("no_watermark"))) {
    return {
      label: "HD MP4 (No Watermark)",
      style: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40 font-semibold",
    };
  }

  if (quality.includes("no_watermark") || quality === "nowatermark") {
    return {
      label: "No Watermark",
      style: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 font-medium",
    };
  }

  if (quality.includes("watermark")) {
    return {
      label: "Watermark",
      style: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    };
  }

  return {
    label: item.quality || `${ext} Media`,
    style: "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700/50",
  };
}

export default function VideoResult({ metadata, formats = [], isLoading }: VideoResultProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (isLoading) {
    return <VideoResultSkeleton />;
  }

  if (!metadata) {
    return null;
  }

  // Support both metadata.medias array from ZM API and formats array
  const mediaList: MediaOption[] = (metadata.medias && metadata.medias.length > 0)
    ? metadata.medias
    : formats;

  const authorName = metadata.author || metadata.uploader || "";
  const sourceUrl = metadata.source || metadata.webpageUrl || "";
  const platformTag = getPlatformTag(sourceUrl);

  const handleDownload = (mediaUrl: string, title?: string, ext?: string) => {
    if (!mediaUrl) return;
    const cleanExt = (ext || "mp4").toLowerCase().replace(/^\./, "");
    const safeTitle = (title || "video").trim().replace(/[/\\?%*:|"<>]/g, "_");
    const fileName = `${safeTitle}.${cleanExt}`;

    const proxyUrl = `/api/download-file?fileUrl=${encodeURIComponent(mediaUrl)}&fileName=${encodeURIComponent(fileName)}`;

    const link = document.createElement("a");
    link.href = proxyUrl;
    link.download = fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = (mediaUrl: string, idx: number) => {
    navigator.clipboard.writeText(mediaUrl);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="w-full bg-white/90 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl p-5 md:p-7 shadow-xl shadow-zinc-200/50 dark:shadow-2xl animate-fadeIn transition-colors duration-300">
      {/* Video Metadata Card Header */}
      <div className="flex flex-col md:flex-row gap-6 pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80">
        {/* Thumbnail Wrapper */}
        <div className="relative group shrink-0 w-full md:w-64 aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
          )}
          {/* Duration Badge */}
          {metadata.duration ? (
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/85 text-white font-mono text-xs font-semibold tracking-wide border border-white/10 shadow-lg backdrop-blur-sm">
              {formatDuration(metadata.duration)}
            </div>
          ) : null}
        </div>

        {/* Video Text Metadata */}
        <div className="flex-1 flex flex-col justify-between py-0.5">
          <div>
            {/* Source Platform Tag */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${platformTag.badge}`}>
                {platformTag.name}
              </span>
            </div>

            {/* Video Title */}
            <h2 className="text-lg md:text-xl font-extrabold text-zinc-900 dark:text-white leading-snug tracking-tight line-clamp-2">
              {metadata.title}
            </h2>

            {/* Author / Username */}
            {authorName && (
              <div className="mt-2.5 flex items-center gap-2 text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/40 text-zinc-700 dark:text-zinc-200 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-zinc-400">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {authorName}
                </span>
              </div>
            )}
          </div>

          {sourceUrl && (
            <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/50">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                <span>View original post</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Download Options Section */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-violet-600 dark:text-violet-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Available Download Links ({mediaList.length})
        </h3>

        {/* Media Options Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/60 shadow-inner">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/80 dark:bg-zinc-900/60 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                <th className="px-4 py-3">Format / Quality</th>
                <th className="px-4 py-3">File Size</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Download Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-sm">
              {mediaList.map((media, idx) => {
                const badge = getDynamicBadge(media);
                const sizeMB = formatSizeInMB(media.data_size || media.filesize, media);
                const ext = (media.extension || media.ext || (media.type === "audio" ? "mp3" : "mp4")).toUpperCase();

                return (
                  <tr key={idx} className="hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 transition-colors group">
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs border ${badge.style}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-300 font-mono text-xs font-medium">
                      {sizeMB}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 font-mono text-xs uppercase border border-zinc-300 dark:border-zinc-700/50">
                        {ext}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* Copy Link Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(media.url, idx)}
                          className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                          title="Copy direct stream link"
                        >
                          {copiedIndex === idx ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-emerald-600 dark:text-emerald-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.75v-6.75a2.25 2.25 0 00-2.25-2.25H15" />
                            </svg>
                          )}
                        </button>

                        {/* Direct Download Button */}
                        <button
                          type="button"
                          onClick={() => handleDownload(media.url, metadata.title, ext)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                          <span>Download</span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
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

        {/* CPM Ad Placement */}
        <div className="mt-6 pt-5 border-t border-zinc-200/80 dark:border-zinc-800/50">
          <AdBanner placement="below-table" format="responsive" />
        </div>
      </div>
    </div>
  );
}

function VideoResultSkeleton() {
  return (
    <div className="w-full bg-white/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 md:p-6 shadow-xl animate-pulse flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-5 pb-6 border-b border-zinc-200 dark:border-zinc-800/60">
        <div className="w-full md:w-64 aspect-video rounded-xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />
        <div className="flex-1 flex flex-col justify-between py-1 gap-3">
          <div className="space-y-2">
            <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-md w-4/5" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-2/5" />
          </div>
          <div className="flex gap-3">
            <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full w-24" />
            <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full w-20" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-40" />
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-950/50 p-2 space-y-2">
          <div className="h-12 bg-zinc-200/80 dark:bg-zinc-900 rounded-lg w-full" />
          <div className="h-12 bg-zinc-200/80 dark:bg-zinc-900 rounded-lg w-full" />
          <div className="h-12 bg-zinc-200/80 dark:bg-zinc-900 rounded-lg w-full" />
        </div>
      </div>
    </div>
  );
}
