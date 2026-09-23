# Safe admin and webhook setup

Add these variables in Vercel → Project → Settings → Environment Variables:

- `ADMIN_EMAILS=cerocekro@gmail.com`
- `DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...`
- `AUTH_SECRET=<long random value>`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`

`ADMIN_EMAILS` is an allowlist for admin-only API actions. It does not expose passwords or let an admin read passwords. Supabase passwords remain managed by Supabase and can only be reset through a reset flow.

The webhook routes send only:

- user ID
- redacted email, such as `c***@gmail.com`
- event name
- admin status
- timestamp

They never send passwords, password hashes, access tokens, refresh tokens, or full authentication responses.

After adding the variables, redeploy Vercel. The authenticated client must send the Supabase access token as:

```http
Authorization: Bearer <supabase-access-token>
```

Use `POST /api/auth-event` after signup/sign-in for safe notifications. Use `GET /api/admin` to check whether the signed-in user matches `ADMIN_EMAILS`.
