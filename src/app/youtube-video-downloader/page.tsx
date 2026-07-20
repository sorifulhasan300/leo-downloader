import React from "react";
import { Metadata } from "next";
import PlatformDownloaderClient from "@/components/PlatformDownloaderClient";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "YouTube Video Downloader | Download YT Videos in HD",
  description: "Free online YouTube video downloader. Download YouTube videos, Shorts, and convert to MP3 audio in premium high-quality formats.",
  keywords: [
    "youtube video downloader",
    "download youtube video",
    "convert youtube to mp3",
    "download youtube shorts",
    "yt video downloader",
    "save youtube videos online",
  ],
  alternates: {
    canonical: "/youtube-video-downloader",
  },
};

const pageUrl = "https://leodownloader.com/youtube-video-downloader";
const platformName = "YouTube";

const howToSteps = [
  {
    step: "01",
    title: "Copy YouTube link",
    description: "Go to YouTube, find the video or Short, click 'Share' and choose 'Copy Link' (or copy the URL from browser's address bar).",
  },
  {
    step: "02",
    title: "Paste URL",
    description: "Open LeoDownloader's YouTube Downloader, paste the URL in the form field, and press the 'Download Now' button.",
  },
  {
    step: "03",
    title: "Choose Quality",
    description: "Pick a resolution option (like 1080p HD or 720p) or select the MP3 audio file option, then click to download.",
  },
];

const features = [
  {
    title: "Supports HD and 4K",
    description: "Save YouTube videos in whatever formats are made available by the platform, including 720p, 1080p, and higher resolutions.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a9.003 9.003 0 018.716 5.253M12 3a9.003 9.003 0 00-8.716 5.253" />
      </svg>
    ),
  },
  {
    title: "Convert to MP3",
    description: "Directly extract and convert YouTube videos to 128kbps/320kbps MP3 audio streams for offline music playing.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
  {
    title: "YouTube Shorts Support",
    description: "Fully compatible with Shorts URLs. Download viral YouTube Shorts videos without limit and free of charge.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12z" />
      </svg>
    ),
  },
];

const faqs = [
  {
    question: "How do I download a YouTube video to MP3?",
    answer: "Copy the YouTube video link and paste it into the downloader. In the download options list, locate the MP3 format option (normally marked as Audio or MP3) and click download to get the audio track.",
  },
  {
    question: "Do you support YouTube playlist downloads?",
    answer: "Currently, our video extractor is optimized for individual videos and Shorts to ensure server stability. Playlist support will be introduced in future updates.",
  },
  {
    question: "Why do some YouTube videos take longer to analyze?",
    answer: "High-resolution files (1080p, 4K) or long-duration videos contain extensive metadata tables. Processing them via our yt-dlp parser requires a few additional seconds to prepare all available streaming streams.",
  },
  {
    question: "Is there a download speed limit?",
    answer: "No, we do not throttle download speeds. You will download the media files at the maximum speed your internet provider can support.",
  },
];

export default function YouTubeDownloaderPage() {
  return (
    <>
      <JsonLd
        name="LeoDownloader - YouTube Video Downloader"
        description="Free online YouTube video downloader to download YouTube videos, Shorts, and convert to MP3 audio in premium high-quality formats."
        url={pageUrl}
        faqs={faqs}
      />
      <PlatformDownloaderClient
        platformName={platformName}
        placeholder="Paste YouTube Video or Shorts link here (e.g. https://www.youtube.com/watch?v=...)"
        title="YouTube Video Downloader"
        subtitle="Extract and download YouTube videos or convert them to high-fidelity MP3 audio files. Fast, unlimited, and free."
        howToSteps={howToSteps}
        features={features}
        faqs={faqs}
      />
    </>
  );
}
