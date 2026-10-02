// File: api/log-click.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Missing Webhook URL' });
  }

  // Safely extract IP and basic headers
  const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'Unknown IP';
  const userAgent = req.headers['user-agent'] || 'Unknown Device';
  const referer = req.headers['referer'] || 'Direct/Unknown';

  const payload = {
    embeds: [{
      title: "🖱️ Unique Scan Triggered",
      color: 0x5865F2,
      fields: [
        { name: "IP Address", value: `\`${ip}\``, inline: true },
        { name: "Source Page", value: `\`${referer}\``, inline: true },
        { name: "User Agent", value: `\`${userAgent}\``, inline: false }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  try {
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!discordRes.ok) throw new Error(`Discord Error: ${discordRes.status}`);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Webhook Error]:", error.message);
    return res.status(500).json({ error: 'Failed to deliver webhook.' });
  }
}
