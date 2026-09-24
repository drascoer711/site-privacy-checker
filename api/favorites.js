export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }

  const { favorites = [], userId } = req.body || {};
  return res.status(200).json({
    ok: true,
    favorites: favorites.map((item, index) => ({
      id: `fav_${Date.now()}_${index}`,
      userId: userId || 'anonymous',
      url: String(item || '').trim(),
      createdAt: new Date().toISOString()
    }))
  });
}
