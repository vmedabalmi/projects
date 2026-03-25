import fs from "fs";
import path from "path";
import type { PatentDisplayRecord, UrgencyLabel, PatentType } from "./types";

const PIPELINE_DIR = path.resolve(
  process.cwd(),
  "..",
  "..",
  "modules",
  "expiration-pipeline",
  "data",
  "expiration"
);

const NORMALIZED_DIR = path.resolve(
  process.cwd(),
  "..",
  "..",
  "modules",
  "normalization",
  "data",
  "normalized"
);

function readPipelinePatents(): PatentDisplayRecord[] {
  const records: PatentDisplayRecord[] = [];

  try {
    const files = fs.readdirSync(PIPELINE_DIR).filter(
      (f) => f.endsWith(".json") && !f.endsWith(".tmp.json")
    );

    for (const file of files) {
      try {
        const pipelineData = JSON.parse(
          fs.readFileSync(path.join(PIPELINE_DIR, file), "utf-8")
        );

        let normalizedData: Record<string, unknown> = {};
        const normalizedPath = path.join(NORMALIZED_DIR, file);
        if (fs.existsSync(normalizedPath)) {
          normalizedData = JSON.parse(
            fs.readFileSync(normalizedPath, "utf-8")
          );
        }

        records.push({
          ...pipelineData,
          title: (normalizedData.title as string) ?? pipelineData.patentId,
          patentType: (normalizedData.patentType as PatentType) ?? "UTILITY",
          filingDate: (normalizedData.filingDate as string) ?? "",
          grantDate: (normalizedData.grantDate as string) ?? "",
          assignees: (normalizedData.assignees as string[]) ?? [],
          inventors: (normalizedData.inventors as string[]) ?? [],
          cpcCodes: (normalizedData.cpcCodes as string[]) ?? [],
          ptaDays: (normalizedData.pta as { totalPTADays: number })?.totalPTADays ?? 0,
          pteDays: (normalizedData.pte as { extensionDays: number })?.extensionDays ?? 0,
          terminalDisclaimer: (normalizedData.terminalDisclaimer as boolean) ?? false,
          maintenanceFeeExpired:
            (normalizedData.maintenanceFees as { expired: boolean })?.expired ?? false,
        });
      } catch {
        // skip malformed files
      }
    }
  } catch {
    // pipeline dir doesn't exist yet
  }

  return records;
}

export function getAllPatents(): PatentDisplayRecord[] {
  return readPipelinePatents();
}

export function getPatentById(id: string): PatentDisplayRecord | undefined {
  return getAllPatents().find((p) => p.patentId === id);
}

export function getExpiringWithin(days: number): PatentDisplayRecord[] {
  return getAllPatents()
    .filter((p) => p.daysUntilExpiration > 0 && p.daysUntilExpiration <= days)
    .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
}

export function getByUrgency(urgency: UrgencyLabel): PatentDisplayRecord[] {
  return getAllPatents().filter(
    (p) => p.editorial.urgencyLabel === urgency
  );
}

export function getStats(): {
  total: number;
  expiringThisMonth: number;
  expired: number;
  critical: number;
} {
  const all = getAllPatents();
  return {
    total: all.length,
    expiringThisMonth: all.filter(
      (p) => p.daysUntilExpiration > 0 && p.daysUntilExpiration <= 30
    ).length,
    expired: all.filter((p) => p.editorial.urgencyLabel === "EXPIRED").length,
    critical: all.filter((p) => p.editorial.urgencyLabel === "CRITICAL").length,
  };
}
