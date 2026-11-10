import https from 'https';

// High-performance shared HTTPS agent with connection pooling & HTTP keep-alive
const sharedAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 40,
  maxFreeSockets: 20,
  timeout: 15000,
  keepAliveMsecs: 60000,
});

// Cache for resolved IPs: hostname -> { ips: string[], index: number, expiry: number }
const dnsCache = new Map();

/**
 * Resolves a hostname directly via Cloudflare (1.1.1.1) or Google (8.8.8.8) DoH over HTTPS.
 * This completely bypasses ISP-level DNS filtering / poisoning (e.g. in Indonesia)
 * without requiring any third-party app or Windows network configuration changes!
 */
export async function resolveHostViaDoH(hostname) {
  // If already an IP address, return immediately
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return hostname;
  }

  const now = Date.now();
  if (dnsCache.has(hostname)) {
    const entry = dnsCache.get(hostname);
    if (entry.expiry > now && entry.ips.length > 0) {
      return entry.ips[entry.index % entry.ips.length];
    }
  }

  const collectedIps = [];

  // 1. Try Cloudflare DoH directly by IP (https://1.1.1.1/dns-query)
  try {
    const res = await fetch(`https://1.1.1.1/dns-query?name=${hostname}&type=A`, {
      headers: { 'accept': 'application/dns-json' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json = await res.json();
      const ips = json.Answer
        ?.filter((a) => a.type === 1 && a.data && /^(\d{1,3}\.){3}\d{1,3}$/.test(a.data))
        .map((a) => a.data);
      if (ips && ips.length > 0) {
        collectedIps.push(...ips);
      }
    }
  } catch (e) {
    // Cloudflare IP attempt failed, try Google fallback
  }

  // 2. Fallback to Google DoH directly by IP (https://8.8.8.8/resolve)
  if (collectedIps.length === 0) {
    try {
      const res = await fetch(`https://8.8.8.8/resolve?name=${hostname}&type=A`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        const ips = json.Answer
          ?.filter((a) => a.type === 1 && a.data && /^(\d{1,3}\.){3}\d{1,3}$/.test(a.data))
          .map((a) => a.data);
        if (ips && ips.length > 0) {
          collectedIps.push(...ips);
        }
      }
    } catch (e) {
      // Fallback handled
    }
  }

  if (collectedIps.length > 0) {
    const uniqueIps = Array.from(new Set(collectedIps));
    dnsCache.set(hostname, { ips: uniqueIps, index: 0, expiry: now + 5 * 60 * 1000 });
    return uniqueIps[0];
  }

  return null;
}

/**
 * Rotates the cached IP address for a hostname to failover across CloudFront CDN edges.
 */
export function rotateHostIp(hostname) {
  if (dnsCache.has(hostname)) {
    const entry = dnsCache.get(hostname);
    if (entry.ips.length > 1) {
      entry.index = (entry.index + 1) % entry.ips.length;
    }
  }
}

/**
 * Fetch wrapper that routes requests directly to the DoH-resolved IP address
 * while preserving the correct TLS SNI and HTTP Host headers for certificate validation.
 */
export async function dohFetch(urlStr, options = {}, redirectCount = 0) {
  if (redirectCount > 5) {
    throw new Error(`Too many redirects fetching ${urlStr}`);
  }

  const url = new URL(urlStr);
  const hostname = url.hostname;
  const timeoutMs = options.timeout || 8000;

  // Resolve IP via Cloudflare / Google DoH
  const dohIp = await resolveHostViaDoH(hostname);
  const connectHost = dohIp || hostname;

  return new Promise((resolve, reject) => {
    const reqOptions = {
      agent: sharedAgent,
      host: connectHost,
      servername: hostname, // Required for CloudFront/Cloudflare SSL SNI validation
      port: url.port || 443,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Host': hostname,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        ...(options.headers || {}),
      },
      timeout: timeoutMs,
    };

    const req = https.request(reqOptions, (res) => {
      // Handle HTTP redirects (301, 302, 303, 307, 308)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, urlStr).toString();
        res.resume(); // Discard redirect body
        return resolve(dohFetch(redirectUrl, options, redirectCount + 1));
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const bodyBuffer = Buffer.concat(chunks);
        const text = bodyBuffer.toString('utf8');
        // Valid successful API response: HTTP 200 with non-empty body
        const isOk = res.statusCode === 200 && text.trim().length > 0;

        resolve({
          ok: isOk,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: {
            get: (name) => {
              const val = res.headers[name.toLowerCase()];
              return Array.isArray(val) ? val.join(', ') : val || null;
            },
          },
          async json() {
            if (!text || text.trim() === '') {
              throw new Error(`Empty response from server (HTTP ${res.statusCode}: ${res.statusMessage || 'No content'})`);
            }
            return JSON.parse(text);
          },
          async text() {
            return text;
          },
          async arrayBuffer() {
            return bodyBuffer.buffer.slice(
              bodyBuffer.byteOffset,
              bodyBuffer.byteOffset + bodyBuffer.byteLength
            );
          },
          async buffer() {
            return bodyBuffer;
          },
        });
      });
    });

    req.on('timeout', () => {
      rotateHostIp(hostname);
      req.destroy(new Error(`Request to ${urlStr} timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err) => {
      rotateHostIp(hostname);
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}
