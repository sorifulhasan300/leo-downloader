import React from "react";
import { Metadata } from "next";
import PlatformDownloaderClient from "@/components/PlatformDownloaderClient";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "TikTok Video Downloader | Download TikTok Without Watermark",
  description: "Free online TikTok video downloader. Download TikTok videos without watermark in high-definition (HD) MP4 format, or convert to MP3 audio instantly.",
  keywords: [
    "tiktok video downloader",
    "download tiktok without watermark",
    "tiktok mp3 downloader",
    "save tiktok video",
    "no watermark tiktok download",
    "tiktok sound downloader",
  ],
  alternates: {
    canonical: "/tiktok-video-downloader",
  },
};

const pageUrl = "https://leodownloader.com/tiktok-video-downloader";
const platformName = "TikTok";

const howToSteps = [
  {
    step: "01",
    title: "Copy TikTok Link",
    description: "Open the TikTok app or website, find the video you wish to download, tap the Share icon, and select 'Copy Link'.",
  },
  {
    step: "02",
    title: "Paste URL",
    description: "Navigate to LeoDownloader's TikTok Downloader, paste the copied link in the form above, and click 'Download Now'.",
  },
  {
    step: "03",
    title: "Save Without Watermark",
    description: "Select the 'No Watermark' video format or MP3 audio option from the results page and download it directly.",
  },
];

const features = [
  {
    title: "Remove TikTok Watermark",
    description: "Get clean, watermark-free videos ready for sharing or repurposing across other platforms like YouTube Shorts or Reels.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "TikTok MP3 Downloader",
    description: "Love a viral TikTok sound? Extract the audio track instantly and download it as high-quality MP3 file.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
  {
    title: "Super-Fast and Free",
    description: "No subscription fees or software downloads. Save TikTok videos in milliseconds directly through our web interface.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const faqs = [
  {
    question: "Do I have to pay to remove the TikTok watermark?",
    answer: "No. Our TikTok video downloader is completely free. We do not require any payments or subscriptions to download watermark-free MP4s.",
  },
  {
    question: "Can I download TikTok videos on iPhone/iPad?",
    answer: "Yes. Simply copy the link, open Safari or Chrome on iOS, navigate to LeoDownloader, paste the URL and download. Apple users can save it directly to their Photos app.",
  },
  {
    question: "Does this downloader work on TikTok slideshows?",
    answer: "Yes! LeoDownloader can extract individual photos from TikTok photo slide posts, as well as render the dynamic video slide formats for download.",
  },
  {
    question: "Is it legal to download TikTok videos?",
    answer: "LeoDownloader is built for personal and educational use. We recommend asking the creator for permission if you intend to reuse their content.",
  },
];

export default function TikTokDownloaderPage() {
  return (
    <>
      <JsonLd
        name="LeoDownloader - TikTok Video Downloader"
        description="Free online TikTok video downloader to download TikTok videos without watermark in high-definition (HD) MP4 format, or convert to MP3 audio."
        url={pageUrl}
        faqs={faqs}
      />
      <PlatformDownloaderClient
        platformName={platformName}
        placeholder="Paste TikTok video link here (e.g. https://www.tiktok.com/@user/video/...)"
        title="TikTok Video Downloader"
        subtitle="Download TikTok videos without watermark in premium quality. Save original audio as MP3 instantly."
        howToSteps={howToSteps}
        features={features}
        faqs={faqs}
      />
    </>
  );
}
