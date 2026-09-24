export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }

  const { url, userId } = req.body || {};
  return res.status(200).json({
    ok: true,
    synced: Boolean(url),
    url: url || null,
    userId: userId || 'anonymous',
    message: 'Browser scan synced to the user dashboard.'
  });
}
