import Link from "next/link";
import UrgencyBadge from "./UrgencyBadge";
import ConfidenceBadge from "./ConfidenceBadge";
import type { PatentDisplayRecord } from "@/lib/types";

function formatDays(days: number): string {
  if (days <= 0) return `${Math.abs(days)}d ago`;
  if (days > 365) return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`;
  return `${days}d`;
}

const TYPE_LABEL: Record<string, string> = {
  UTILITY: "Utility",
  DESIGN: "Design",
  PLANT: "Plant",
};

export default function PatentCard({ patent }: { patent: PatentDisplayRecord }) {
  return (
    <article
      className="border rounded p-5 flex flex-col gap-3 transition-colors hover:border-gray-400"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/patents/${patent.patentId}`}
            className="font-bold text-sm tracking-wide no-underline hover:underline"
            style={{ color: "var(--color-primary)" }}
          >
            {patent.patentId}
          </Link>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: "var(--color-bg)",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
            }}
          >
            {TYPE_LABEL[patent.patentType] ?? patent.patentType}
          </span>
        </div>
        <UrgencyBadge urgency={patent.editorial.urgencyLabel} />
      </div>

      <Link
        href={`/patents/${patent.patentId}`}
        className="no-underline hover:underline"
        style={{ color: "var(--color-text)" }}
      >
        <h3
          className="text-base leading-snug line-clamp-2"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {patent.title}
        </h3>
      </Link>

      <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
        {patent.assignees.join(", ") || "Unassigned"}
      </p>

      <div
        className="flex items-end justify-between pt-3 mt-auto border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div>
          <span
            className="text-lg font-bold tabular-nums"
            style={{
              fontFamily: "var(--font-serif)",
              color: patent.daysUntilExpiration <= 0
                ? "var(--color-expired)"
                : patent.daysUntilExpiration <= 30
                ? "var(--color-critical)"
                : "var(--color-primary)",
            }}
          >
            {formatDays(patent.daysUntilExpiration)}
          </span>
          <span className="text-xs ml-1.5" style={{ color: "var(--color-text-muted)" }}>
            {patent.daysUntilExpiration <= 0 ? "expired" : "remaining"}
          </span>
        </div>
        <ConfidenceBadge confidence={patent.confidence} />
      </div>
    </article>
  );
}
