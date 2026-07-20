/**
 * Proxy Rotation Helper for the yt-dlp downloader engine.
 * Reads proxy configurations from environment variables and manages rotation/random selection.
 */

/**
 * Returns the command line arguments array for yt-dlp proxy config.
 * 
 * - If NO proxy environment variables are set, returns an empty array `[]`
 *   (meaning yt-dlp will use the host server's default IP without failing).
 * - If proxies are present in .env, parses them, randomly picks one (Proxy Rotation)
 *   and returns `['--proxy', selectedProxyUrl]`.
 * 
 * Supports:
 * - PROXY_URL: Single proxy URL (e.g. http://username:password@ip:port)
 * - PROXY_LIST: Comma-separated, semicolon-separated, or whitespace/newline-separated list of proxy URLs
 */
export function getProxyFlag(): string[] {
  const proxies: string[] = [];

  // Parse PROXY_URL if present
  if (process.env.PROXY_URL) {
    const trimmed = process.env.PROXY_URL.trim();
    if (trimmed) {
      proxies.push(trimmed);
    }
  }

  // Parse PROXY_LIST if present
  if (process.env.PROXY_LIST) {
    const list = process.env.PROXY_LIST.split(/[\n,;\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    proxies.push(...list);
  }

  // Filter and validate proxy formats (basic absolute URL or host:port check)
  const uniqueProxies = Array.from(new Set(proxies)).filter((proxy) => {
    try {
      new URL(proxy);
      return true;
    } catch {
      // Basic check for host:port format or credentials (e.g. user:pass@host:port)
      return /^(?:[a-zA-Z0-9+-.]+:\/\/)?(?:[^@\s]+@)?[a-zA-Z0-9.-]+:\d+$/.test(proxy);
    }
  });

  if (uniqueProxies.length === 0) {
    return [];
  }

  // Random selection for Proxy Rotation
  const randomIndex = Math.floor(Math.random() * uniqueProxies.length);
  const selectedProxy = uniqueProxies[randomIndex];

  return ["--proxy", selectedProxy];
}

/**
 * Alias for getProxyFlag to maintain backward compatibility.
 */
export function getProxyArgs(): string[] {
  return getProxyFlag();
}
