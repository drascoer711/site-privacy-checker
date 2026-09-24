export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }

  const { url, userId, favorite = false, save = true } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL is required.' });

  const record = {
    id: `scan_${Date.now()}`,
    url,
    userId: userId || 'anonymous',
    favorite: Boolean(favorite),
    saved: Boolean(save),
    createdAt: new Date().toISOString()
  };

  return res.status(200).json({ ok: true, scan: record, message: 'Saved scan stored.' });
}
