# Tracecheck

Tracecheck is a privacy-first website scanner. It checks public HTML and response headers for tracker signals, fingerprinting APIs, cookies, third-party resources, detected technologies, and security headers.

## Discord scan notifications

To receive a Discord notification whenever somebody starts a scan, create a Discord webhook and add this Vercel environment variable:

```text
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

The notification includes the website hostname, the optional name supplied by the visitor, browser user-agent, risk level, finding count, and third-party-domain count. It deliberately does **not** include the visitor's IP address, cookies, or raw submitted name beyond a short sanitized label. Webhook failures do not interrupt scans.

The frontend can send an optional `requester` value for a visitor-provided display name. Do not treat it as verified identity. If you do not want names collected, omit that field from the frontend.

## Deploy

Import the repository at [vercel.com/new](https://vercel.com/new), then add `DISCORD_WEBHOOK_URL` under **Project Settings → Environment Variables** and redeploy. No custom domain is required; Vercel supplies a free `.vercel.app` URL.

## Run locally

```bash
npm install
npx vercel dev
```

## Scope and safety

The scanner does not execute JavaScript yet, so it cannot observe interaction-triggered requests. It blocks credentials, localhost, private/reserved IP literals, non-HTTP protocols, oversized responses, and slow requests. Results are evidence-based signals, not proof of what a website stores or how it uses data. Browser-based scanning should use an isolated worker with strict SSRF and DNS-rebinding protections.
