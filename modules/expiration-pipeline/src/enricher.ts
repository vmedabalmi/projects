import type { ExpirationResult } from "@patentproject/expiration";
import { ExpirationConfidence } from "@patentproject/expiration";
import type { UrgencyLabel, Editorial } from "./types";

const MS_PER_DAY = 86_400_000;

function dateToString(date: Date | string): string {
  if (typeof date === "string") return date;
  return date.toISOString().split("T")[0];
}

/**
 * Calculate days from today until the expiration date.
 * Negative means already expired.
 */
export function calculateDaysUntilExpiration(
  expirationDate: string | Date,
  now?: Date
): number {
  const today = now ?? new Date();
  const expDate = typeof expirationDate === "string" ? new Date(expirationDate) : expirationDate;
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const expMidnight = new Date(
    expDate.getFullYear(),
    expDate.getMonth(),
    expDate.getDate()
  );
  return Math.round(
    (expMidnight.getTime() - todayMidnight.getTime()) / MS_PER_DAY
  );
}

/**
 * Determine urgency label based on days until expiration and confidence.
 */
export function determineUrgencyLabel(
  daysUntilExpiration: number,
  confidence: string
): UrgencyLabel {
  if (confidence === ExpirationConfidence.INDETERMINATE) {
    return "INDETERMINATE";
  }
  if (daysUntilExpiration <= 0) {
    return "EXPIRED";
  }
  if (daysUntilExpiration <= 30) {
    return "CRITICAL";
  }
  if (daysUntilExpiration <= 90) {
    return "WARNING";
  }
  if (daysUntilExpiration <= 365) {
    return "UPCOMING";
  }
  return "ACTIVE";
}

/**
 * Generate a human-readable summary for the expiration status.
 */
export function generateSummary(
  patentId: string,
  daysUntilExpiration: number,
  urgencyLabel: UrgencyLabel,
  expirationDate: string
): string {
  switch (urgencyLabel) {
    case "EXPIRED":
      return `Patent ${patentId} expired on ${expirationDate} (${Math.abs(daysUntilExpiration)} days ago)`;
    case "CRITICAL":
      return `Patent ${patentId} expires in ${daysUntilExpiration} days on ${expirationDate} — immediate action required`;
    case "WARNING":
      return `Patent ${patentId} expires in ${daysUntilExpiration} days on ${expirationDate} — action recommended`;
    case "UPCOMING":
      return `Patent ${patentId} expires in ${daysUntilExpiration} days on ${expirationDate}`;
    case "ACTIVE":
      return `Patent ${patentId} is active, expiring on ${expirationDate} (${daysUntilExpiration} days remaining)`;
    case "INDETERMINATE":
      return `Patent ${patentId} expiration cannot be determined with confidence`;
  }
}

/**
 * Build the editorial section from an expiration result.
 */
export function buildEditorial(
  result: ExpirationResult,
  now?: Date
): { editorial: Editorial; daysUntilExpiration: number } {
  const expDateStr = dateToString(result.expirationDate);
  const daysUntilExpiration = calculateDaysUntilExpiration(
    result.expirationDate,
    now
  );
  const urgencyLabel = determineUrgencyLabel(
    daysUntilExpiration,
    result.confidence
  );
  const summary = generateSummary(
    result.patentId,
    daysUntilExpiration,
    urgencyLabel,
    expDateStr
  );

  return {
    editorial: { urgencyLabel, summary },
    daysUntilExpiration,
  };
}
