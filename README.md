# Site Privacy Checker

A small, privacy-first website scanner for identifying common tracking signals in a public page's HTML and response headers.

## What it checks

- Known analytics, advertising, session-replay, and fingerprinting scripts
- Third-party script and resource domains
- `Set-Cookie` response headers and cookie attributes
- Privacy/security headers such as CSP and Referrer-Policy
- Inline JavaScript patterns associated with canvas, WebGL, audio, battery, and device fingerprinting
- Tracking query parameters such as `utm_*`, `fbclid`, and `gclid`

## Run locally

```bash
npm install
npx vercel dev
```

Then open `http://localhost:3000`.

## Important limitations

This first version fetches a page's HTML without executing JavaScript. It cannot prove what a server stores about a visitor, inspect requests made only after interaction, or determine how a company uses received data. Results are evidence-based signals, not a legal or absolute privacy verdict.

The API blocks localhost, private/reserved IP literals, non-HTTP protocols, credentials in URLs, and oversized responses. Do not remove these protections if adding a browser worker later; browser-based scanning should use isolated workers with DNS-rebinding and SSRF protections.
