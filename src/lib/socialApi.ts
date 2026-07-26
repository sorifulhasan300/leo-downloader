/**
 * ZM API All-in-One Social Downloader Utility Helper
 * 
 * Provides type definitions and helper function for interacting with ZM API.
 */

/**
 * Media item returned by the ZM API.
 */
export interface Media {
  url: string;
  quality?: string;
  extension?: string;
  type?: string;
  width?: number;
  height?: number;
  data_size?: number;
}

/**
 * Engagement statistics for the requested media.
 */
export interface Statistics {
  play_count?: number;
  digg_count?: number;
  comment_count?: number;
  share_count?: number;
}

/**
 * Author details object or string.
 */
export interface AuthorDetails {
  name?: string;
  username?: string;
  avatar?: string;
  [key: string]: unknown;
}

/**
 * Structure of the ZM API response.
 */
export interface ApiResponse {
  title?: string;
  author?: string | AuthorDetails;
  thumbnail?: string;
  duration?: number | string;
  source?: string;
  medias: Media[];
  statistics?: Statistics;
  error: boolean;
  message?: string;
  [key: string]: unknown;
}

/**
 * Fetches social media data from the ZM API for a given video URL.
 *
 * @param videoUrl - The target URL of the social media video or post.
 * @returns Promise resolving to the structured ApiResponse.
 * @throws Error if the URL is invalid, network request fails, HTTP status != 200, or API returns error: true.
 */
export async function fetchSocialMediaData(videoUrl: string): Promise<ApiResponse> {
  const trimmedUrl = videoUrl?.trim();
  if (!trimmedUrl) {
    throw new Error('A valid video URL must be provided.');
  }

  const baseUrl = process.env.ZM_API_BASE_URL || 'https://api.zm.io.vn/v1/social/autolink';
  const apiKey = process.env.ZM_API_KEY;

  const requestUrl = `${baseUrl}?url=${encodeURIComponent(trimmedUrl)}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Fallback to text body or statusText
      }
      throw new Error(`ZM API Request Failed: ${errorMessage}`);
    }

    const data: ApiResponse = await response.json();

    if (data.error) {
      throw new Error(data.message || 'ZM API returned an error processing the media URL.');
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while requesting social media data.');
  }
}
