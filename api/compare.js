import scanHandler from './scan.js';

function makeMockResponse() {
  let payload;
  let statusCode = 200;

  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    },
    setHeader() {},
    end() {},
    get payload() {
      return payload;
    },
    get statusCode() {
      return statusCode;
    }
  };
}

async function singleScan(url) {
  const req = {
    method: 'POST',
    body: { url },
    headers: { 'user-agent': 'Tracecheck compare' }
  };
  const res = makeMockResponse();
  await scanHandler(req, res);

  if (res.statusCode >= 400 || !res.payload) {
    throw new Error(res.payload?.error || 'Scan failed.');
  }

  return res.payload;
}

function buildComparison(results) {
  const ordered = [...results].sort((a, b) => (b.risk?.score || 0) - (a.risk?.score || 0));
  const winner = ordered[0];
  const winnerLabel = winner?.url || 'Unknown';

  const winnerHealth = winner ? (winner.findings || []).filter((item) => item.category === 'Tracker').length : 0;
  const loserHealth = results.find((site) => site.url !== winner?.url) || null;
  const loserTrackerCount = loserHealth ? (loserHealth.findings || []).filter((item) => item.category === 'Tracker').length : 0;

  const delay = winner && loserHealth
    ? `${winnerLabel} has ${winnerHealth} tracker signals compared with ${loserTrackerCount} on ${loserHealth.url}.`
    : `${winnerLabel} had the higher risk score in this comparison.`;

  return {
    winner: winner?.url || null,
    winnerLabel,
    reason: delay,
    results
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }

  const raw = Array.isArray(req.body?.urls)
    ? req.body.urls
    : [req.body?.leftUrl, req.body?.rightUrl, req.body?.siteA, req.body?.siteB].filter(Boolean);

  const urls = [...new Set(String(raw).split(',').map((value) => String(value).trim()).filter(Boolean))]
    .flatMap((value) => String(value).split(/\s+/).filter(Boolean))
    .filter(Boolean)
    .slice(0, 2);

  if (urls.length < 2) {
    return res.status(400).json({ error: 'Please provide two public website URLs.' });
  }

  try {
    const resultSet = await Promise.all(urls.map((url) => singleScan(url)));
    const comparison = buildComparison(resultSet);
    return res.status(200).json(comparison);
  } catch (error) {
    return res.status(400).json({
      error: error.message || 'Comparison failed.'
    });
  }
}
