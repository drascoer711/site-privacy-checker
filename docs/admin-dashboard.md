# Admin dashboard

Set this Vercel environment variable:

```text
ADMIN_EMAIL=cerocekro@gmail.com
```

The admin dashboard also accepts the older comma-separated variable for compatibility:

```text
ADMIN_EMAILS=cerocekro@gmail.com
```

Admin access is checked server-side against the authenticated Supabase email. The admin API returns only redacted emails and summary data. It never returns passwords, password hashes, access tokens, or refresh tokens.

Open `/admin.html` after signing in with the configured email.
