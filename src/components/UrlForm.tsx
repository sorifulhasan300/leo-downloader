"use client";

import React, { useState, useEffect, useRef } from "react";

interface UrlFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error: string | null;
  onClear: () => void;
}

export default function UrlForm({ onSubmit, isLoading, error, onClear }: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const [canPaste, setCanPaste] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if browser supports clipboard api readText
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.clipboard && typeof navigator.clipboard.readText === "function") {
      setCanPaste(true);
    }
  }, []);

  // Standard URL check regex
  const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i;

  // Platform detection regexes
  const platforms = [
    { name: "youtube", regex: /(youtube\.com|youtu\.be|youtube-nocookie\.com)/i, color: "text-red-500 bg-red-500/10 border-red-500/20" },
    { name: "tiktok", regex: /tiktok\.com/i, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
    { name: "instagram", regex: /instagram\.com/i, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
    { name: "twitter", regex: /(twitter\.com|x\.com)/i, color: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
    { name: "facebook", regex: /(facebook\.com|fb\.watch)/i, color: "text-blue-600 bg-blue-600/10 border-blue-600/20" },
    { name: "vimeo", regex: /vimeo\.com/i, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
    { name: "twitch", regex: /twitch\.tv/i, color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
  ];

  useEffect(() => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setIsValid(false);
      setDetectedPlatform(null);
      return;
    }

    const matchesUrl = urlRegex.test(trimmedUrl);
    setIsValid(matchesUrl);

    if (matchesUrl) {
      const match = platforms.find((p) => p.regex.test(trimmedUrl));
      setDetectedPlatform(match ? match.name : "other");
    } else {
      setDetectedPlatform(null);
    }
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isLoading) {
      onSubmit(url.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (err) {
      console.warn("Failed to read clipboard text", err);
    }
  };

  const handleClear = () => {
    setUrl("");
    onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Outer glowing border animation on focus */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 opacity-25 blur transition duration-1000 group-focus-within:opacity-50 group-hover:opacity-40 group-focus-within:duration-200"></div>

        <div className="relative flex flex-col md:flex-row gap-3 p-2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl">
          <div className="relative flex-1 flex items-center">
            {/* Link SVG Icon */}
            <div className="pl-4 text-zinc-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                />
              </svg>
            </div>

            {/* URL Input field */}
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste video or audio URL here (e.g. YouTube, TikTok...)"
              disabled={isLoading}
              className="w-full px-3 py-3.5 bg-transparent text-white placeholder-zinc-500 text-sm md:text-base border-none outline-none focus:ring-0 focus:outline-none disabled:opacity-50"
            />

            {/* Clear Button */}
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 mr-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
                title="Clear input"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Clipboard Paste Button */}
            {canPaste && !url && (
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 transition duration-200"
                title="Paste from clipboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0A2.25 2.25 0 0 1 13.5 5.25h-3a2.25 2.25 0 0 1-2.166-1.362m7.332 0c.055.194.084.4.084.612v1.5a.75.75 0 0 1-.75.75H8.25a.75.75 0 0 1-.75-.75V3.125c0-.212.03-.418.084-.612m1.104 2.188A9 9 0 1 1 8.25 18v-7.375c0-.621.504-1.125 1.125-1.125H18"
                  />
                </svg>
                <span>Paste</span>
              </button>
            )}
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm md:text-base tracking-wide transition-all duration-300 shadow-lg ${
              isValid && !isLoading
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white cursor-pointer active:scale-95 shadow-indigo-500/20"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/30"
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Download Now</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Validation status / Live support preview */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs px-2">
        {/* Dynamic Platform Notification */}
        <div>
          {url && !isValid && (
            <span className="text-red-400 flex items-center gap-1.5 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              Please enter a valid URL.
            </span>
          )}
          {url && isValid && detectedPlatform && (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {detectedPlatform === "other"
                ? "Valid link detected - ready to parse!"
                : `Detected ${detectedPlatform.charAt(0).toUpperCase() + detectedPlatform.slice(1)} Link! Ready to parse.`}
            </span>
          )}
        </div>

        {/* Supported Platforms Badges */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-medium">Supported:</span>
          <div className="flex gap-1.5">
            {platforms.slice(0, 5).map((p) => {
              const isActive = detectedPlatform === p.name;
              return (
                <span
                  key={p.name}
                  className={`px-2 py-0.5 rounded border capitalize transition-all duration-300 ${
                    isActive
                      ? p.color + " font-semibold scale-110 shadow-lg"
                      : "text-zinc-500 bg-zinc-900/30 border-zinc-800/40"
                  }`}
                >
                  {p.name}
                </span>
              );
            })}
            <span
              className={`px-2 py-0.5 rounded border transition-all duration-300 ${
                detectedPlatform === "other"
                  ? "text-purple-400 bg-purple-500/10 border-purple-500/20 font-semibold scale-110 shadow-lg"
                  : "text-zinc-500 bg-zinc-900/30 border-zinc-800/40"
              }`}
              title="Plus 1000+ other websites supported by yt-dlp"
            >
              1000+ others
            </span>
          </div>
        </div>
      </div>

      {/* Error Message display */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex gap-3 shadow-lg animate-fadeIn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <div>
            <h4 className="font-semibold text-red-300">Extraction Failed</h4>
            <p className="mt-1 text-red-400/90 leading-relaxed text-xs md:text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
