// test-proxy.js
const dotenv = require('dotenv');
const YTDlpWrap = require('yt-dlp-wrap').default;

dotenv.config();

const ytDlp = new YTDlpWrap();

const proxyListRaw = process.env.PROXY_LIST || process.env.PROXY_URL || "";
const proxies = proxyListRaw.split(',').map(p => p.trim()).filter(Boolean);

console.log(`🔍 Total Proxies Loaded: ${proxies.length}`);

if (proxies.length === 0) {
  console.log("❌ No proxies found in .env.local!");
  process.exit(1);
}

const selectedProxy = proxies[Math.floor(Math.random() * proxies.length)];
console.log(`⚡ Testing with Proxy: ${selectedProxy}`);

const testUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

async function runTest() {
  try {
    const metadata = await ytDlp.getVideoInfo([
      testUrl,
      '--proxy', selectedProxy,
      '--dump-json',
      '--no-playlist'
    ]);
    
    console.log("✅ Proxy Success!");
    console.log("🎥 Video Title:", metadata.title);
  } catch (error) {
    console.error("❌ Proxy Failed/Timed Out:", error.message);
  }
}

runTest();