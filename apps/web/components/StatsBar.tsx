interface Props {
  total: number;
  expiringThisMonth: number;
  expired: number;
  critical: number;
}

export default function StatsBar({ total, expiringThisMonth, expired, critical }: Props) {
  const stats = [
    { label: "Patents Tracked", value: total },
    { label: "Expiring This Month", value: expiringThisMonth, highlight: true },
    { label: "Already Expired", value: expired },
    { label: "Critical", value: critical, urgent: true },
  ];

  return (
    <section
      className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 px-6 rounded border"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
    >
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <p
            className="text-2xl font-bold tabular-nums"
            style={{
              fontFamily: "var(--font-serif)",
              color: s.urgent
                ? "var(--color-critical)"
                : s.highlight
                ? "var(--color-primary)"
                : "var(--color-text)",
            }}
          >
            {s.value}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            {s.label}
          </p>
        </div>
      ))}
    </section>
  );
}
