import { getReportById } from "../lib/report-store.js";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Use GET.' });
  }

  const { id } = req.query || {};
  if (!id) {
    return res.status(400).json({ error: 'Missing report id.' });
  }

  const report = await getReportById(String(id));
  if (!report) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  return res.status(200).json(report);
}
