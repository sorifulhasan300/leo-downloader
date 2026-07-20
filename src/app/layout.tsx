import type { Metadata, Viewport } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://leodownloader.com"),
  title: {
    default: "LeoDownloader | Fast Social Video Downloader",
    template: "%s | LeoDownloader",
  },
  description: "Free online video downloader to download Facebook videos, Instagram Reels & Stories, TikTok videos without watermark, YouTube videos, and content from 1000+ other platforms in high quality MP4 or MP3 formats.",
  keywords: [
    "video downloader",
    "facebook video downloader",
    "instagram reel downloader",
    "tiktok downloader without watermark",
    "youtube video downloader",
    "download video mp4",
    "convert video to mp3",
    "free online video downloader",
    "social media downloader"
  ],
  alternates: {
    canonical: "./",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://leodownloader.com",
    title: "LeoDownloader | Fast Social Video Downloader",
    description: "Free online video downloader for Facebook, Instagram Reels, TikTok without watermark, YouTube, Twitter/X, and 1000+ platforms.",
    siteName: "LeoDownloader",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LeoDownloader - Social Video Downloader",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LeoDownloader | Fast Social Video Downloader",
    description: "Free online video downloader for Facebook, Instagram Reels, TikTok without watermark, YouTube, Twitter/X, and 1000+ platforms.",
    images: ["/og-image.png"],
    creator: "@leodownloader",
  },
  verification: {
    google: "Zx5MEpo2nQ-1gjlyarInKBY9xgkVJrg8qFqe0hdgtcw",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-white font-sans selection:bg-indigo-600 selection:text-white">
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
        {/* Interstitial / Popunder script initialization placeholder */}
        {/* Replace with actual script URL or container element configuration from Monetag, PropellerAds or AdSense */}
        <Script
          id="popunder-ad-network"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              // Example configuration for Popunder / Interstitial ads (e.g. PropellerAds / Monetag)
              // (function(s,u,z,p){s.src=u,s.setAttribute('data-zone',z),p.appendChild(s);})(document.createElement('script'),'https://iclickcdn.com/tag.min.js',1234567,document.body||document.documentElement);
              console.log("LeoDownloader: Interstitial/Popunder script initialized.");
            `,
          }}
        />

        {/* Header Bar */}
        <header className="w-full border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Leo<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Downloader</span>
              </span>
            </a>

            <div className="flex items-center gap-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                API v1.0
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>

        {/* Footer Section */}
        <footer className="w-full bg-zinc-950 border-t border-zinc-900/80 py-8 text-center text-xs text-zinc-600">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-zinc-400">LeoDownloader</span>
              <span>&copy; {currentYear} - All rights reserved.</span>
            </div>
            <div className="max-w-md text-center sm:text-right leading-normal">
              <p>Disclaimer: Please use this tool responsibly and respect copyrights. We do not host or archive media files.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

