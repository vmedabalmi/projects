import { notFound } from "next/navigation";
import { getPatentById, getAllPatents } from "@/lib/patents";
import UrgencyBadge from "@/components/UrgencyBadge";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import ExpirationCountdown from "@/components/ExpirationCountdown";
import BreakdownTable from "@/components/BreakdownTable";

const TYPE_LABEL: Record<string, string> = {
  UTILITY: "Utility Patent",
  DESIGN: "Design Patent",
  PLANT: "Plant Patent",
};

export function generateStaticParams() {
  return getAllPatents().map((p) => ({ id: p.patentId }));
}

export default function PatentDetailPage({ params }: { params: { id: string } }) {
  const patent = getPatentById(params.id);
  if (!patent) return notFound();

  return (
    <article className="flex flex-col gap-8">
      {/* Header */}
      <header>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span
            className="text-sm px-2 py-0.5 rounded border"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            {TYPE_LABEL[patent.patentType] ?? patent.patentType}
          </span>
          <UrgencyBadge urgency={patent.editorial.urgencyLabel} />
          <ConfidenceBadge confidence={patent.confidence} />
        </div>

        <h1
          className="text-3xl mb-2"
          style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}
        >
          {patent.patentId}
        </h1>
        <p
          className="text-lg"
          style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
        >
          {patent.title}
        </p>

        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          <span>
            <strong>Filed:</strong> {patent.filingDate}
          </span>
          <span>
            <strong>Granted:</strong> {patent.grantDate}
          </span>
          <span>
            <strong>Assignee:</strong> {patent.assignees.join(", ") || "—"}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          <span>
            <strong>Inventors:</strong> {patent.inventors.join(", ") || "—"}
          </span>
        </div>
        {patent.cpcCodes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {patent.cpcCodes.map((code) => (
              <span
                key={code}
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  backgroundColor: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                {code}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Countdown */}
      <section
        className="border rounded p-6"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
      >
        <ExpirationCountdown
          daysUntilExpiration={patent.daysUntilExpiration}
          expirationDate={patent.expirationDate}
        />
        <p className="text-sm mt-3" style={{ color: "var(--color-text-secondary)" }}>
          {patent.editorial.summary}
        </p>
      </section>

      {/* Breakdown */}
      <section>
        <h2
          className="text-lg mb-4"
          style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
        >
          Expiration Breakdown
        </h2>
        <div
          className="border rounded p-5"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
        >
          <BreakdownTable patent={patent} />
        </div>
      </section>

      {/* Factors */}
      {patent.factors.length > 0 && (
        <section>
          <h2
            className="text-lg mb-4"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
          >
            Adjustment Factors
          </h2>
          <div className="flex flex-col gap-2">
            {patent.factors.map((f, i) => (
              <div
                key={i}
                className="border rounded p-4 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
              >
                <span className="font-semibold" style={{ color: "var(--color-primary)" }}>
                  {f.type}
                </span>
                <span className="ml-2" style={{ color: "var(--color-text-secondary)" }}>
                  {f.description}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lookahead */}
      <section>
        <h2
          className="text-lg mb-4"
          style={{ fontFamily: "var(--font-serif)", color: "var(--color-text)" }}
        >
          Lookahead Timeline
        </h2>
        <div className="flex flex-wrap gap-4">
          {patent.lookahead.map((w) => (
            <div
              key={w.days}
              className="border rounded p-4 flex-1 min-w-[140px] text-center"
              style={{
                borderColor: w.isPastExpiration
                  ? "var(--color-critical)"
                  : "var(--color-border)",
                backgroundColor: w.isPastExpiration ? "#FDF8F0" : "var(--color-bg-card)",
              }}
            >
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                {w.days}d
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                {w.date}
              </p>
              <p
                className="text-xs mt-1 font-medium"
                style={{
                  color: w.isPastExpiration
                    ? "var(--color-critical)"
                    : "var(--color-active)",
                }}
              >
                {w.isPastExpiration ? "Past expiration" : "Still active"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
