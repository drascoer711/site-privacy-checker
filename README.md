# Tracecheck

A privacy-first website scanner that checks a public page for common tracking signals, fingerprinting, cookies, response headers, and third-party resources.

## Run locally

```bash
npm install
npx vercel dev
```

Open `http://localhost:3000` and paste a public HTTP(S) URL.

## Deploy to Vercel

Import this repository at [vercel.com/new](https://vercel.com/new). No environment variables are required for the MVP.

## Custom domain

After deployment, open the Vercel project and choose **Settings → Domains → Add**. Enter a domain you own, then add the DNS record Vercel displays. The exact record depends on your domain registrar.

## Scope and safety

The scanner fetches HTML and response headers without executing JavaScript. It blocks credentials, localhost, private/reserved IP literals, non-HTTP protocols, oversized responses, and slow requests. Results are evidence-based signals, not proof of how a site stores or uses data.
