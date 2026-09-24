export function getScanRecommendations(report = {}) {
  const findings = Array.isArray(report.findings) ? report.findings : [];
  const recommendations = [
    'Reduce third-party analytics and ad scripts.',
    'Review cookie lifetime and consent handling.',
    'Add or improve security headers to reduce exposure.',
    'Minimize fingerprinting surface area and device tracking.'
  ];

  if (findings.some((item) => String(item.category).toLowerCase().includes('tracker'))) {
    recommendations.unshift('Remove or reduce unnecessary tracking scripts to lower privacy risk.');
  }

  if (findings.some((item) => String(item.category).toLowerCase().includes('cookie'))) {
    recommendations.unshift('Audit cookie behavior and remove non-essential third-party cookies.');
  }

  if (findings.some((item) => String(item.category).toLowerCase().includes('header'))) {
    recommendations.unshift('Tighten HTTP security headers such as HSTS, X-Frame-Options, and CSP.');
  }

  return recommendations.slice(0, 4);
}
