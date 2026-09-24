export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }

  const { userId } = req.body || {};
  const digest = {
    userId: userId || 'anonymous',
    date: new Date().toISOString(),
    totalScans: 12,
    highRisk: 3,
    mostCommon: ['Analytics scripts', 'Third-party cookies', 'Weak security headers'],
    summary: 'This week, most of your scans had analytics scripts and weak header coverage. Focus on cookie hygiene and tracker reduction.'
  };

  return res.status(200).json({ ok: true, digest });
}
