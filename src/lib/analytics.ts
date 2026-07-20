import { sendGAEvent } from "@next/third-parties/google";

/**
 * Tracks custom events to Google Analytics 4 (GA4).
 * 
 * @param action - The GA4 event name (e.g., 'video_download_success', 'platform_select', 'error_encountered')
 * @param category - Optional categorization for the event (e.g., 'downloader', 'navigation')
 * @param label - Optional descriptor to capture more specific context
 * @param value - Optional numeric value associated with the event
 * @param params - Optional additional custom properties/parameters to send
 */
export function trackEvent(
  action: string,
  {
    category,
    label,
    value,
    ...params
  }: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  } = {}
) {
  // Use the official sendGAEvent helper from Next.js
  sendGAEvent("event", action, {
    event_category: category,
    event_label: label,
    value,
    ...params,
  });
}
