import type { Metadata, Viewport } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
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
  description:
    "Free online video downloader to download Facebook videos, Instagram Reels & Stories, TikTok videos without watermark, YouTube videos, and content from 1000+ other platforms in high quality MP4 or MP3 formats.",
  keywords: [
    "video downloader",
    "facebook video downloader",
    "instagram reel downloader",
    "tiktok downloader without watermark",
    "youtube video downloader",
    "download video mp4",
    "convert video to mp3",
    "free online video downloader",
    "social media downloader",
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
    description:
      "Free online video downloader for Facebook, Instagram Reels, TikTok without watermark, YouTube, Twitter/X, and 1000+ platforms.",
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
    description:
      "Free online video downloader for Facebook, Instagram Reels, TikTok without watermark, YouTube, Twitter/X, and 1000+ platforms.",
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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <FirebaseAnalytics />
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
          {/* Interstitial / Popunder script initialization placeholder */}
          <Script
            id="popunder-ad-network"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                console.log("LeoDownloader: Interstitial/Popunder script initialized.");
              `,
            }}
          />

          {/* Header Bar */}
          <header className="w-full border-b border-zinc-200/80 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
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
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
                  Leo<span className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">Downloader</span>
                </span>
              </a>

              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold tracking-wider flex items-center gap-1.5 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  API v1.0
                </span>

                {/* Theme Switcher Button */}
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 w-full flex flex-col">{children}</main>

          {/* Footer Section */}
          <footer className="w-full bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900/80 py-8 text-center text-xs text-zinc-500 dark:text-zinc-600 transition-colors duration-300">
            <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-zinc-700 dark:text-zinc-400">LeoDownloader</span>
                <span>&copy; {currentYear} - All rights reserved.</span>
              </div>
              <div className="max-w-md text-center sm:text-right leading-normal">
                <p>Disclaimer: Please use this tool responsibly and respect copyrights. We do not host or archive media files.</p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
