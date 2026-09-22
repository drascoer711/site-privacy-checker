const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8_000;

const TRACKERS = [
  { name: "Google Analytics", pattern: /google-analytics|googletagmanager|gtag\(/i, severity: "medium" },
  { name: "Meta Pixel", pattern: /connect\.facebook\.net|fbq\(/i, severity: "medium" },
  { name: "TikTok Pixel", pattern: /analytics\.tiktok\.com|ttq\./i, severity: "medium" },
  { name: "Hotjar", pattern: /static\.hotjar\.com|hj\(/i, severity: "medium" },
  { name: "Microsoft Clarity", pattern: /clarity\.ms|clarity\(/i, severity: "medium" },
  { name: "Session replay", pattern: /fullstory|smartlook|mouseflow|logrocket/i, severity: "high" },
  { name: "Fingerprinting library", pattern: /fingerprintjs|fingerprint\.com|clientjs/i, severity: "high" }
];

const FINGERPRINTING = [
  { name: "Canvas fingerprinting", pattern: /toDataURL\s*\(|getImageData\s*\(/i },
  { name: "WebGL renderer detection", pattern: /WEBGL_debug_renderer_info|UNMASKED_RENDERER_WEBGL/i },
  { name: "Audio fingerprinting", pattern: /OfflineAudioContext|AudioContext/i },
  { name: "Battery status access", pattern: /navigator\.getBattery/i },
  { name: "Hardware/device hints", pattern: /hardwareConcurrency|deviceMemory|maxTouchPoints|screen\.colorDepth/i }
];

const TECHNOLOGIES = [
  ["WordPress", /wp-content|wp-includes/i],
  ["Shopify", /cdn\.shopify\.com|shopifycdn/i],
  ["Webflow", /webflow\.com|data-wf-page/i],
  ["React", /react(?:\.production)?\.min\.js|__next_data__/i],
  ["Next.js", /_next\/static|__next_f/i],
  ["Vue", /vue(?:\.runtime)?\.min\.js/i],
  ["Bootstrap", /bootstrap(?:\.min)?\.(?:css|js)/i],
  ["Google Tag Manager", /googletagmanager|gtm\.js/i],
  ["Cloudflare", /cdnjs\.cloudflare\.com|cloudflare/i]
];

const SECURITY_HEADERS = [
  "content-security-policy",
  "referrer-policy",
  "permissions-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options"
];

function isPrivateHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host === "0.0.0.0" || host === "::1") return true;
  if (/^(10|127)\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
  const match = host.match(/^172\.(\d{1,3})\./);
  if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return true;
  return host.includes(":");
}

function parseTarget(value) {
  let url;

  try {
    url = new URL(value.includes("://") ? value : `https://${value}`);
  } catch {
    throw new Error("Enter a valid website URL.");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    isPrivateHost(url.hostname)
  ) {
    throw new Error("Only public HTTP(S) URLs without credentials can be scanned.");
  }

  url.hash = "";
  return url;
}

function severityScore(findings) {
  const score = findings.reduce((total, item) => {
    if (item.severity === "high") return total + 3;
    if (item.severity === "medium") return total + 2;
    return total + 1;
  }, 0);

  return {
    score,
    level: score >= 7 ? "high" : score >= 3 ? "medium" : "low"
  };
}

function cleanLabel(value) {
  return String(value || "Anonymous visitor")
    .replace(/[\\`*_~|<>]/g, "")
    .trim()
    .slice(0, 80) || "Anonymous visitor";
}

function summarizeSecurity(headers) {
  const present = Object.entries(headers)
    .filter(([, value]) => Boolean(value))
    .map(([name]) => name);

  const missing = SECURITY_HEADERS.filter((name) => !present.includes(name));
  const score = Math.round((present.length / SECURITY_HEADERS.length) * 100);

  return {
    total: SECURITY_HEADERS.length,
    present: present.length,
    missing,
    score
  };
}

function parseCookieList(cookieHeaders) {
  return cookieHeaders.map((cookie) => {
    const raw = String(cookie).split(";").map((part) => part.trim()).filter(Boolean);
    const [pair, ...attributes] = raw;
    const [name, ...valueParts] = (pair || "").split("=");
    const value = valueParts.join("=");
    return {
      name: name || "Unnamed cookie",
      value: value ? value.slice(0, 40) : "",
      attributes: attributes.slice(0, 8),
      risky:
        /(session|track|analytics|_ga|_gid|fbp|tt|utm)/i.test(name || "") ||
        /secure|httponly|samesite/i.test(attributes.join(" ")) === false
    };
  });
}

async function notifyDiscord({ target, requester, result, req }) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return;

  const userAgent = String(req.headers["user-agent"] || "Unknown browser").slice(0, 180);

  const payload = {
    username: "Tracecheck",
    embeds: [{
      title: "New privacy scan",
      description: `A visitor requested a scan of ${target.href}`,
      color: result.risk.level === "high" ? 0xff7890 : result.risk.level === "medium" ? 0xffd166 : 0x74f5ca,
      fields: [
        { name: "Website checked", value: `\`${target.hostname}\``, inline: true },
        { name: "Requested by", value: cleanLabel(requester), inline: true },
        { name: "Risk", value: `${result.risk.level.toUpperCase()} (${result.risk.score})`, inline: true },
        { name: "Findings", value: String(result.findings.length), inline: true },
        { name: "Third-party domains", value: String(result.externalDomains.length), inline: true },
        { name: "Browser", value: userAgent, inline: false }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Tracecheck · IP addresses are not included" }
    }]
  };

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    // never fail a scan because of a webhook issue
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  try {
    const target = parseTarget(req.body?.url || "");
    const requester = req.body?.requester || "Anonymous visitor";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response;

    try {
      response = await fetch(target, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "Tracecheck/1.0 (privacy audit)"
        }
      });
    } finally {
      clearTimeout(timer);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return res.status(422).json({ error: "The URL did not return an HTML page." });
    }

    const reader = response.body?.getReader();
    let bytes = 0;
    let html = "";

    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_BYTES) break;
        html += decoder.decode(value, { stream: true });
      }
    } else {
      html = await response.text();
    }

    const lower = html.toLowerCase();
    const findings = [];

    for (const tracker of TRACKERS) {
      if (tracker.pattern.test(html)) {
        findings.push({
          category: "Tracker",
          name: tracker.name,
          severity: tracker.severity,
          detail: "A matching script or API pattern was found in the page."
        });
      }
    }

    for (const signal of FINGERPRINTING) {
      if (signal.pattern.test(html)) {
        findings.push({
          category: "Fingerprinting",
          name: signal.name,
          severity: "high",
          detail: "A browser/device identification API pattern was found in page source."
        });
      }
    }

    const cookieHeaders = response.headers.getSetCookie?.() ||
      (response.headers.get("set-cookie") ? [response.headers.get("set-cookie")] : []);

    const cookies = parseCookieList(cookieHeaders);

    for (const cookie of cookies) {
      if (cookie.risky) {
        findings.push({
          category: "Cookie",
          name: cookie.name,
          severity: /analytics|track|_ga|_gid|fbp|tt/i.test(cookie.name) ? "medium" : "low",
          detail: `Cookie attributes: ${cookie.attributes.join(", ") || "no explicit attributes"}`
        });
      }
    }

    const headers = {};
    for (const name of SECURITY_HEADERS) {
      headers[name] = response.headers.get(name) || null;
    }

    const externalDomains = [...new Set(
      [...html.matchAll(/(?:src|href|action)=["']([^"']+)["']/gi)]
        .map((m) => {
          try {
            return new URL(m[1], target).hostname;
          } catch {
            return null;
          }
        })
        .filter((host) => host && host !== target.hostname)
    )].slice(0, 40);

    const params = [...lower.matchAll(/(?:[?&])(utm_[^=&#]+|fbclid|gclid|msclkid)=/g)].map((m) => m[1]);

    if (params.length) {
      findings.push({
        category: "Tracking parameter",
        name: "Marketing identifiers",
        severity: "low",
        detail: [...new Set(params)].join(", ")
      });
    }

    const technologies = TECHNOLOGIES
      .filter(([, pattern]) => pattern.test(html))
      .map(([name]) => name);

    const security = summarizeSecurity(headers);
    const risk = severityScore(findings);

    const result = {
      url: target.href,
      status: response.status,
      truncated: bytes > MAX_BYTES,
      risk,
      findings,
      externalDomains,
      technologies,
      cookies,
      headers,
      security,
      fetchedAt: new Date().toISOString(),
      note: "HTML and response headers were inspected; JavaScript was not executed."
    };

    await notifyDiscord({ target, requester, result, req });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error: error.name === "AbortError" ? "The scan timed out." : error.message || "The scan failed."
    });
  }
}