# Tracecheck browser extension

The extension scans the active Chrome/Edge tab with one click and shows:

- risk level and score
- tracker and fingerprinting signals
- cookies
- third-party domains
- security-header coverage
- top findings

## Install locally

1. Deploy the Tracecheck site.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select this `extension` folder.
6. Pin Tracecheck, open a public website, and click the extension icon.

The extension currently uses:

```text
https://site-privacy-checker.vercel.app/api/history
```

If your deployed domain is different, replace the `API` and `APP` constants in `extension/popup.js` and the host permission in `extension/manifest.json`.

The scan is server-side and inspects HTML plus response headers. It does not execute the target page's JavaScript inside the extension.
