import OpenAI from 'openai';

function fallback(summary) {
  const findings = (summary.findings || []).slice(0, 5).map(f => `${f.name} (${f.severity})`).join(', ') || 'no known signals';
  return `I can explain the evidence from ${summary.url || 'the latest scan'}:\n\nRisk: ${summary.risk?.level || 'unknown'} (${summary.risk?.score || 0})\nFindings: ${findings}\nTechnologies: ${(summary.technologies || []).join(', ') || 'none detected'}\nSecurity headers: ${summary.security?.present || 0}/${summary.security?.total || 0} present\n\nThis is an evidence-based scan and cannot prove what the site stores after receiving data.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const question = String(req.body?.question || '').trim().slice(0, 500);
  const summary = req.body?.summary;
  if (!question || !summary) return res.status(400).json({ error: 'Missing question or scan.' });
  if (!process.env.OPENAI_API_KEY) return res.status(200).json({ answer: fallback(summary) });
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { role: 'system', content: 'You are Tracecheck AI. Answer only from the supplied scan JSON. Explain evidence in plain language. Never invent trackers, data practices, identity, or legal conclusions. Say when information is unavailable.' },
        { role: 'user', content: `Question: ${question}\n\nScan JSON:\n${JSON.stringify(summary).slice(0, 30000)}` }
      ]
    });
    return res.status(200).json({ answer: completion.choices?.[0]?.message?.content || fallback(summary) });
  } catch {
    return res.status(200).json({ answer: fallback(summary) });
  }
}
