import { getAllPatents, getStats } from "@/lib/patents";
import PatentCard from "@/components/PatentCard";
import StatsBar from "@/components/StatsBar";
import UrgencyBadge from "@/components/UrgencyBadge";
import type { UrgencyLabel } from "@/lib/types";

const URGENCY_ORDER: UrgencyLabel[] = ["CRITICAL", "WARNING", "UPCOMING", "ACTIVE", "EXPIRED"];

export default function HomePage() {
  const patents = getAllPatents();
  const stats = getStats();

  // Feature the most urgent non-expired patent
  const featured = patents
    .filter((p) => p.daysUntilExpiration > 0)
    .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration)[0];

  // Group remaining by urgency
  const grouped = URGENCY_ORDER.map((urgency) => ({
    urgency,
    patents: patents
      .filter((p) => p.editorial.urgencyLabel === urgency && p.patentId !== featured?.patentId)
      .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration),
  })).filter((g) => g.patents.length > 0);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
          Patent Expirations
        </h1>
        <p className="mt-2 text-base" style={{ color: "var(--color-text-secondary)" }}>
          Monitoring USPTO patent terms, maintenance fees, and adjustments.
          When patents expire, their innovations enter the public domain.
        </p>
      </section>

      <StatsBar {...stats} />

      {featured && (
        <section
          className="border rounded p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-critical)" }}
            >
              Expiring Soon
            </span>
            <UrgencyBadge urgency={featured.editorial.urgencyLabel} />
          </div>
          <h2
            className="text-xl mb-2"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            <a
              href={`/patents/${featured.patentId}`}
              style={{ color: "var(--color-text)" }}
            >
              {featured.title}
            </a>
          </h2>
          <div className="flex flex-wrap items-baseline gap-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <span className="font-medium" style={{ color: "var(--color-primary)" }}>
              {featured.patentId}
            </span>
            <span>{featured.assignees.join(", ")}</span>
            <span>
              Expires{" "}
              <strong>{featured.expirationDate}</strong>
              {" "}({featured.daysUntilExpiration} days)
            </span>
          </div>
        </section>
      )}

      {grouped.map((group) => (
        <section key={group.urgency}>
          <div className="flex items-center gap-3 mb-4">
            <h2
              className="text-lg"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
            >
              {group.urgency === "EXPIRED" ? "Recently Expired" : group.urgency.charAt(0) + group.urgency.slice(1).toLowerCase()}
            </h2>
            <span className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>
              {group.patents.length} patent{group.patents.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.patents.map((p) => (
              <PatentCard key={p.patentId} patent={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
