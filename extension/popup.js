const API = 'https://site-privacy-checker.vercel.app/api/history';
const APP = 'https://site-privacy-checker.vercel.app';
const $ = (selector) => document.querySelector(selector);
let activeUrl = '';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function setStatus(message, error = false) {
  $('#status').textContent = message;
  $('#status').className = error ? 'status error' : 'status';
}

function render(report) {
  const level = String(report.risk?.level || 'low').toLowerCase();
  const findings = (report.findings || []).slice(0, 5);
  $('#result').hidden = false;
  $('#result').innerHTML = `
    <span class="risk ${escapeHtml(level)}">${escapeHtml(level)} risk · ${report.risk?.score ?? 0}</span>
    <div class="grid">
      <div class="metric"><b>${report.findings?.length || 0}</b><span>signals</span></div>
      <div class="metric"><b>${report.externalDomains?.length || 0}</b><span>3rd parties</span></div>
      <div class="metric"><b>${report.cookies?.length || 0}</b><span>cookies</span></div>
      <div class="metric"><b>${report.security?.present || 0}/${report.security?.total || 0}</b><span>security headers</span></div>
    </div>
    <ul class="findings">${findings.length ? findings.map((item) => `<li class="finding ${escapeHtml(item.severity || 'medium')}">${escapeHtml(item.name || 'Signal')} <small>(${escapeHtml(item.severity || 'unknown')})</small></li>`).join('') : '<li class="finding">No matching signals found in the page source.</li>'}</ul>
  `;
}

async function scan() {
  if (!activeUrl || !/^https?:\/\//i.test(activeUrl)) {
    setStatus('This page cannot be scanned. Open a public HTTP(S) page.', true);
    return;
  }

  $('#scan').disabled = true;
  $('#result').hidden = true;
  setStatus('Inspecting page source and headers…');
  try {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: activeUrl, requester: 'Tracecheck browser extension' })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Scan failed.');
    render(data);
    setStatus('Scan complete.');
    chrome.storage.local.set({ lastReport: data });
  } catch (error) {
    setStatus(error.message || 'Could not scan this page.', true);
  } finally {
    $('#scan').disabled = false;
  }
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  activeUrl = tabs[0]?.url || '';
  $('#url').textContent = activeUrl || 'No active page found';
  $('#report').href = `${APP}/?url=${encodeURIComponent(activeUrl)}`;
  $('#scan').addEventListener('click', scan);
});
