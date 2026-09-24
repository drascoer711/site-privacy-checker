import { getUser, supabaseAdmin } from '../lib/auth.js';
import { adminUserResponse, isAdmin, notifyDiscord, redactEmail } from '../lib/admin.js';

function errorResponse(res, error) {
  return res.status(error.status || 500).json({ error: error.message || 'Admin request failed.' });
}

export default async function handler(req, res) {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Please sign in first.' });
    if (!isAdmin(user)) return res.status(403).json({ error: 'Admin access required.' });

    if (req.method === 'GET') {
      const client = supabaseAdmin();
      if (!client) return res.status(503).json({ error: 'Supabase server configuration is missing.' });

      const [{ data: users, error: usersError }, { data: reports, error: reportsError }] = await Promise.all([
        client.auth.admin.listUsers({ page: 1, perPage: 100 }),
        client.from('reports').select('id,user_id,created_at,report').order('created_at', { ascending: false }).limit(100)
      ]);

      if (usersError) throw usersError;
      if (reportsError) throw reportsError;

      const safeUsers = (users?.users || []).map((entry) => ({
        id: entry.id,
        email: redactEmail(entry.email),
        createdAt: entry.created_at,
        lastSignInAt: entry.last_sign_in_at,
        confirmed: Boolean(entry.email_confirmed_at)
      }));

      const safeReports = (reports || []).map((entry) => ({
        id: entry.id,
        userId: entry.user_id,
        url: entry.report?.url || 'Unknown URL',
        risk: entry.report?.risk || null,
        createdAt: entry.created_at
      }));

      return res.status(200).json({
        user: adminUserResponse(user),
        totals: { users: safeUsers.length, reports: safeReports.length },
        users: safeUsers,
        reports: safeReports
      });
    }

    if (req.method === 'POST') {
      const event = String(req.body?.event || 'admin status').slice(0, 80);
      await notifyDiscord(event, {
        'User ID': user.id,
        Email: redactEmail(user.email),
        Admin: 'yes'
      });
      return res.status(200).json({ ok: true, user: adminUserResponse(user) });
    }

    return res.status(405).json({ error: 'Use GET or POST.' });
  } catch (error) {
    console.error('Admin request failed:', error);
    return errorResponse(res, error);
  }
}
