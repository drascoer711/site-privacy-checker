import { getUser, supabaseAdmin } from '../lib/auth.js';
import { adminUserResponse, isAdmin, notifyDiscord, redactEmail } from '../lib/admin.js';

export default async function handler(req, res) {
  const user = await getUser(req);

  if (req.method === 'GET') {
    if (!user) return res.status(401).json({ error: 'Please sign in first.' });
    return res.status(200).json({ user: adminUserResponse(user) });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use GET or POST.' });
  }

  if (!user) return res.status(401).json({ error: 'Please sign in first.' });

  const event = String(req.body?.event || 'account event').slice(0, 80);
  await notifyDiscord(event, {
    'User ID': user.id,
    'Email': redactEmail(user.email),
    'Admin': isAdmin(user) ? 'yes' : 'no'
  });

  if (!isAdmin(user)) {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  if (event !== 'admin status') {
    return res.status(200).json({ ok: true, user: adminUserResponse(user) });
  }

  const client = supabaseAdmin();
  if (!client) {
    return res.status(503).json({ error: 'Supabase server configuration is missing.' });
  }

  return res.status(200).json({
    ok: true,
    user: adminUserResponse(user),
    message: 'Admin access is enabled. Passwords are never readable or recoverable by admins.'
  });
}
