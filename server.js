const express = require("express");
const http = require("http");
const net = require("net");
const { URL } = require("url");
const path = require("path");
const dns = require("dns").promises;

const app = express();
const server = http.createServer(app);
const PORT = 7277;

app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ── Proxy parsing ──────────────────────────────────────────────
function parseProxyLine(line) {
  line = line.trim();
  if (!line || line.startsWith("#")) return null;

  // protocol://[user:pass@]host:port
  if (line.includes("://")) {
    try {
      const u = new URL(line);
      const proto = u.protocol.replace(":", "").toLowerCase();
      const host = u.hostname;
      const port = parseInt(u.port, 10);
      const username = u.username ? decodeURIComponent(u.username) : null;
      const password = u.password ? decodeURIComponent(u.password) : null;
      if (!host || !port) return null;
      return { protocol: proto, host, port, username, password, raw: line };
    } catch { /* fall through */ }
  }

  // host:port:user:pass
  const parts4 = line.split(":");
  if (parts4.length === 4) {
    const host = parts4[0];
    const port = parseInt(parts4[1], 10);
    if (host && port) return { protocol: "http", host, port, username: parts4[2], password: parts4[3], raw: line };
  }

  // host:port
  if (parts4.length === 2) {
    const host = parts4[0];
    const port = parseInt(parts4[1], 10);
    if (host && port) return { protocol: "http", host, port, username: null, password: null, raw: line };
  }

  return null;
}

function parseProxies(text) {
  return text
    .split(/\r?\n/)
    .map(parseProxyLine)
    .filter(Boolean);
}

// ── Proxy checking ─────────────────────────────────────────────
async function checkProxy(proxy, timeoutMs = 8000) {
  const start = Date.now();

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    let receivedData = "";

    const done = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      // Try HTTP CONNECT (for HTTPS) or direct GET (for HTTP)
      const targetHost = "httpbin.org";
      const targetPort = 80;
      const connectStr = `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\nHost: ${targetHost}:${targetPort}\r\n\r\n`;
      socket.write(connectStr);
    });

    socket.on("data", (data) => {
      receivedData += data.toString();
      // Check for HTTP response
      if (receivedData.includes("\r\n")) {
        const firstLine = receivedData.split("\r\n")[0];
        const latency = Date.now() - start;

        if (firstLine.includes("200")) {
          // Proxy accepted CONNECT — alive
          done({
            alive: true,
            latency,
            status: firstLine.trim(),
            anonymity: detectAnonymity(receivedData),
          });
        } else {
          done({
            alive: false,
            latency,
            status: firstLine.trim(),
            anonymity: "unknown",
          });
        }
      }
    });

    socket.on("timeout", () => {
      done({ alive: false, latency: Date.now() - start, status: "Timeout", anonymity: "unknown" });
    });

    socket.on("error", (err) => {
      done({ alive: false, latency: Date.now() - start, status: err.code || err.message, anonymity: "unknown" });
    });

    socket.on("close", () => {
      if (!settled) {
        done({ alive: false, latency: Date.now() - start, status: "Connection closed", anonymity: "unknown" });
      }
    });

    socket.connect(proxy.port, proxy.host);
  });
}

function detectAnonymity(response) {
  const lower = response.toLowerCase();
  if (lower.includes("proxy-connection") || lower.includes("x-proxy")) return "transparent";
  if (lower.includes("via:") || lower.includes("x-forwarded-for")) return "anonymous";
  return "elite";
}

// ── Geo lookup (batch-free, single IP) ─────────────────────────
const geoCache = new Map();
async function lookupGeo(host) {
  if (geoCache.has(host)) return geoCache.get(host);
  try {
    const { lookup } = require("dns").promises;
    const ips = await lookup(host, { all: true });
    const ip = ips[0]?.address;
    if (!ip) return null;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,isp,query`, {
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const geo = { country: data.country || "Unknown", code: data.countryCode || "--", isp: data.isp || "Unknown", ip };
    geoCache.set(host, geo);
    return geo;
  } catch {
    return null;
  }
}

// ── SSE stream for real-time results ───────────────────────────
app.post("/api/check", async (req, res) => {
  const { proxies: proxyText, concurrency = 20, timeout = 8000 } = req.body;
  const proxies = parseProxies(proxyText);

  if (proxies.length === 0) {
    return res.status(400).json({ error: "No valid proxies found in input." });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  // Send all proxies upfront so the UI can render them as "pending"
  send({
    type: "start",
    total: proxies.length,
    proxies: proxies.map((p, i) => ({
      index: i,
      protocol: p.protocol,
      host: p.host,
      port: p.port,
      raw: p.raw,
    })),
  });

  let index = 0;
  let completed = 0;
  let alive = 0;
  let dead = 0;

  const worker = async () => {
    while (index < proxies.length) {
      const i = index++;
      const proxy = proxies[i];
      const result = await checkProxy(proxy, timeout);

      let geo = null;
      if (result.alive) {
        geo = await lookupGeo(proxy.host).catch(() => null);
      }

      completed++;
      if (result.alive) alive++;
      else dead++;

      send({
        type: "result",
        index: i,
        proxy: { protocol: proxy.protocol, host: proxy.host, port: proxy.port, raw: proxy.raw },
        result: { ...result, geo },
        stats: { completed, total: proxies.length, alive, dead },
      });
    }
  };

  const workers = [];
  const conc = Math.min(concurrency, proxies.length);
  for (let w = 0; w < conc; w++) workers.push(worker());

  Promise.all(workers).then(() => {
    send({ type: "done", stats: { completed, total: proxies.length, alive, dead } });
    res.end();
  });

  req.on("close", () => {
    index = proxies.length; // stop workers
  });
});

server.listen(PORT, () => {
  console.log(`\n  ▸ Proxy Checker running at  http://localhost:${PORT}\n`);
});
