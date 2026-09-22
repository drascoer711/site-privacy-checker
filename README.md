<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tracecheck — Saved report</title>
  <style>
    :root { color-scheme: dark; --bg: #080b16; --surface: rgba(18,24,43,.78); --line: rgba(164,180,225,.18); --text: #f5f7ff; --muted: #9aa8c7; --mint: #74f5ca; --yellow: #ffd166; --red: #ff7890; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: radial-gradient(900px 500px at 8% -10%, #243d72 0%, transparent 62%), radial-gradient(700px 500px at 100% 10%, #173d46 0%, transparent 60%), var(--bg); color: var(--text); font: 15px/1.6 Inter, ui-sans-serif, system-ui, sans-serif; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 32px 20px 80px; }
    .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .brand { display: flex; gap: 12px; align-items: center; font-weight: 800; }
    .logo { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 11px; background: linear-gradient(135deg, var(--mint), #7ca7ff); color: #07101b; }
    .panel { border: 1px solid var(--line); background: rgba(18,24,43,.78); border-radius: 18px; padding: 24px; }
    .risk { display: inline-flex; align-items: center; gap: 10px; font-weight: 900; font-size: 1.2rem; }
    .risk-dot { width: 12px; height: 12px; border-radius: 50%; background: currentColor; box-shadow: 0 0 18px currentColor; }
    .low { color: var(--mint); }
    .medium { color: var(--yellow); }
    .high { color: var(--red); }
    .meta { color: var(--muted); margin-top: 10px; }
    .grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; margin-top: 22px; }
    .tag { display: inline-block; padding: 4px 8px; border-radius: 999px; border: 1px solid var(--line); }
    ul { color: var(--muted); padding-left: 18px; }
    li { margin: 6px 0; }
    .chip { display: inline-block; padding: 5px 8px; border-radius: 999px; border: 1px solid var(--line); margin: 4px 6px 4px 0; }
    a { color: var(--mint); }
    .muted { color: var(--muted); }
    @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="wrap">
    <div class="topbar">
      <div class="brand"><span class="logo">⌁</span> tracecheck</div>
      <a href="/" class="muted">Back to scanner</a>
    </div>
    <section id="report-panel" class="panel">
      <div id="report-content">Loading report…</div>
    </section>
  </main>

  <script>
    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
    }

    function renderRiskClass(level) {
      return level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'low';
    }

    async function loadReport() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      const root = document.querySelector('#report-content');
      if (!id) {
        root.innerHTML = '<p class="muted">No report id provided.</p>';
        return;
      }

      try {
        const response = await fetch(`/api/report?id=${encodeURIComponent(id)}`);
        const report = await response.json();
        if (!response.ok) throw new Error(report.error || 'Report not found');

        const lvlClass = renderRiskClass(report.risk?.level || 'low');
        const findings = (report.findings || []).map((item) => `
          <div style="border-top: 1px solid rgba(164,180,225,.18); padding: 14px 0;">
            <span class="tag ${lvlClass}">${escapeHtml(item.severity || 'low')}</span>
            <b>${escapeHtml(item.name || 'Finding')}</b>
            <p class="muted">${escapeHtml(item.category || 'Unknown')} · ${escapeHtml(item.detail || '')}</p>
          </div>
        `).join('') || '<p class="muted">No findings recorded.</p>';

        const tech = (report.technologies || []).map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join('') || '<span class="muted">No technologies detected</span>';
        const headers = Object.entries(report.headers || {}).map(([key, value]) => `<li><b>${escapeHtml(key)}</b>: ${value ? escapeHtml(value) : 'not present'}</li>`).join('') || '<li>None recorded</li>';
        const cookies = (report.cookies || []).map((cookie) => `<li><b>${escapeHtml(cookie.name)}</b> ${cookie.value ? `(${escapeHtml(cookie.value)})` : ''} · ${cookie.attributes.length ? escapeHtml(cookie.attributes.join(', ')) : 'no explicit attributes'}</li>`).join('') || '<li>No cookies recorded.</li>';
        const domains = (report.externalDomains || []).length ? report.externalDomains.map((d) => `<li>${escapeHtml(d)}</li>`).join('') : '<li>None detected</li>';

        root.innerHTML = `
          <div class="risk ${lvlClass}"><span class="risk-dot"></span>${escapeHtml((report.risk?.level || 'low').toUpperCase())} RISK · ${escapeHtml(report.risk?.score || 0)}</div>
          <div class="meta">${escapeHtml(report.url)}</div>
          <div class="meta">Scanned: ${new Date(report.fetchedAt || report.createdAt).toLocaleString()}</div>
          <div class="grid">
            <div>
              <h2>Findings</h2>
              ${findings}
            </div>
            <div>
              <h2>Detected technologies</h2>
              ${tech}
              <h2>Security headers</h2>
              <div class="muted">${report.security?.present || 0}/${report.security?.total || 0} present · ${report.security?.score || 0}% coverage</div>
              <ul>${headers}</ul>
              <h2>Cookies</h2>
              <ul>${cookies}</ul>
              <h2>Third-party domains</h2>
              <ul>${domains}</ul>
            </div>
          </div>
        `;
      } catch (error) {
        root.innerHTML = `<p class="muted">${escapeHtml(error.message || 'Unable to load report.')}</p>`;
      }
    }

    loadReport();
  </script>
</body>
</html>
