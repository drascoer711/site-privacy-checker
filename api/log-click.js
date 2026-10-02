// File: api/log-click.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Missing Webhook URL' });
  }

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

  // FIX: Add a 4-second timeout to prevent Vercel "Execution Exceeded" crashes
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); 

  try {
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!discordRes.ok) {
      console.warn(`[Discord Warning]: API returned ${discordRes.status}. Rate limited?`);
    }
    
    // Always return 200 fast so the frontend doesn't hang
    return res.status(200).json({ success: true });
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("[Webhook Error/Timeout]:", error.message);
    
    // Even if Discord times out, return 200 so Vercel closes the function cleanly
    return res.status(200).json({ success: false, note: "Failed to reach Discord, but function exited cleanly." });
  }
}
