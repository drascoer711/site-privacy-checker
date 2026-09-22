import { listReports } from "../lib/report-store.js";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Use GET.' });
  }

  const limit = Number(req.query?.limit || 10);
  const reports = await listReports(Number.isFinite(limit) && limit > 0 ? limit : 10);
  return res.status(200).json({ reports });
}
