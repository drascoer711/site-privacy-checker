import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseAdmin() {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function getUser(req) {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const client = supabaseAdmin();
  if (!client) return null;
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}

export function requireUser(user) {
  if (!user) {
    const error = new Error('Please sign in to save scans and use your personal dashboard.');
    error.status = 401;
    throw error;
  }
  return user;
}
