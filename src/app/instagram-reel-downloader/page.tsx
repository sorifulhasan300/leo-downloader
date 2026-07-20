import React from "react";
import { Metadata } from "next";
import PlatformDownloaderClient from "@/components/PlatformDownloaderClient";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Instagram Reel Downloader | Download IG Reels & Videos",
  description: "Free online Instagram Reel downloader. Download Instagram Reels, videos, posts, and stories in high-quality MP4 formats with no watermark.",
  keywords: [
    "instagram reel downloader",
    "download instagram reel",
    "ig reels download",
    "instagram video downloader",
    "save instagram stories",
    "instagram post downloader",
  ],
  alternates: {
    canonical: "/instagram-reel-downloader",
  },
};

const pageUrl = "https://leodownloader.com/instagram-reel-downloader";
const platformName = "Instagram";

const howToSteps = [
  {
    step: "01",
    title: "Copy Reel URL",
    description: "Launch Instagram, navigate to the Reel or video you wish to download, tap the Share icon (paper airplane), and choose 'Copy Link'.",
  },
  {
    step: "02",
    title: "Paste the URL",
    description: "Open LeoDownloader's Instagram Reel Downloader page, paste the link in the input box above, and press 'Download Now'.",
  },
  {
    step: "03",
    title: "Download File",
    description: "Review the dynamic download options, select your desired resolution or MP3 quality, and click download to save.",
  },
];

const features = [
  {
    title: "Watermark Free",
    description: "Download original source videos without adding any extra watermarks or stamps, giving you clean content for offline viewing.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
  },
  {
    title: "Compatibility & Speed",
    description: "Optimized server engine processes URLs instantly, offering downloads compatible with Android, iOS, Windows, and macOS.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: "Multi-type Downloads",
    description: "In addition to Reels, download standard videos, single photos, carousel posts, and public story highlights with ease.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316A2.192 2.192 0 0 0 14.502 4h-5c-.65 0-1.263.362-1.58.94l-.822 1.316Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
];

const faqs = [
  {
    question: "How do I download an Instagram Reel on mobile?",
    answer: "Open Instagram and find the Reel. Tap the Share button (paper airplane) at the bottom-right, then select 'Copy Link'. Open LeoDownloader in your mobile browser, paste the link, and choose your download option.",
  },
  {
    question: "Do I need to log in to my Instagram account?",
    answer: "No. LeoDownloader does not require you to log in, share your credentials, or authorize any apps. Simply copy the public link and download.",
  },
  {
    question: "Are there limitations on downloading IG Reels?",
    answer: "You can download unlimited public Reels and posts. We support downloads for all resolutions offered by the platform.",
  },
  {
    question: "Why does my Instagram download display as a blank page?",
    answer: "Sometimes Instagram blocks automated direct links. If this occurs, our dynamic proxy system will process the video and serve it securely via `/api/download` which forces a direct download.",
  },
];

export default function InstagramDownloaderPage() {
  return (
    <>
      <JsonLd
        name="LeoDownloader - Instagram Reel Downloader"
        description="Free online Instagram Reel downloader to download IG Reels, videos, posts, and stories in high-quality MP4 format with no watermark."
        url={pageUrl}
        faqs={faqs}
      />
      <PlatformDownloaderClient
        platformName={platformName}
        placeholder="Paste Instagram Reel or Video URL here (e.g. https://www.instagram.com/reel/...)"
        title="Instagram Reel Downloader"
        subtitle="Download Instagram Reels, IGTV videos, and posts in HD quality instantly. Free tool, no login needed."
        howToSteps={howToSteps}
        features={features}
        faqs={faqs}
      />
    </>
  );
}
