export default async function handler(req, res) {
  const method = req.method || 'GET';

  if (method === 'GET') {
    return res.status(200).json({
      ok: true,
      settings: {
        weeklyDigest: true,
        highRiskAlerts: true,
        browserSync: true,
        autoSave: true
      }
    });
  }

  if (method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const { action, payload = {} } = req.body || {};

  switch (action) {
    case 'save-settings': {
      return res.status(200).json({
        ok: true,
        settings: {
          ...payload,
          updatedAt: new Date().toISOString()
        }
      });
    }

    case 'save-scan': {
      const { url, risk, findings, fetchedAt } = payload;
      if (!url) return res.status(400).json({ ok: false, error: 'URL is required.' });

      return res.status(200).json({
        ok: true,
        saved: {
          id: `scan_${Date.now()}`,
          url,
          risk: risk || { level: 'unknown', score: 0 },
          findings: Array.isArray(findings) ? findings : [],
          fetchedAt: fetchedAt || new Date().toISOString()
        }
      });
    }

    case 'favorite': {
      const { url } = payload;
      if (!url) return res.status(400).json({ ok: false, error: 'URL is required.' });

      return res.status(200).json({
        ok: true,
        favorite: {
          url,
          createdAt: new Date().toISOString()
        }
      });
    }

    case 'weekly-digest': {
      return res.status(200).json({
        ok: true,
        digest: {
          totalScans: 12,
          highRisk: 3,
          summary: 'Most of your scans had tracker and cookie issues. Focus on reducing third-party scripts and tightening security headers.',
          topIssues: [
            'Third-party analytics scripts',
            'Cookie risk',
            'Missing security headers'
          ]
        }
      });
    }

    case 'extension-sync': {
      const { url } = payload;
      return res.status(200).json({
        ok: true,
        synced: Boolean(url),
        url: url || null,
        message: 'Browser scan synced to the user dashboard.'
      });
    }

    default:
      return res.status(400).json({ ok: false, error: 'Unsupported action.' });
  }
}
