import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const reportsFile = path.join(dataDir, "reports.json");

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(reportsFile);
  } catch {
    await fs.writeFile(reportsFile, "[]", "utf8");
  }
}

export async function saveReport(report) {
  await ensureStore();
  const raw = await fs.readFile(reportsFile, "utf8");
  const list = JSON.parse(raw || "[]");
  const createdAt = new Date().toISOString();
  const entry = {
    id: report.id || crypto.randomUUID(),
    createdAt,
    ...report,
    updatedAt: createdAt
  };

  const existingIndex = list.findIndex((item) => item.id === entry.id);
  if (existingIndex >= 0) {
    list[existingIndex] = entry;
  } else {
    list.unshift(entry);
  }

  await fs.writeFile(reportsFile, JSON.stringify(list, null, 2), "utf8");
  return entry;
}

export async function getReportById(id) {
  await ensureStore();
  const raw = await fs.readFile(reportsFile, "utf8");
  const list = JSON.parse(raw || "[]");
  return list.find((item) => item.id === id) || null;
}

export async function listReports(limit = 10) {
  await ensureStore();
  const raw = await fs.readFile(reportsFile, "utf8");
  const list = JSON.parse(raw || "[]");
  return list.slice(0, limit);
}
