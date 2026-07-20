"use client";

import React from "react";
import AdBanner from "./AdBanner";


interface VideoMetadata {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  description?: string;
  uploader?: string;
  webpageUrl?: string;
}

interface FormatOption {
  formatId: string;
  quality: string;
  ext: string;
  filesize: number | null;
  url: string;
  fps: number | null;
  hasAudio: boolean;
  hasVideo: boolean;
  width: number | null;
  height: number | null;
}

interface VideoResultProps {
  metadata: VideoMetadata | null;
  formats: FormatOption[];
  isLoading: boolean;
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return "--";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return "--:--";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function VideoResult({ metadata, formats, isLoading }: VideoResultProps) {
  if (isLoading) {
    return <VideoResultSkeleton />;
  }

  if (!metadata) {
    return null;
  }

  // Filter formats for a cleaner look.
  // Sometimes yt-dlp extracts hundreds of duplicate formats.
  // We can group them or show unique combinations of resolution, extension and hasAudio.
  const seenFormats = new Set<string>();
  const uniqueFormats = formats.filter((f) => {
    // Generate a unique key for grouping
    // If it's MP3 or audio, group by ext and hasVideo
    // If it's video, group by height/resolution, ext, hasAudio, and hasVideo
    const key = f.hasVideo
      ? `${f.height}p-${f.ext}-${f.hasAudio ? "muxed" : "video-only"}`
      : `audio-${f.ext}`;
    
    if (seenFormats.has(key)) {
      return false;
    }
    seenFormats.add(key);
    return true;
  });

  return (
    <div className="w-full bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 md:p-6 shadow-2xl animate-fadeIn">
      {/* Video Details Card */}
      <div className="flex flex-col md:flex-row gap-5 pb-6 border-b border-zinc-800/60">
        {/* Thumbnail Wrapper */}
        <div className="relative group shrink-0 w-full md:w-64 aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-md">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
          )}
          {/* Duration Badge */}
          <div className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded bg-black/80 text-white font-mono text-xs font-semibold tracking-wide border border-white/10 shadow-lg">
            {formatDuration(metadata.duration)}
          </div>
        </div>

        {/* Video Text Metadata */}
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white leading-snug line-clamp-2 hover:line-clamp-none transition-all duration-300">
              {metadata.title}
            </h2>
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs md:text-sm text-zinc-400">
              {metadata.uploader && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/30 text-zinc-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-zinc-500">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" />
                  </svg>
                  {metadata.uploader}
                </span>
              )}
              {metadata.webpageUrl && (
                <a
                  href={metadata.webpageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>Source Page</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6a.75.75 0 0 0-1.5 0v6a.75.75 0 0 0 1.5 0V6ZM2.25 12c0 5.385 4.365 9.75 9.75 9.75s9.75-4.365 9.75-9.75S17.385 2.25 12 2.25 2.25 12.03 2.25 12Z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs text-zinc-500 leading-relaxed max-w-2xl line-clamp-2">
            {metadata.description || "No description provided."}
          </p>
        </div>
      </div>

      {/* Download Options Section */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-indigo-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Available Download Links
        </h3>

        {/* Quality Options Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/30 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="px-4 py-3">Quality / Format</th>
                <th className="px-4 py-3">File Size</th>
                <th className="px-4 py-3">Extension</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-sm">
              {uniqueFormats.map((format) => {
                const downloadUrl = `/api/download?url=${encodeURIComponent(format.url)}&title=${encodeURIComponent(metadata.title + "." + format.ext)}`;
                
                // Determine format badges
                let isHd = false;
                let badgeLabel = "";
                let badgeClass = "";

                if (!format.hasVideo) {
                  badgeLabel = format.quality.includes("MP3") ? "MP3" : "Audio";
                  badgeClass = format.quality.includes("MP3") 
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                } else {
                  isHd = (format.height || 0) >= 720;
                  if (isHd) {
                    badgeLabel = (format.height || 0) >= 1080 ? "1080p Full HD" : "720p HD";
                    badgeClass = "bg-purple-500/10 text-purple-400 border-purple-500/20 font-semibold";
                  } else {
                    badgeLabel = `${format.height ? format.height + "p" : "SD"}`;
                    badgeClass = "bg-zinc-800 text-zinc-400 border-zinc-700/50";
                  }
                }

                return (
                  <tr key={format.formatId} className="hover:bg-zinc-900/30 transition-colors group">
                    <td className="px-4 py-3.5 flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      {format.hasVideo && !format.hasAudio && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20" title="This format does not contain audio">
                          Muted
                        </span>
                      )}
                      {format.fps && format.hasVideo && (
                        <span className="text-zinc-500 text-xs">
                          {format.fps} fps
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-300 font-mono text-xs">
                      {formatBytes(format.filesize)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 font-mono text-xs uppercase border border-zinc-700/30">
                        {format.ext}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* Direct Stream Copy */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(format.url);
                            alert("Direct streaming link copied to clipboard!");
                          }}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                          title="Copy direct stream link"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z" />
                          </svg>
                        </button>

                        {/* Download Trigger */}
                        <a
                          href={downloadUrl}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all"
                        >
                          <span>Download</span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* High-CPM Ad Placement below Download Quality options */}
        <div className="mt-6 pt-5 border-t border-zinc-800/50">
          <AdBanner placement="below-table" format="responsive" />
        </div>
      </div>
    </div>
  );
}

function VideoResultSkeleton() {
  return (
    <div className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 md:p-6 shadow-2xl animate-pulse">
      {/* Video Details Card Skeleton */}
      <div className="flex flex-col md:flex-row gap-5 pb-6 border-b border-zinc-800/60">
        <div className="w-full md:w-64 aspect-video rounded-xl bg-zinc-800 shrink-0"></div>
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="h-6 bg-zinc-800 rounded-md w-3/4"></div>
            <div className="h-4 bg-zinc-800 rounded-md w-1/3 mt-3"></div>
          </div>
          <div className="h-10 bg-zinc-800 rounded-md w-full mt-4"></div>
        </div>
      </div>

      {/* Download Options Table Skeleton */}
      <div className="mt-6">
        <div className="h-4 bg-zinc-800 rounded-md w-48 mb-4"></div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-1">
          <div className="h-10 bg-zinc-900/50 rounded-lg w-full mb-1"></div>
          <div className="h-12 bg-zinc-900/20 rounded-lg w-full mb-1"></div>
          <div className="h-12 bg-zinc-900/20 rounded-lg w-full mb-1"></div>
          <div className="h-12 bg-zinc-900/20 rounded-lg w-full"></div>
        </div>
      </div>
    </div>
  );
}
