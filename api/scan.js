import { chromium } from "playwright";

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8_000;

const TRACKERS = [
  { name: "Google Analytics", pattern: /google-analytics|googletagmanager|gtag\(/i, severity: "medium" },
  { name: "Meta Pixel", pattern: /connect\.facebook\.net|fbq\(/i, severity: "medium" },
  { name: "TikTok Pixel", pattern: /analytics\.tiktok\.com|ttq\./i, severity: "medium" },
  { name: "Hotjar", pattern: /static\.hotjar\.com|hj\(/i, severity: "medium" },
  { name: "Microsoft Clarity", pattern: /clarity\.ms|clarity\(/i, severity: "medium" },
  { name: "Amplitude", pattern: /amplitude\.com|amplitude\.js/i, severity: "medium" },
  { name: "Mixpanel", pattern: /mixpanel\.com|mixpanel\.js/i, severity: "medium" },
  { name: "Segment", pattern: /segment\.com|analytics\.js/i, severity: "medium" },
  { name: "Session replay", pattern: /fullstory|smartlook|mouseflow|logrocket|getsentry|sentry\.io/i, severity: "high" },
  { name: "Fingerprinting library", pattern: /fingerprintjs|fingerprint\.com|clientjs|akamai|edgecast/i, severity: "high" }
];

const IP_LOGGER_PATTERNS = [
  { name: "IP Logger (iplogger)", pattern: /iplogger\.|iplogger\b|grabify|iplogger\.org|iplogger\.com|iplogger\.ru|iplogger\.co|iplogger\.net|iplogger\.info|iplogger\.me|iplogger\.app|iplogger\.live|iplogger\.tool|iplogger\.xyz|iplogger\.site/i, severity: "critical" },
  { name: "IP lookup service", pattern: /ip-api|ipify|ipinfo|whatismyipaddress|checkip|icanhazip|myexternalip|ifconfig|geoip|ipwhois|ipinfo\.io|api\.ipify\.org|api\.ipify\.io|ipapi\.co|ipleak|ipaddress|ipwho\.is/i, severity: "high" },
  { name: "URL shortener / redirect tracker", pattern: /bit\.ly|tinyurl|t\.co|ow\.ly|goo\.gl|rebrand\.ly|is\.gd|cutt\.ly|2no\.co|rb\.gy|lnkd\.in|tiny\.cc|shorturl/i, severity: "high" },
  { name: "Proxy / IP leak checker", pattern: /proxycheck|proxyway|whatsmyip|whatismyip|ipstack|iplocation|ipgeolocation|ipinfo|ip2location|geojs|ip\.sh/i, severity: "medium" }
];

const FINGERPRINTING = [
  { name: "Canvas fingerprinting", pattern: /toDataURL\s*\(|getImageData\s*\(/i },
  { name: "WebGL renderer detection", pattern: /WEBGL_debug_renderer_info|UNMASKED_RENDERER_WEBGL/i },
  { name: "Audio fingerprinting", pattern: /OfflineAudioContext|AudioContext/i },
  { name: "Battery status access", pattern: /navigator\.getBattery/i },
  { name: "Hardware/device hints", pattern: /hardwareConcurrency|deviceMemory|maxTouchPoints|screen\.colorDepth/i }
];

const DATA_COLLECTION = [
  { name: "localStorage access", pattern: /localStorage\.(set|get|remove)/i, risk: "medium" },
  { name: "sessionStorage access", pattern: /sessionStorage\.(set|get|remove)/i, risk: "medium" },
  { name: "IndexedDB access", pattern: /indexedDB|openDatabase/i, risk: "medium" },
  { name: "Form data capture", pattern: /addEventListener.*submit|onsubmit/i, risk: "high" },
  { name: "Keystroke logging", pattern: /addEventListener.*key(up|down)|onkey(up|down)/i, risk: "high" },
  { name: "Mouse tracking", pattern: /addEventListener.*mouse(move|enter|leave)|onmouse(move|enter|leave)/i, risk: "high" },
  { name: "Scroll tracking", pattern: /addEventListener.*scroll|onscroll/i, risk: "medium" },
  { name: "Focus tracking", pattern: /addEventListener.*focus|blur|onfocus|onblur/i, risk: "medium" },
  { name: "Copy/Paste monitoring", pattern: /addEventListener.*copy|paste|oncopy|onpaste|clipboardData/i, risk: "high" },
  { name: "Geolocation API", pattern: /navigator\.geolocation|getCurrentPosition|watchPosition/i, risk: "high" },
  { name: "Microphone access", pattern: /getUserMedia|mediaDevices|audio.*true/i, risk: "critical" },
  { name: "Camera access", pattern: /getUserMedia|mediaDevices|video.*true/i, risk: "critical" },
  { name: "Notification permission", pattern: /Notification\.requestPermission|notification\.permission/i, risk: "medium" }
];

const DATA_EXFILTRATION = [
  { name: "Beacon API (data exfil)", pattern: /navigator\.sendBeacon|fetch\(.*navigator\./i, risk: "high" },
  { name: "Image beacon (pixel tracking)", pattern: /new Image\(\)|image.*1x1|transparent\.gif/i, risk: "high" },
  { name: "Data sent to tracking domain", pattern: /fetch\(.*(?:analytics|tracking|metrics|telemetry|segment)/i, risk: "high" },
  { name: "Form submission to external", pattern: /form.*action=.*(?!^\/|same\-origin)/i, risk: "medium" },
  { name: "XMLHttpRequest to tracker", pattern: /XMLHttpRequest|xhr.*(?:analytics|tracking|metrics)/i, risk: "high" },
  { name: "WebSocket connection", pattern: /new WebSocket|ws:\/\/|wss:\/\//i, risk: "medium" }
];

const THIRD_PARTY_DATA_BROKERS = [
  { name: "Acxiom (data broker)", pattern: /acxiom|liveramp|people-based/i, risk: "critical" },
  { name: "Equifax (credit data)", pattern: /equifax|consumerinfo/i, risk: "critical" },
  { name: "Experian (credit data)", pattern: /experian|creditinfo/i, risk: "critical" },
  { name: "Oracle BlueKai (audience)", pattern: /oracle.*bluekai|bluekai/i, risk: "high" },
  { name: "Krux (audience platform)", pattern: /krux|krux\.com/i, risk: "high" },
  { name: "Neustar (precision ID)", pattern: /neustar|precisionid/i, risk: "high" }
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

const TRACKER_DOMAINS = [
  ["Google Analytics", /google-analytics\.com|googletagmanager\.com|gtm\.google\.com/i],
  ["Meta Pixel", /facebook\.net|facebook\.com\/tr/i],
  ["TikTok", /tiktok\.com|tiktokcdn/i],
  ["Hotjar", /hotjar\.com|hotjar\.io/i],
  ["Clarity", /clarity\.ms/i],
  ["Amplitude", /amplitude\.com/i],
  ["Mixpanel", /mixpanel\.com/i],
  ["Segment", /segment\.com/i],
  ["Sentry", /sentry\.io/i],
  ["FullStory", /fullstory\.com/i],
  ["Smartlook", /smartlook\.com/i],
  ["Mouseflow", /mouseflow\.com/i],
  ["LogRocket", /logrocket\.com/i],
  ["IP Logger", /iplogger\.|iplogger\b|grabify|ip-logger|iplogger\.org|iplogger\.com|iplogger\.ru|iplogger\.co|iplogger\.net|iplogger\.info|iplogger\.me|iplogger\.app|iplogger\.tool|iplogger\.xyz|iplogger\.site|iplogger\.live|ip\-logger/i],
  ["IP Lookup Service", /ip-api|ipify|ipinfo|whatismyipaddress|checkip|icanhazip|myexternalip|ifconfig|geoip|ipwhois|ipinfo\.io|api\.ipify\.org|api\.ipify\.io|ipapi\.co|ipleak|ipaddress|ipwho\.is/i],
  ["URL shortener tracker", /bit\.ly|tinyurl|t\.co|ow\.ly|goo\.gl|rebrand\.ly|is\.gd|cutt\.ly|2no\.co|rb\.gy|lnkd\.in|tiny\.cc|shorturl/i]
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

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || isPrivateHost(url.hostname)) {
    throw new Error("Only public HTTP(S) URLs without credentials can be scanned.");
  }

  url.hash = "";
  return url;
}

function severityScore(findings) {
  const score = findings.reduce((total, item) => {
    if (item.severity === "critical") return total + 5;
    if (item.severity === "high") return total + 3;
    if (item.severity === "medium") return total + 2;
    return total + 1;
  }, 0);

  return {
    score,
    level: score >= 10 ? "high" : score >= 5 ? "medium" : "low"
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
        /(session|track|analytics|_ga|_gid|fbp|tt|utm|uid|sid)/i.test(name || "") ||
        /secure|httponly|samesite/i.test(attributes.join(" ")) === false
    };
  });
}

function domainFromUrl(candidate) {
  try {
    return new URL(candidate).hostname;
  } catch {
    return null;
  }
}

function categorizeRequestHost(hostname) {
  const matches = [];
  for (const [name, pattern] of TRACKER_DOMAINS) {
    if (pattern.test(hostname)) matches.push(name);
  }
  return matches;
}

async function collectRuntimeData(targetUrl) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-blink-features=AutomationControlled"]
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1200 },
      userAgent: "Tracecheck/1.0 (privacy audit)"
    });

    const requests = [];
    const consoleMessages = [];
    const pageErrors = [];

    page.on("request", (request) => {
      try {
        const url = request.url();
        const domain = domainFromUrl(url);
        requests.push({
          url,
          method: request.method(),
          resourceType: request.resourceType(),
          domain: domain || "unknown",
          matchedTrackers: categorizeRequestHost(domain || "")
        });
      } catch {
        // ignore invalid requests
      }
    });

    page.on("console", (msg) => {
      consoleMessages.push(msg.text());
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(2500);

    const storage = await page.evaluate(() => {
      try {
        const local = Object.fromEntries(Object.entries(window.localStorage || {}));
        const session = Object.fromEntries(Object.entries(window.sessionStorage || {}));
        return {
          local,
          session,
          cookies: document.cookie || "",
          referrer: document.referrer || "",
          title: document.title || ""
        };
      } catch {
        return { local: {}, session: {}, cookies: "", referrer: "", title: "" };
      }
    });

    const runtime = {
      url: await page.url(),
      pageTitle: storage.title,
      cookies: storage.cookies,
      referrer: storage.referrer,
      localStorage: Object.keys(storage.local || {}),
      sessionStorage: Object.keys(storage.session || {}),
      requests: requests.slice(0, 100),
      consoleMessages: consoleMessages.slice(0, 25),
      pageErrors: pageErrors.slice(0, 10)
    };

    const trackingMatches = [];
    for (const request of runtime.requests) {
      const host = request.domain;
      const matches = categorizeRequestHost(host);
      if (matches.length) {
        trackingMatches.push({
          domain: host,
          trackers: matches,
          url: request.url,
          resourceType: request.resourceType
        });
      }
    }

    const uniqueTrackingMatches = [];
    const seen = new Set();
    for (const item of trackingMatches) {
      const key = `${item.domain}|${item.trackers.join(',')}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTrackingMatches.push(item);
      }
    }

    return {
      runtime,
      uniqueTrackingMatches
    };
  } finally {
    await browser.close();
  }
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
        { name: "Data tracking indicators", value: String(result.dataTracking?.total || 0), inline: true },
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
    const dataTrackingFindings = [];

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

    for (const logger of IP_LOGGER_PATTERNS) {
      if (logger.pattern.test(html) || logger.pattern.test(lower)) {
        findings.push({
          category: "IP Logger",
          name: logger.name,
          severity: logger.severity,
          detail: `This page appears to be using or referencing an IP logging or IP lookup service: ${logger.name}.`
        });
        dataTrackingFindings.push({
          type: logger.name,
          risk: logger.severity,
          detail: `Potential IP collection or tracking service detected: ${logger.name}`
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

    for (const collection of DATA_COLLECTION) {
      if (collection.pattern.test(html)) {
        dataTrackingFindings.push({
          type: collection.name,
          risk: collection.risk,
          detail: `The page attempts to collect data using: ${collection.name}`
        });
        findings.push({
          category: "Data Collection",
          name: collection.name,
          severity: collection.risk === "critical" ? "high" : collection.risk === "high" ? "high" : "medium",
          detail: `Pattern detected in page source: ${collection.name}`
        });
      }
    }

    for (const exfil of DATA_EXFILTRATION) {
      if (exfil.pattern.test(html)) {
        dataTrackingFindings.push({
          type: exfil.name,
          risk: exfil.risk,
          detail: `The page may be sending data via: ${exfil.name}`
        });
        findings.push({
          category: "Data Exfiltration",
          name: exfil.name,
          severity: exfil.risk === "critical" ? "high" : exfil.risk === "high" ? "high" : "medium",
          detail: "Pattern detected: data may be sent to remote servers"
        });
      }
    }

    for (const broker of THIRD_PARTY_DATA_BROKERS) {
      if (broker.pattern.test(html)) {
        dataTrackingFindings.push({
          type: broker.name,
          risk: broker.risk,
          detail: `Link to data broker detected: ${broker.name}`
        });
        findings.push({
          category: "Data Broker",
          name: broker.name,
          severity: "high",
          detail: `Integration with third-party data broker: ${broker.name}`
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
          severity: /analytics|track|_ga|_gid|fbp|tt|uid|sid/i.test(cookie.name) ? "medium" : "low",
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

    const params = [...lower.matchAll(/(?:[?&])(utm_[^=&#]+|fbclid|gclid|msclkid|fbp|_ga|uid|sid)=/g)].map((m) => m[1]);

    if (params.length) {
      findings.push({
        category: "Tracking parameter",
        name: "Marketing/User ID parameters",
        severity: "low",
        detail: [...new Set(params)].join(", ")
      });
    }

    const technologies = TECHNOLOGIES
      .filter(([, pattern]) => pattern.test(html))
      .map(([name]) => name);

    const security = summarizeSecurity(headers);
    const risk = severityScore(findings);

    const runtimeScan = await collectRuntimeData(target.href).catch(() => ({
      runtime: { requests: [], localStorage: [], sessionStorage: [], pageErrors: [], consoleMessages: [] },
      uniqueTrackingMatches: []
    }));

    const runtimeTrackingItems = runtimeScan.uniqueTrackingMatches.map((match) => ({
      domain: match.domain,
      trackers: match.trackers,
      resourceType: match.resourceType,
      url: match.url
    }));

    const runtimeFindings = runtimeTrackingItems.map((match) => ({
      category: "Runtime Tracking",
      name: match.trackers[0] || "Tracking domain",
      severity: match.trackers.includes("IP Logger") || match.trackers.includes("IP Lookup Service") ? "critical" : "high",
      detail: `${match.domain} was contacted during page load and matched ${match.trackers.join(", ")}.`
    }));

    for (const item of runtimeFindings) {
      findings.push(item);
    }

    const allTrackingItems = [...dataTrackingFindings, ...runtimeTrackingItems.map((track) => ({
      type: track.trackers.join(", "),
      risk: track.trackers.includes("IP Logger") || track.trackers.includes("IP Lookup Service") ? "critical" : "high",
      detail: `${track.domain} contacted at runtime`
    }))];

    const result = {
      url: target.href,
      status: response.status,
      truncated: bytes > MAX_BYTES,
      risk,
      findings,
      dataTracking: {
        total: allTrackingItems.length,
        critical: allTrackingItems.filter((item) => item.risk === "critical").length,
        high: allTrackingItems.filter((item) => item.risk === "high").length,
        medium: allTrackingItems.filter((item) => item.risk === "medium").length,
        items: allTrackingItems.slice(0, 20)
      },
      runtimeTracking: {
        url: runtimeScan.runtime.url,
        title: runtimeScan.runtime.pageTitle,
        requests: runtimeScan.runtime.requests.slice(0, 50),
        localStorage: runtimeScan.runtime.localStorage,
        sessionStorage: runtimeScan.runtime.sessionStorage,
        pageErrors: runtimeScan.runtime.pageErrors,
        consoleMessages: runtimeScan.runtime.consoleMessages,
        matchedTrackers: runtimeTrackingItems
      },
      externalDomains,
      technologies,
      cookies,
      headers,
      security,
      fetchedAt: new Date().toISOString(),
      note: "Static HTML + live browser inspection were used to detect tracking behavior, IP-related data logging, runtime network calls, and privacy risks."
    };

    await notifyDiscord({ target, requester, result, req });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error: error.name === "AbortError" ? "The scan timed out." : error.message || "The scan failed."
    });
  }
}
