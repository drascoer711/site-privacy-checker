import OpenAI from "openai";

function fallbackAnswer(summary) {
  const findings = summary.findings || [];
  const top = findings.slice(0, 3).map((f) => `${f.name} (${f.severity})`).join(', ') || 'no obvious tracker signals';
  const risk = summary.risk?.level || 'low';

  return `I’m running in fallback mode because no OpenAI key is configured. Based on the latest scan of ${summary.url || 'this site'}:\n\n- Risk level: ${risk}\n- Findings: ${top}\n- Technologies: ${(summary.technologies || []).join(', ') || 'not detected'}\n- Security headers present: ${summary.security?.present || 0}/${summary.security?.total || 0}\n\nThis suggests the page may be doing some tracking or may be missing privacy protections. The scan is evidence-based and not a final security verdict.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }

  const { question, summary } = req.body || {};

  if (!question || !summary) {
    return res.status(400).json({ error: 'Missing question or summary.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ answer: fallbackAnswer(summary) });
  }

  try {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: false });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const systemPrompt = `You are Tracecheck AI. Explain the privacy findings using only the scan data provided. Do not claim things that are not present in the summary. Mention evidence and talk in plain English. Keep answers concise but useful. If data is missing, say it clearly.`;

    const userPrompt = `Question: ${question}\n\nScan summary:\n${JSON.stringify(summary, null, 2)}`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const answer = completion.choices?.[0]?.message?.content || fallbackAnswer(summary);
    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(200).json({ answer: `The AI assistant could not complete the request. Fallback analysis: ${fallbackAnswer(summary)}` });
  }
}
