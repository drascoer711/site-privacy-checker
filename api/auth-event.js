import { getUser } from '../lib/auth.js';
import { notifyDiscord, redactEmail } from '../lib/admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Please sign in first.' });

  const event = String(req.body?.event || 'account event').slice(0, 80);
  await notifyDiscord(event, {
    'User ID': user.id,
    'Email': redactEmail(user.email)
  });

  return res.status(200).json({ ok: true });
}
