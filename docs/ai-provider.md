# AI provider

Tracecheck now uses Google Gemini instead of OpenAI. Add these Vercel environment variables:

```text
GEMINI_API_KEY=your-Google-AI-Studio-key
GEMINI_MODEL=gemini-2.5-flash
```

Create the API key in Google AI Studio, then store it only as a server-side Vercel environment variable. Do not put it in browser JavaScript, GitHub, Discord, or screenshots.

The `/api/chat` endpoint keeps the existing interface and supports:

- scan evidence as the source of truth
- up to 12 previous conversation messages
- overview, security, privacy, technology, deep, and explain modes
- a safe evidence-based fallback when Gemini is unavailable

After adding the variables, redeploy Vercel. The old `OPENAI_API_KEY` and `OPENAI_MODEL` variables are no longer used.
