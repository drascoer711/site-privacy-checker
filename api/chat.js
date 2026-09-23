function fallback(summary, question = '') {
  const findings = (summary.findings || [])
    .slice(0, 8)
    .map((f) => `${f.name || 'Unknown'} (${f.severity || 'unknown'})`)
    .join(', ') || 'no known signals';
  const technologies = (summary.technologies || []).join(', ') || 'none detected';

  return [
    '## Tracecheck AI Analysis',
    '',
    `**Question:** ${question || 'General scan analysis'}`,
    '',
    `**Risk:** ${summary.risk?.level || 'unknown'} (${summary.risk?.score ?? 'unknown'})`,
    `**Findings:** ${findings}`,
    `**Technologies:** ${technologies}`,
    `**Security headers:** ${summary.security?.present || 0}/${summary.security?.total || 0} present`,
    '',
    'This analysis is based only on the supplied scan evidence. A scan cannot prove what a website stores or does with information after receiving it.'
  ].join('\n');
}

function cleanText(value, max = 30000) {
  try {
    return JSON.stringify(value).slice(0, max);
  } catch {
    return '{}';
  }
}

function buildEvidence(summary) {
  return {
    url: summary.url || null,
    risk: summary.risk || null,
    findings: Array.isArray(summary.findings) ? summary.findings.slice(0, 100) : [],
    technologies: Array.isArray(summary.technologies) ? summary.technologies.slice(0, 100) : [],
    security: summary.security || null,
    trackers: Array.isArray(summary.trackers) ? summary.trackers.slice(0, 100) : [],
    cookies: Array.isArray(summary.cookies) ? summary.cookies.slice(0, 100) : [],
    forms: Array.isArray(summary.forms) ? summary.forms.slice(0, 100) : [],
    requests: Array.isArray(summary.requests) ? summary.requests.slice(0, 200) : [],
    redirects: Array.isArray(summary.redirects) ? summary.redirects.slice(0, 100) : [],
    rawSignals: summary.rawSignals || null
  };
}

const SYSTEM_PROMPT = `
You are Tracecheck AI, an advanced website security and privacy analysis assistant.

Analyze only the supplied website scan evidence. Never invent trackers, cookies, technologies, vulnerabilities, companies, data practices, identities, or legal conclusions.

Clearly distinguish DETECTED (direct evidence), LIKELY (reasonable technical interpretation), and UNKNOWN (not determined by the scan). A third-party request does not prove personal data was sent. A missing security header does not automatically mean the site is vulnerable. Do not call a site safe, malicious, tracking the user, stealing data, or collecting specific information unless the evidence supports that exact conclusion. Never make legal conclusions. Explain technical concepts in plain English and say what information is missing when the question cannot be answered.

Use previous conversation only as context; the current scan evidence remains the source of truth. Be concise for simple questions and detailed for deep-analysis questions. Use useful headings such as Answer, Evidence, What this means, What we cannot tell, and Risk considerations when appropriate.
`;

function normalizeConversation(conversation) {
  if (!Array.isArray(conversation)) return [];
  return conversation
    .slice(-12)
    .map((message) => ({
      role: message?.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(message?.content || '').slice(0, 6000) }]
    }))
    .filter((message) => message.parts[0].text.trim());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }

  const question = String(req.body?.question || '').trim().slice(0, 1000);
  const summary = req.body?.summary;
  const conversation = Array.isArray(req.body?.conversation) ? req.body.conversation : [];
  const mode = String(req.body?.mode || 'deep').toLowerCase();

  if (!question || !summary) {
    return res.status(400).json({ error: 'Missing question or scan.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    return res.status(200).json({ answer: fallback(summary, question), mode, provider: 'fallback' });
  }

  const evidence = buildEvidence(summary);
  const userPrompt = `MODE:\n${mode}\n\nCURRENT QUESTION:\n${question}\n\nCURRENT SCAN EVIDENCE:\n${cleanText(evidence)}\n\nAnswer the user's question using the evidence and conversation context.`;
  const contents = [
    ...normalizeConversation(conversation),
    { role: 'user', parts: [{ text: userPrompt }] }
  ];

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1400
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `Gemini request failed (${response.status})`);
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    return res.status(200).json({
      answer: answer || fallback(summary, question),
      mode,
      provider: 'google-gemini',
      model
    });
  } catch (error) {
    console.error('Tracecheck Gemini error:', error);
    return res.status(200).json({
      answer: fallback(summary, question),
      mode,
      provider: 'fallback',
      error: 'AI analysis temporarily unavailable.'
    });
  }
}
