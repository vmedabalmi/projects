import fs from "fs/promises";
import path from "path";
import type { SourceName, PatentRecord } from "./types/index";

const DATA_ROOT = path.resolve(process.cwd(), "data");

function rawDir(source: SourceName): string {
  return path.join(DATA_ROOT, "raw", source);
}

function mergedDir(): string {
  return path.join(DATA_ROOT, "merged");
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function atomicWrite(filePath: string, data: string): Promise<void> {
  const tmpPath = filePath.replace(/\.json$/, ".tmp.json");
  await fs.writeFile(tmpPath, data, "utf-8");
  await fs.rename(tmpPath, filePath);
}

function stampRecord(record: Record<string, unknown>): Record<string, unknown> {
  return { ...record, _fetchedAt: new Date().toISOString() };
}

export async function writeRawRecord(
  source: SourceName,
  patentId: string,
  record: unknown
): Promise<void> {
  const dir = rawDir(source);
  await ensureDir(dir);
  const filePath = path.join(dir, `${patentId}.json`);
  const stamped = stampRecord(record as Record<string, unknown>);
  await atomicWrite(filePath, JSON.stringify(stamped, null, 2));
}

export async function readRawRecord(
  source: SourceName,
  patentId: string
): Promise<unknown | null> {
  const filePath = path.join(rawDir(source), `${patentId}.json`);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function writeMergedRecord(
  patentId: string,
  record: Partial<PatentRecord>
): Promise<void> {
  const dir = mergedDir();
  await ensureDir(dir);
  const filePath = path.join(dir, `${patentId}.json`);
  const stamped = stampRecord(record as unknown as Record<string, unknown>);
  await atomicWrite(filePath, JSON.stringify(stamped, null, 2));
}

export async function readMergedRecord(
  patentId: string
): Promise<Partial<PatentRecord> | null> {
  const filePath = path.join(mergedDir(), `${patentId}.json`);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as Partial<PatentRecord>;
  } catch {
    return null;
  }
}
