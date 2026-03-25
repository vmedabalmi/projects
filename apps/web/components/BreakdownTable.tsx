import type { PatentDisplayRecord } from "@/lib/types";

export default function BreakdownTable({ patent }: { patent: PatentDisplayRecord }) {
  const rows: { label: string; value: string; note?: string }[] = [
    {
      label: "Base term",
      value: `${patent.filingDate} + 20 years`,
      note: `Expires ${patent.baseExpirationDate}`,
    },
  ];

  if (patent.ptaDays > 0) {
    rows.push({
      label: "Patent Term Adjustment (PTA)",
      value: `+${patent.ptaDays} days`,
    });
  }

  if (patent.pteDays > 0) {
    rows.push({
      label: "Patent Term Extension (PTE)",
      value: `+${patent.pteDays} days`,
    });
  }

  if (patent.terminalDisclaimer) {
    rows.push({
      label: "Terminal Disclaimer",
      value: "Filed",
      note: "Expiration may be tied to parent patent",
    });
  }

  rows.push({
    label: "Maintenance fees",
    value: patent.maintenanceFeeExpired ? "Lapsed" : "Current",
    note: patent.maintenanceFeeExpired ? "Patent expired due to non-payment" : undefined,
  });

  if (patent.adjustedDays !== 0) {
    rows.push({
      label: "Net adjustment",
      value: `${patent.adjustedDays > 0 ? "+" : ""}${patent.adjustedDays} days`,
    });
  }

  rows.push({
    label: "Final expiration",
    value: patent.expirationDate,
  });

  return (
    <table className="w-full text-sm">
      <thead>
        <tr
          className="border-b text-left"
          style={{ borderColor: "var(--color-border-strong)" }}
        >
          <th className="py-2 font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Factor
          </th>
          <th className="py-2 font-semibold text-right" style={{ color: "var(--color-text-muted)" }}>
            Value
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.label}
            className="border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <td className="py-2.5">
              <span style={{ color: "var(--color-text)" }}>{row.label}</span>
              {row.note && (
                <span
                  className="block text-xs mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {row.note}
                </span>
              )}
            </td>
            <td
              className="py-2.5 text-right font-medium tabular-nums"
              style={{ color: "var(--color-primary)" }}
            >
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
