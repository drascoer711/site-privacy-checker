# Tracecheck

Tracecheck is a privacy-first website scanner. It checks public HTML and response headers for tracker signals, fingerprinting APIs, cookies, third-party resources, detected technologies, and security headers.

## Conversational AI layer

This version includes an optional chat panel that can explain the most recent scan.

To enable it, add:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

in Vercel under Project Settings → Environment Variables.

If the key is missing, the AI section stays available but returns a friendly fallback message instead of making an API call.

## Discord scan notifications

To receive a Discord notification whenever somebody starts a scan, create a Discord webhook and add this Vercel environment variable:

```text
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

The notification includes the website hostname, the optional name supplied by the visitor, browser user-agent, risk level, finding count, and third-party-domain count. It deliberately does not include a visitor IP address, cookies, or raw submitted name beyond a short sanitized label. Webhook failures do not interrupt scans.

## Deploy

Import the repository at [vercel.com/new](https://vercel.com/new), then add `DISCORD_WEBHOOK_URL` and optional `OPENAI_API_KEY` under Project Settings → Environment Variables and redeploy. No custom domain is required; Vercel supplies a free `.vercel.app` URL.

## Run locally

```bash
npm install
npx vercel dev
```

Then open:

```text
http://localhost:3000
```

## Scope and safety

The scanner does not execute JavaScript yet, so it cannot observe interaction-triggered requests. It blocks credentials, localhost, private/reserved IP literals, non-HTTP protocols, oversized responses, and slow requests. Results are evidence-based signals, not proof of what a website stores or how it uses data. Browser-based scanning should use an isolated worker with strict SSRF and DNS-rebinding protections.

## AI chat behavior

The chat system uses the latest scan as context and asks the model to explain:

- the site’s likely risk level
- what tracker signals were found
- what the third-party domains may indicate
- what technologies the site appears to use
- what the missing security headers mean
- what actions a user might take

It should always be used as a helper, not as a final legal or security verdict.
