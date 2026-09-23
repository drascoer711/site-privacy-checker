import { getUser } from './auth.js';

function configuredAdminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdmin(user) {
  const email = String(user?.email || '').trim().toLowerCase();
  return Boolean(email && configuredAdminEmails().includes(email));
}

export function redactEmail(email = '') {
  const value = String(email || '');
  const [name, domain] = value.split('@');
  if (!name || !domain) return 'unknown';
  return `${name.slice(0, 1)}***@${domain}`;
}

export async function requireAdmin(req) {
  const user = await getUser(req);
  if (!user) {
    const error = new Error('Please sign in first.');
    error.status = 401;
    throw error;
  }
  if (!isAdmin(user)) {
    const error = new Error('Admin access required.');
    error.status = 403;
    throw error;
  }
  return user;
}

export async function notifyDiscord(event, details = {}) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return;

  const fields = Object.entries(details)
    .slice(0, 10)
    .map(([name, value]) => ({
      name: String(name).slice(0, 256),
      value: String(value ?? 'not provided').slice(0, 1024),
      inline: true
    }));

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'Tracecheck',
        embeds: [{
          title: `Tracecheck · ${String(event).slice(0, 200)}`,
          color: 0x7ca7ff,
          fields,
          timestamp: new Date().toISOString(),
          footer: { text: 'No passwords, tokens, or password hashes are sent.' }
        }]
      })
    });
  } catch {
    // Webhook failures must not break authentication or admin requests.
  }
}

export function adminUserResponse(user) {
  return {
    id: user?.id || null,
    email: redactEmail(user?.email || ''),
    isAdmin: isAdmin(user)
  };
}
