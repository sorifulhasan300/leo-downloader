/**
 * Proxy Rotation Helper for yt-dlp downloader engine.
 * Reads proxy configurations from environment variables and manages rotation.
 */

// Module-level state to track the round-robin index.
// Using a random starting index helps distribute traffic better, 
// especially in serverless or multi-process environments.
let proxyIndex = Math.floor(Math.random() * 1000);

/**
 * Parses and returns a list of proxy URLs configured in the environment variables.
 * 
 * Supports:
 * - PROXY_LIST env variable containing a list of proxies separated by commas, semicolons, newlines, or whitespace.
 * - Basic validation of proxy formats (URL or host:port).
 * 
 * Example PROXY_LIST formats:
 * - "http://user:pass@1.2.3.4:8080,socks5://5.6.7.8:1080"
 * - "http://proxy1.com:8080\nhttp://proxy2.com:8080"
 */
export function getProxyList(): string[] {
  const proxyListStr = process.env.PROXY_LIST;
  if (!proxyListStr) {
    return [];
  }

  return proxyListStr
    .split(/[\n,;\s]+/)
    .map((url) => url.trim())
    .filter((url) => {
      if (!url) return false;
      try {
        // Standard URL validation (e.g. http://..., socks5://...)
        new URL(url);
        return true;
      } catch {
        // Accept host:port format or credentials format even if it doesn't parse as a standard absolute URL
        return /^(?:[a-zA-Z0-9+-.]+:\/\/)?(?:[^@\s]+@)?[a-zA-Z0-9.-]+:\d+$/.test(url);
      }
    });
}

/**
 * Rotates and returns the next proxy URL using round-robin.
 * Returns null if no proxies are configured or valid.
 */
export function getNextProxy(): string | null {
  const proxies = getProxyList();
  if (proxies.length === 0) {
    return null;
  }

  const selectedProxy = proxies[proxyIndex % proxies.length];
  
  // Advance index, keeping it within safe integer bounds
  proxyIndex = (proxyIndex + 1) % proxies.length;
  
  return selectedProxy;
}

/**
 * Returns the command line arguments array for yt-dlp proxy config.
 * E.g., `["--proxy", "http://user:pass@ip:port"]` or empty array `[]`.
 */
export function getProxyArgs(): string[] {
  const proxy = getNextProxy();
  return proxy ? ["--proxy", proxy] : [];
}
