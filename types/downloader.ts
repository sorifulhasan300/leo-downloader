/**
 * Type definitions for the Social Media Video Downloader engine.
 */

export interface VideoFormat {
  formatId: string;
  formatNote?: string;
  ext: string;
  url: string;
  filesize: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  vcodec: string;
  acodec: string;
  container?: string;
  resolution?: string;
  audioBitrate: number | null; // kbps
  videoBitrate: number | null; // kbps
}

export interface VideoMetadata {
  id: string;
  title: string;
  thumbnail: string;
  thumbnails: {
    url: string;
    width?: number;
    height?: number;
  }[];
  duration: number; // in seconds
  description?: string;
  uploader?: string;
  webpageUrl: string;
  formats: VideoFormat[];
}

export interface ExtractorResponse {
  success: boolean;
  data?: VideoMetadata;
  error?: string;
  errorType?: string;
}
