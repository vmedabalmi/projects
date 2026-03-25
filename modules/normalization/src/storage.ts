import fs from "fs/promises";
import path from "path";
import type { IngestionPatentRecord, NormalizedPatentRecord } from "./types/index";

const DEFAULT_INGESTION_DIR = path.resolve(
  process.cwd(),
  "..",
  "ingestion",
  "data",
  "merged"
);
const DEFAULT_OUTPUT_DIR = path.resolve(process.cwd(), "data", "normalized");

function getIngestionDir(): string {
  return process.env.NORMALIZATION_INPUT_DIR ?? DEFAULT_INGESTION_DIR;
}

function getOutputDir(): string {
  return process.env.NORMALIZATION_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function atomicWrite(filePath: string, data: string): Promise<void> {
  const tmpPath = filePath.replace(/\.json$/, ".tmp.json");
  await fs.writeFile(tmpPath, data, "utf-8");
  await fs.rename(tmpPath, filePath);
}

/**
 * List all patent IDs available in the ingestion merged directory.
 */
export async function listMergedPatentIds(): Promise<string[]> {
  const dir = getIngestionDir();
  try {
    const files = await fs.readdir(dir);
    return files
      .filter((f) => f.endsWith(".json") && !f.endsWith(".tmp.json"))
      .map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}

/**
 * Read a merged patent record from the ingestion output.
 */
export async function readMergedRecord(
  patentId: string
): Promise<IngestionPatentRecord | null> {
  const filePath = path.join(getIngestionDir(), `${patentId}.json`);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as IngestionPatentRecord;
  } catch {
    return null;
  }
}

/**
 * Write a normalized patent record to the output directory.
 */
export async function writeNormalizedRecord(
  patentId: string,
  record: NormalizedPatentRecord
): Promise<void> {
  const dir = getOutputDir();
  await ensureDir(dir);
  const filePath = path.join(dir, `${patentId}.json`);
  const stamped = { ...record, _normalizedAt: new Date().toISOString() };
  await atomicWrite(filePath, JSON.stringify(stamped, null, 2));
}

/**
 * Read a previously normalized record.
 */
export async function readNormalizedRecord(
  patentId: string
): Promise<NormalizedPatentRecord | null> {
  const filePath = path.join(getOutputDir(), `${patentId}.json`);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as NormalizedPatentRecord;
  } catch {
    return null;
  }
}
