import React from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface JsonLdProps {
  name: string;
  description: string;
  url: string;
  faqs?: FAQItem[];
}

export default function JsonLd({ name, description, url, faqs = [] }: JsonLdProps) {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": name,
    "description": description,
    "operatingSystem": "All",
    "applicationCategory": "MultimediaApplication",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "url": url,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
  };

  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map((faq) => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
}
