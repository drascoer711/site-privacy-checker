<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="A privacy-first website scanner for trackers, cookies, fingerprinting signals, and external resources.">
  <title>Tracecheck — See what websites expose</title>
  <style>
    :root{
      color-scheme:dark;
      --bg:#080b16;
      --surface:rgba(18,24,43,.78);
      --surface-2:#151d35;
      --line:rgba(164,180,225,.18);
      --text:#f5f7ff;
      --muted:#9aa8c7;
      --mint:#74f5ca;
      --blue:#7ca7ff;
      --yellow:#ffd166;
      --red:#ff7890;
      --shadow:0 24px 80px rgba(0,0,0,.35)
    }

    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{
      margin:0; min-height:100vh;
      background:
        radial-gradient(900px 500px at 8% -10%, #243d72 0%, transparent 62%),
        radial-gradient(700px 500px at 100% 10%, #173d46 0%, transparent 60%),
        var(--bg);
      color:var(--text);
      font:15px/1.6 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .wrap{max-width:1080px; margin:auto; padding:28px 22px 70px}
    .nav{display:flex; align-items:center; justify-content:space-between; margin-bottom:86px}
    .brand{display:flex; align-items:center; gap:11px; font-weight:800; letter-spacing:-.03em; font-size:1.15rem}
    .logo{
      width:34px; height:34px; display:grid; place-items:center;
      border-radius:11px;
      background:linear-gradient(135deg,var(--mint),var(--blue));
      color:#07101b; box-shadow:0 8px 26px #74f5ca44
    }
    .nav a{color:var(--muted); text-decoration:none}
    .eyebrow{color:var(--mint); font-size:.75rem; letter-spacing:.16em; font-weight:800}
    .hero{max-width:790px}
    .hero h1{
      font-size:clamp(3.2rem,8vw,6.7rem); letter-spacing:-.085em; line-height:.93; margin:16px 0 25px;
      background:linear-gradient(110deg,#fff 20%,#a9c0ff 56%,var(--mint));
      -webkit-background-clip:text; background-clip:text; color:transparent
    }
    .hero .lead{font-size:1.2rem; color:var(--muted); max-width:680px}
    .scan-card{
      margin-top:42px; padding:9px;
      border:1px solid var(--line);
      background:linear-gradient(135deg,rgba(124,167,255,.13),rgba(116,245,202,.06));
      border-radius:20px; box-shadow:var(--shadow); max-width:800px
    }
    .form{
      display:grid; grid-template-columns:1fr 180px; gap:8px;
      background:var(--surface); padding:8px; border-radius:14px
    }
    .form input{
      background:transparent; border:0; outline:0; color:var(--text); font:inherit; padding:13px 14px
    }
    .form input::placeholder{color:#7180a0}
    .form button{
      border:0; border-radius:10px; padding:0 24px; background:var(--mint); color:#07131a;
      font-weight:850; cursor:pointer; transition:.2s transform,.2s filter
    }
    .form button:hover{filter:brightness(1.08); transform:translateY(-1px)}
    .privacy-note{padding:5px 12px 1px; color:var(--muted); font-size:.82rem}
    .small-input{margin-top:8px; display:grid; grid-template-columns:1fr}
    .small-input input{
      width:100%; background:rgba(11,15,26,.8); border:1px solid var(--line); border-radius:10px;
      padding:12px 14px; color:var(--text)
    }
    .grid{display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:90px}
    .feature{
      padding:22px; border:1px solid var(--line); border-radius:16px; background:rgba(15,21,39,.55)
    }
    .feature-icon{font-size:1.5rem}
    .feature h3{margin:12px 0 5px; font-size:1rem}
    .feature p{margin:0; color:var(--muted); font-size:.9rem}
    .result{
      margin-top:28px; padding:28px; border:1px solid var(--line); border-radius:20px;
      background:var(--surface); box-shadow:var(--shadow)
    }
    .hidden{display:none}
    .risk{
      display:flex; align-items:center; gap:12px; font-weight:900; font-size:1.2rem
    }
    .risk-dot{
      width:12px; height:12px; border-radius:50%; background:currentColor; box-shadow:0 0 18px currentColor
    }
    .low{color:var(--mint)}
    .medium{color:var(--yellow)}
    .high{color:var(--red)}
    .result-head{
      display:flex; align-items:center; justify-content:space-between; gap:15px;
      border-bottom:1px solid var(--line); padding-bottom:18px
    }
    .result-head p{color:var(--muted); margin:4px 0 0; word-break:break-all}
    .columns{display:grid; grid-template-columns:1.25fr 1fr; gap:34px}
    .finding{border-top:1px solid var(--line); padding:15px 0}
    .tag{
      display:inline-block; font-size:.7rem; border:1px solid currentColor; border-radius:999px;
      padding:3px 8px; margin-right:8px; text-transform:uppercase; font-weight:800; letter-spacing:.06em
    }
    .finding b{font-size:.95rem}
    .finding p{color:var(--muted); font-size:.86rem; margin:5px 0 0}
    .result h2{font-size:1rem; margin:25px 0 12px}
    .result ul{padding-left:19px; color:var(--muted)}
    .result li{margin:5px 0; word-break:break-word}
    .chip{
      display:inline-block; padding:5px 9px; margin:4px 6px 4px 0; border-radius:999px;
      border:1px solid var(--line); background:rgba(255,255,255,.02); color:var(--text)
    }
    .loading{color:var(--muted); display:flex; align-items:center; gap:10px}
    .spinner{
      width:17px; height:17px; border:2px solid #ffffff33; border-top-color:var(--mint);
      border-radius:50%; animation:spin .8s linear infinite
    }
    .button-row{display:flex; gap:10px; flex-wrap:wrap; margin-top:12px}
    .mini-btn{
      border:1px solid var(--line); background:rgba(255,255,255,.03); color:var(--text);
      padding:8px 12px; border-radius:10px; cursor:pointer
    }
    .hint{color:var(--muted); font-size:.78rem}
    .chat-panel{
      margin-top:28px; border:1px solid var(--line); border-radius:18px; background:rgba(11,15,26,.8);
      padding:20px; box-shadow:var(--shadow)
    }
    .chat-box{
      display:flex; flex-direction:column; gap:12px; min-height:180px; max-height:340px; overflow:auto; padding-right:4px
    }
    .bubble{
      max-width:82%; padding:12px 14px; border-radius:14px; line-height:1.5;
      border:1px solid var(--line); background:rgba(255,255,255,.02)
    }
    .bubble.user{align-self:flex-end; background:rgba(116,245,202,.10)}
    .bubble.ai{align-self:flex-start}
    .chat-form{
      display:grid; grid-template-columns:1fr auto; gap:8px; margin-top:14px
    }
    .chat-form input{
      background:rgba(11,15,26,.8); border:1px solid var(--line); border-radius:10px;
      padding:12px 14px; color:var(--text)
    }
    .chat-form button{
      border:0; border-radius:10px; padding:0 18px; background:var(--blue); color:#09101b; font-weight:800; cursor:pointer
    }
    @keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:700px){
      .nav{margin-bottom:60px}
      .form{grid-template-columns:1fr}
      .form button{height:48px; width:100%}
      .grid, .columns{grid-template-columns:1fr}
      .hero h1{font-size:3.7rem}
      .result-head{display:block}
      .result-head .risk{margin-top:14px}
      .chat-form{grid-template-columns:1fr}
    }
  </style>
</head>
<body>
  <main class="wrap">
    <nav class="nav">
      <div class="brand"><span class="logo">⌁</span> tracecheck</div>
      <a href="https://github.com/drascoer711/site-privacy-checker" target="_blank" rel="noreferrer">View source ↗</a>
    </nav>

    <section class="hero">
      <div class="eyebrow">PRIVACY, MADE VISIBLE</div>
      <h1>See what websites expose.</h1>
      <p class="lead">Scan a public page for trackers, cookies, fingerprinting signals, third-party resources, technologies, and security headers.</p>

      <div class="scan-card">
        <form class="form" id="form">
          <input id="url" type="text" placeholder="Paste a website URL…" autocomplete="url" required>
          <button>Scan website&nbsp; →</button>
        </form>

        <div class="small-input">
          <input id="requester" type="text" placeholder="Your name (optional)" maxlength="80">
        </div>

        <div class="privacy-note">✓ No JavaScript execution &nbsp;·&nbsp; ✓ Private targets blocked &nbsp;·&nbsp; ✓ Optional webhook alerts</div>
      </div>
    </section>

    <section class="grid">
      <article class="feature">
        <div class="feature-icon">◉</div>
        <h3>Tracker signals</h3>
        <p>Find common analytics, ads, session replay, and fingerprinting libraries.</p>
      </article>

      <article class="feature">
        <div class="feature-icon">⌘</div>
        <h3>Evidence first</h3>
        <p>See the exact findings, cookies, headers, and related domains behind the result.</p>
      </article>

      <article class="feature">
        <div class="feature-icon">◈</div>
        <h3>Privacy by design</h3>
        <p>Safe server-side fetching with timeouts, size limits, and SSRF protections.</p>
      </article>
    </section>

    <section id="output" class="result hidden"></section>

    <section id="chat-panel" class="chat-panel hidden">
      <div class="eyebrow">AI PRIVACY CHAT</div>
      <div id="chat-box" class="chat-box"></div>
      <form id="chat-form" class="chat-form">
        <input id="chat-input" type="text" placeholder="Ask about this scan…" autocomplete="off">
        <button type="submit">Ask</button>
      </form>
    </section>
  </main>

  <script>
    const form = document.querySelector("#form");
    const output = document.querySelector("#output");
    const chatPanel = document.querySelector("#chat-panel");
    const chatBox = document.querySelector("#chat-box");
    const chatForm = document.querySelector("#chat-form");
    const chatInput = document.querySelector("#chat-input");

    let currentScan = null;

    function renderRiskClass(level) {
      return level === "high" ? "high" : level === "medium" ? "medium" : "low";
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>\"']/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
      }[m]));
    }

    function addChatMessage(role, text) {
      const bubble = document.createElement("div");
      bubble.className = `bubble ${role}`;
      bubble.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");
      chatBox.appendChild(bubble);
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    function resetChat() {
      chatBox.innerHTML = "";
      addChatMessage("ai", "Ask me about this website scan. I can explain the trackers, cookies, headers, and risk level.");
    }

    async function copyReport(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }

    function prepareChat() {
      chatPanel.classList.remove("hidden");
      resetChat();
    }

    async function askAi(question) {
      if (!currentScan) return;

      addChatMessage("user", question);
      chatInput.value = "";

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            question,
            summary: currentScan
          })
        });

        const data = await response.json();
        const answer = data.answer || "I’m not available right now. Add OPENAI_API_KEY to enable the AI assistant.";
        addChatMessage("ai", answer);
      } catch (error) {
        addChatMessage("ai", "The AI assistant is unavailable right now. Add the API key and try again.");
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      output.classList.remove("hidden");
      output.innerHTML = '<div class="loading"><span class="spinner"></span> Inspecting the page safely…</div>';
      output.scrollIntoView({ behavior: "smooth", block: "center" });

      const url = document.querySelector("#url").value.trim();
      const requester = document.querySelector("#requester").value.trim();

      try {
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url, requester })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "The scan failed.");
        }

        currentScan = {
          url: data.url,
          status: data.status,
          risk: data.risk,
          findings: data.findings,
          externalDomains: data.externalDomains,
          technologies: data.technologies,
          cookies: data.cookies,
          headers: data.headers,
          security: data.security,
          note: data.note
        };

        const riskClass = renderRiskClass(data.risk.level);
        const techHtml = data.technologies && data.technologies.length
          ? data.technologies.map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join("")
          : '<span class="hint">No obvious technologies detected</span>';

        const headerHtml = Object.entries(data.headers || {})
          .map(([key, value]) => `<li><b>${escapeHtml(key)}</b>: ${value ? escapeHtml(value) : "not present"}</li>`)
          .join("") || "<li>No headers recorded</li>";

        const cookieHtml = data.cookies && data.cookies.length
          ? data.cookies.map((cookie) =>
              `<li><b>${escapeHtml(cookie.name)}</b> ${cookie.value ? `(${escapeHtml(cookie.value)})` : ""} · ${cookie.attributes.length ? escapeHtml(cookie.attributes.join(", ")) : "no explicit attributes"}</li>`
            ).join("")
          : "<li>No cookies detected in the response</li>";

        const findingsHtml = data.findings && data.findings.length
          ? data.findings.map((finding) => {
              const cls = renderRiskClass(finding.severity === "high" ? "high" : finding.severity === "medium" ? "medium" : "low");
              return `
                <div class="finding">
                  <span class="tag ${cls}">${escapeHtml(finding.severity)}</span>
                  <b>${escapeHtml(finding.name)}</b>
                  <p>${escapeHtml(finding.category)}: ${escapeHtml(finding.detail)}</p>
                </div>
              `;
            }).join("")
          : '<div class="finding"><p>No known tracking patterns were found in the inspected HTML.</p></div>';

        const reportText = JSON.stringify({
          url: data.url,
          status: data.status,
          risk: data.risk,
          technologies: data.technologies,
          findings: data.findings,
          externalDomains: data.externalDomains,
          cookies: data.cookies,
          headers: data.headers,
          fetchedAt: data.fetchedAt
        }, null, 2);

        output.innerHTML = `
          <div class="result-head">
            <div>
              <div class="eyebrow">SCAN COMPLETE</div>
              <p>${escapeHtml(data.url)}</p>
            </div>
            <div class="risk ${riskClass}">
              <span class="risk-dot"></span>
              ${data.risk.level.toUpperCase()} RISK · ${data.risk.score}
            </div>
          </div>

          <div class="button-row">
            <button class="mini-btn" type="button" data-copy="${escapeHtml(reportText)}">Copy report</button>
            <span class="hint">HTTP ${data.status}${data.truncated ? " · response truncated" : ""}</span>
          </div>

          <div class="columns">
            <div>
              <h2>Findings (${data.findings.length})</h2>
              ${findingsHtml}
            </div>

            <div>
              <h2>Detected technologies</h2>
              ${techHtml}

              <h2>Security headers</h2>
              <div class="hint">${data.security.present}/${data.security.total} present · ${data.security.score}% coverage</div>
              <ul>${headerHtml}</ul>

              <h2>Cookies</h2>
              <ul>${cookieHtml}</ul>

              <h2>Third-party domains</h2>
              <ul>${data.externalDomains && data.externalDomains.length ? data.externalDomains.map((x) => `<li>${escapeHtml(x)}</li>`).join("") : "<li>None detected</li>"}</ul>
            </div>
          </div>
        `;

        const copyButton = output.querySelector("[data-copy]");
        if (copyButton) {
          copyButton.addEventListener("click", async () => {
            const ok = await copyReport(copyButton.dataset.copy || reportText);
            copyButton.textContent = ok ? "Copied!" : "Copy failed";
            setTimeout(() => {
              copyButton.textContent = "Copy report";
            }, 1500);
          });
        }

        prepareChat();

      } catch (error) {
        output.innerHTML = `<div class="risk high"><span class="risk-dot"></span> Scan failed</div><p>${escapeHtml(error.message)}</p>`;
      }
    });

    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = chatInput.value.trim();
      if (!value) return;
      askAi(value);
    });
  </script>
</body>
</html>
