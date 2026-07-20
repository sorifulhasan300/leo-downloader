import React from "react";
import { Metadata } from "next";
import PlatformDownloaderClient from "@/components/PlatformDownloaderClient";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Facebook Video Downloader | Download FB Videos in HD",
  description: "Free online Facebook video downloader. Save FB videos, Reels, and stories in high-definition (HD) MP4 format, or convert to MP3 audio instantly.",
  keywords: [
    "facebook video downloader",
    "download facebook video",
    "fb downloader",
    "save facebook reels",
    "facebook video download mp4",
    "download fb videos online",
  ],
  alternates: {
    canonical: "/facebook-video-downloader",
  },
};

const pageUrl = "https://leodownloader.com/facebook-video-downloader";
const platformName = "Facebook";

const howToSteps = [
  {
    step: "01",
    title: "Copy Video URL",
    description: "Open Facebook on your device, locate the video or Reel you want to save, click 'Share' and then click 'Copy Link'.",
  },
  {
    step: "02",
    title: "Paste in Input",
    description: "Navigate to LeoDownloader's Facebook Downloader, paste the copied link into the input field above, and click 'Download Now'.",
  },
  {
    step: "03",
    title: "Select Resolution & Save",
    description: "Choose your preferred video quality (e.g., 1080p HD, 720p) or MP3 audio from the extracted formats list and click to download.",
  },
];

const features = [
  {
    title: "HD Video Downloads",
    description: "Save Facebook videos in full resolution, including 1080p, 720p, and standard definition formats based on original source.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    title: "No Signups Required",
    description: "No account registration, login credentials, or browser extensions needed. Use the web tool completely anonymously.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    title: "Audio (MP3) Conversion",
    description: "Extract soundtrack or background music from any Facebook video and download it as high-bitrate MP3 audio.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 0v11.25m0-11.25L9 9m0 0v11.25m0-11.25L3 12m0 0v6.75m0-6.75l6-3" />
      </svg>
    ),
  },
];

const faqs = [
  {
    question: "How do I find a Facebook video link?",
    answer: "On the Facebook mobile app, tap the 'Share' button beneath the video, then tap 'Copy Link'. In a desktop browser, click the three dots in the top right corner of the video post, select 'Copy link', or copy the URL directly from the address bar.",
  },
  {
    question: "Can I download private Facebook videos?",
    answer: "Currently, our server processes publicly available Facebook videos and Reels. Private Facebook videos uploaded to closed groups or with custom privacy settings require user credentials to access, which our tool does not collect for security reasons.",
  },
  {
    question: "Does LeoDownloader store downloaded videos?",
    answer: "No. LeoDownloader does not save or archive any files on our servers. All videos are fetched dynamically from the source platform and directly piped to your browser via our streaming server proxy to protect user privacy.",
  },
  {
    question: "Is there a limit on how many FB videos I can download?",
    answer: "There are no caps on total daily downloads! You can download as many Facebook videos, Reels, or stories as you want, provided you stay within our standard server protection rate limits (30 actions per minute).",
  },
];

export default function FacebookDownloaderPage() {
  return (
    <>
      <JsonLd
        name="LeoDownloader - Facebook Video Downloader"
        description="Free online Facebook video downloader to download FB videos, Reels, and stories in high-definition (HD) MP4 format, or convert to MP3 audio."
        url={pageUrl}
        faqs={faqs}
      />
      <PlatformDownloaderClient
        platformName={platformName}
        placeholder="Paste Facebook video or Reel link here (e.g. https://www.facebook.com/...)"
        title="Facebook Video Downloader"
        subtitle="Fast, free, and secure online Facebook video downloader. Save FB videos and Reels directly to your device without watermark."
        howToSteps={howToSteps}
        features={features}
        faqs={faqs}
      />
    </>
  );
}
