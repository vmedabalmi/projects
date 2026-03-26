import fs from "fs/promises";
import path from "path";
import type { PatentRecord } from "@patentproject/expiration";
import type { ExpirationPipelineResult } from "./types";

const DEFAULT_INPUT_DIR = path.resolve(
  process.cwd(),
  "..",
  "normalization",
  "data",
  "normalized"
);
const DEFAULT_OUTPUT_DIR = path.resolve(process.cwd(), "data", "expiration");

function getInputDir(): string {
  return process.env.EXPIRATION_INPUT_DIR ?? DEFAULT_INPUT_DIR;
}

function getOutputDir(): string {
  return process.env.EXPIRATION_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR;
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
 * List all patent IDs in the normalization output directory.
 */
export async function listNormalizedPatentIds(): Promise<string[]> {
  const dir = getInputDir();
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
 * Read a normalized patent record.
 */
export async function readNormalizedRecord(
  patentId: string
): Promise<PatentRecord | null> {
  const filePath = path.join(getInputDir(), `${patentId}.json`);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as PatentRecord;
  } catch {
    return null;
  }
}

/**
 * Write an expiration pipeline result.
 */
export async function writeExpirationResult(
  patentId: string,
  result: ExpirationPipelineResult
): Promise<void> {
  const dir = getOutputDir();
  await ensureDir(dir);
  const filePath = path.join(dir, `${patentId}.json`);
  const stamped = { ...result, _calculatedAt: new Date().toISOString() };
  await atomicWrite(filePath, JSON.stringify(stamped, null, 2));
}
