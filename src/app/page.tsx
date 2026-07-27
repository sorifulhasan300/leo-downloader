"use client";

import React, { useState } from "react";
import UrlForm from "@/components/UrlForm";
import VideoResult from "@/components/VideoResult";
import AdBanner from "@/components/AdBanner";


interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What platforms are supported by LeoDownloader?",
    answer: "LeoDownloader is powered by an advanced yt-dlp backend, which means it supports over 1000+ popular platforms out of the box, including YouTube, TikTok, Instagram (Reels & Posts), Twitter/X, Facebook, Twitch, Vimeo, and SoundCloud.",
  },
  {
    question: "How do I download high-definition (HD) 1080p or 4K videos?",
    answer: "Our parser automatically extracts all available formats from the remote platform. The options table categorizes and badges HD options (720p, 1080p, and above). Click the download button for your preferred resolution, and our server proxy will stream it directly to your device.",
  },
  {
    question: "Can I download only the audio or convert videos to MP3?",
    answer: "Yes, absolutely! The engine extracts audio tracks and generates a custom high-quality Audio (MP3) format option dynamically. Look for the 'Audio' or 'MP3' badged options in the available download formats list.",
  },
  {
    question: "Why do some videos open in a new tab instead of downloading?",
    answer: "Direct remote links sometimes trigger the browser's default media player instead of a download due to CORS or Content-Type headers. To prevent this, our system routes downloads through our high-performance stream proxy (`/api/download`), which forces a standard attachment download to save the file locally.",
  },
  {
    question: "Are there any limitations or download limits?",
    answer: "There are no download limits for standard personal use! However, to ensure server stability and prevent abuse, we enforce a standard rate limit of 30 extractions per minute per IP address.",
  },
  {
    question: "Is it legal to use LeoDownloader?",
    answer: "LeoDownloader is intended for personal use and for downloading content that you own, copyright-free content, or content under creative commons licenses. We do not host any copyrighted files on our servers, and users are responsible for complying with the terms of service of respective source platforms.",
  },
];

export default function Home() {
  const [metadata, setMetadata] = useState<any>(null);
  const [formats, setFormats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleExtract = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setMetadata(null);
    setFormats([]);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to parse video metadata.");
      }

      const videoData = {
        title: data.data?.title || data.title || "Social Video",
        author: data.data?.author || data.author || "",
        thumbnail: data.data?.thumbnail || data.thumbnail || "",
        source: data.data?.source || data.source || url,
        duration: data.data?.duration || data.duration || 0,
        medias: data.data?.medias || data.medias || data.formats || [],
      };

      setMetadata(videoData);
      setFormats(videoData.medias);
    } catch (err: any) {
      setError(err.message || "An unexpected network or server error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMetadata(null);
    setFormats([]);
    setError(null);
    setIsLoading(false);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 md:py-16 flex flex-col gap-10 md:gap-14">
      {/* Hero Section */}
      <section className="relative text-center max-w-3xl mx-auto">
        {/* Subtle light effect behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] bg-gradient-to-tr from-violet-600/10 to-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <h1 className="text-2xl sm:text-5xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">
          Download Video & Audio{" "}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            From Any Site
          </span>
        </h1>
       
      </section>

      {/* Input Form Section */}
      <section className="w-full max-w-3xl mx-auto">
        <UrlForm
          onSubmit={handleExtract}
          isLoading={isLoading}
          error={error}
          onClear={handleClear}
        />
      </section>

      {/* Results Section */}
      {(metadata || isLoading) && (
        <section className="w-full max-w-3xl mx-auto">
          <VideoResult
            metadata={metadata}
            formats={formats}
            isLoading={isLoading}
          />
        </section>
      )}

      {/* Features Pitch Section */}
      <section className="w-full pt-6 border-t border-zinc-900">
        <h2 className="text-xl md:text-2xl font-extrabold text-center text-white mb-8">
          Why choose LeoDownloader?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h3 className="font-bold text-base text-zinc-100">Super Fast Extraction</h3>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
              Our server processes links in milliseconds using the power of optimized yt-dlp nodes, delivering real-time streaming link results.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="font-bold text-base text-zinc-100">Secure Direct Downloads</h3>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
              Downloads are proxied through standard secure headers to ensure browser compatibility, preventing random redirection or empty pages.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </div>
            <h3 className="font-bold text-base text-zinc-100">Audio Conversion</h3>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
              Convert any supported video into a standard MP3 audio file. Ideal for offline music playback, podcasts, and sound effects.
            </p>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="w-full pt-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl md:text-2xl font-extrabold text-center text-white mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-xs md:text-sm text-zinc-500 text-center mb-8">
            Everything you need to know about extracting video and audio content.
          </p>

          <div className="flex flex-col gap-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800/20 transition-colors"
                  >
                    <span className="text-sm md:text-base">{faq.question}</span>
                    <span className="text-zinc-500 shrink-0">
                      {isOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs md:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/40 pt-3 animate-slideDown">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
