"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";

interface AdBannerProps {
  placement: "top" | "below-table" | "sidebar";
  format?: "728x90" | "300x250" | "responsive";
  adClient?: string; // e.g. ca-pub-xxxxxxxxxxxxxxxx for Google AdSense
  adSlot?: string;   // e.g. xxxxxxxxxx for Google AdSense
  zoneId?: string;   // e.g. 1234567 for Monetag / PropellerAds
}

export default function AdBanner({
  placement,
  format = "responsive",
  adClient,
  adSlot,
  zoneId,
}: AdBannerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const checkAdBlocker = async () => {
      // Create a dummy element with standard ad-related class names
      const testAd = document.createElement("div");
      testAd.innerHTML = "&nbsp;";
      // These classes are highly targeted by AdBlock lists (EasyList, etc.)
      testAd.className =
        "adsbygoogle ad-zone ad-banner pub_300x250 pub_728x90 text-ad ad-placement ad-wrapper textAd";
      testAd.style.position = "absolute";
      testAd.style.left = "-9999px";
      testAd.style.top = "-9999px";
      testAd.style.width = "1px";
      testAd.style.height = "1px";

      try {
        document.body.appendChild(testAd);

        // Wait a short moment to let content blockers intercept/hide the element
        await new Promise((resolve) => setTimeout(resolve, 150));

        const isHidden =
          testAd.offsetHeight === 0 ||
          testAd.clientHeight === 0 ||
          window.getComputedStyle(testAd).display === "none" ||
          window.getComputedStyle(testAd).visibility === "hidden";

        document.body.removeChild(testAd);

        if (isHidden) {
          setIsBlocked(true);
          return;
        }

        // Secondary check: Attempt to fetch a common ad script URL (will fail if network-level blocker is active)
        const response = await fetch(
          "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
          { method: "HEAD", mode: "no-cors", cache: "no-store" }
        );
        setIsBlocked(false);
      } catch (err) {
        setIsBlocked(true);
      }
    };

    checkAdBlocker();
  }, []);

  // Hydration safety: render a matching placeholder structure on server and initial load
  if (!isMounted) {
    return (
      <div
        className={`w-full flex items-center justify-center bg-zinc-950/20 border border-zinc-800/40 rounded-2xl animate-pulse ${
          format === "728x90" ? "min-h-[90px]" : "min-h-[250px]"
        }`}
      >
        <span className="text-xs text-zinc-600">Loading ad space...</span>
      </div>
    );
  }

  // Fallback view when uBlock or another AdBlocker is active
  if (isBlocked) {
    return (
      <div className="w-full relative group overflow-hidden bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border border-red-500/20 rounded-2xl p-6 md:p-8 text-center shadow-2xl transition duration-500 hover:border-red-500/30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[150px] bg-red-500/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left max-w-xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-zinc-200 text-sm md:text-base">
                Ad Blocker Detected
              </h4>
              <p className="text-xs md:text-sm text-zinc-400 mt-1 leading-relaxed">
                We keep LeoDownloader free by showing lightweight, safe ads. Please
                consider whitelisting us to support our free platform.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all"
            >
              I've disabled it
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If Ads are NOT blocked, render the third-party script or a highly polished placeholder promo ad
  const hasConfig = adClient || zoneId;

  return (
    <div className="w-full flex justify-center items-center">
      {/* 1. If we have Google AdSense config */}
      {adClient && adSlot && (
        <div className="w-full overflow-hidden flex justify-center">
          <ins
            className="adsbygoogle"
            style={{
              display: "block",
              width: format === "728x90" ? "728px" : format === "300x250" ? "300px" : "100%",
              height: format === "728x90" ? "90px" : format === "300x250" ? "250px" : "auto",
            }}
            data-ad-client={adClient}
            data-ad-slot={adSlot}
            data-full-width-responsive="true"
          />
          <Script
            id={`adsense-init-${adSlot}`}
            strategy="afterInteractive"
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
            onLoad={() => {
              try {
                // @ts-ignore
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                setAdLoaded(true);
              } catch (e) {
                console.error("AdSense initialization failed", e);
              }
            }}
          />
        </div>
      )}

      {/* 2. If we have Monetag / PropellerAds Banner / Native Direct Ads config */}
      {zoneId && !adClient && (
        <div className="w-full flex justify-center">
          <div id={`monetag-container-${zoneId}`} className="w-full flex justify-center" />
          <Script
            id={`monetag-script-${zoneId}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(s,u,z,p){
                  s.src=u,s.setAttribute('data-zone',z),p.appendChild(s);
                })(document.createElement('script'),'https://iclickcdn.com/tag.min.js',${zoneId},document.getElementById('monetag-container-${zoneId}') || document.body);
              `,
            }}
          />
        </div>
      )}

      {/* 3. Simulated/Mock Ad Banner for local/demo/fallback when no third-party keys are explicitly configured */}
      {!hasConfig && (
        <div className="w-full">
          {format === "728x90" ? (
            /* Mock 728x90 Horizontal Desktop Banner */
            <div className="w-full min-h-[90px] relative group overflow-hidden bg-gradient-to-r from-violet-600/5 via-indigo-600/5 to-cyan-500/5 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-lg transition-all duration-300 hover:border-zinc-700/80">
              <div className="absolute top-0 right-0 px-2 py-0.5 rounded-bl bg-zinc-900 border-l border-b border-zinc-800 text-[9px] uppercase tracking-wider text-zinc-500 font-semibold font-sans">
                Sponsored Ad
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <h5 className="font-bold text-zinc-200 text-sm">
                    LeoConvert - Convert Media Faster
                  </h5>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Convert any downloaded video to MP4, AVI, WEBM, or MP3 with high-bitrate conversion options.
                  </p>
                </div>
              </div>
              <a
                href="#convert"
                onClick={(e) => {
                  e.preventDefault();
                  alert("LeoConvert coming soon!");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all shrink-0"
              >
                Learn More
              </a>
            </div>
          ) : (
            /* Mock Responsive Box/CPM Sponsored Banner */
            <div className="w-full relative group overflow-hidden bg-gradient-to-br from-zinc-900/60 to-zinc-950/70 border border-zinc-800 rounded-2xl p-6 text-center shadow-lg transition-all duration-300 hover:border-zinc-700/80">
              <div className="absolute top-0 right-0 px-2 py-0.5 rounded-bl bg-zinc-900 border-l border-b border-zinc-800 text-[9px] uppercase tracking-wider text-zinc-500 font-semibold font-sans">
                Sponsored Ad
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[120px] bg-indigo-600/5 rounded-full blur-[60px] pointer-events-none"></div>

              <div className="relative flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  </svg>
                </div>
                <h5 className="font-extrabold text-white text-base">
                  LeoDownloader Fast Server
                </h5>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                  High-speed streaming downloader engine. Save HD videos, Reels, and audio directly to your device with zero limits.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
