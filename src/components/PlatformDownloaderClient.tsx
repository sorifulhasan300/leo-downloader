"use client";

import React, { useState } from "react";
import UrlForm from "@/components/UrlForm";
import VideoResult from "@/components/VideoResult";

interface FAQItem {
  question: string;
  answer: string;
}

interface FeatureItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface StepItem {
  step: string;
  title: string;
  description: string;
}

interface PlatformDownloaderClientProps {
  platformName: string;
  placeholder: string;
  title: string;
  subtitle: string;
  howToSteps: StepItem[];
  features: FeatureItem[];
  faqs: FAQItem[];
}

export default function PlatformDownloaderClient({
  platformName,
  placeholder,
  title,
  subtitle,
  howToSteps,
  features,
  faqs,
}: PlatformDownloaderClientProps) {
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse video metadata.");
      }

      setMetadata(data.metadata);
      setFormats(data.formats || []);
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
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 md:py-16 flex flex-col gap-12 md:gap-16">
      
      {/* Hero Header */}
      <section className="relative text-center max-w-3xl mx-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] bg-gradient-to-tr from-indigo-600/10 to-violet-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          {title}{" "}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Without Limits
          </span>
        </h1>
        <p className="mt-5 text-sm sm:text-base md:text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto">
          {subtitle}
        </p>
      </section>

      {/* Downloader Form */}
      <section className="w-full max-w-3xl mx-auto">
        <UrlForm
          onSubmit={handleExtract}
          isLoading={isLoading}
          error={error}
          onClear={handleClear}
          placeholder={placeholder}
          autoFocus={true}
        />
      </section>

      {/* Extraction Results */}
      {(metadata || isLoading) && (
        <section className="w-full max-w-3xl mx-auto">
          <VideoResult
            metadata={metadata}
            formats={formats}
            isLoading={isLoading}
          />
        </section>
      )}

      {/* How to Download Steps */}
      <section className="w-full pt-8 border-t border-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            How to Download {platformName} Videos
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Follow these three simple steps to download media on your phone, tablet, or desktop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {howToSteps.map((step, idx) => (
            <div
              key={idx}
              className="relative p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/60 flex flex-col gap-3 hover:border-zinc-700/60 transition-all duration-300 group"
            >
              <div className="absolute top-4 right-4 text-3xl font-extrabold text-zinc-800/50 group-hover:text-violet-500/10 transition-colors">
                {step.step}
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
                {idx + 1}
              </div>
              <h3 className="font-bold text-lg text-zinc-100 mt-2">{step.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Features List */}
      <section className="w-full pt-8 border-t border-zinc-900">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Key Features of our {platformName} Downloader
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Why LeoDownloader is the best choice for saving your favorite online content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 flex flex-col gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                {feature.icon}
              </div>
              <h3 className="font-bold text-base text-zinc-100">{feature.title}</h3>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="w-full pt-8 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-500">
              Find answers to the most common questions regarding {platformName} downloading.
            </p>
          </div>

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
