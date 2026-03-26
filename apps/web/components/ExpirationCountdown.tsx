interface Props {
  daysUntilExpiration: number;
  expirationDate: string;
}

export default function ExpirationCountdown({ daysUntilExpiration, expirationDate }: Props) {
  const isExpired = daysUntilExpiration <= 0;
  const absDays = Math.abs(daysUntilExpiration);

  const years = Math.floor(absDays / 365);
  const months = Math.floor((absDays % 365) / 30);
  const days = absDays % 30;

  let timeLabel: string;
  if (years > 0) {
    timeLabel = `${years}y ${months}m ${days}d`;
  } else if (months > 0) {
    timeLabel = `${months}m ${days}d`;
  } else {
    timeLabel = `${days} day${days !== 1 ? "s" : ""}`;
  }

  return (
    <div className="flex flex-col">
      <span
        className="text-2xl font-bold tabular-nums"
        style={{
          fontFamily: "var(--font-serif)",
          color: isExpired ? "var(--color-expired)" : "var(--color-primary)",
        }}
      >
        {isExpired ? `−${timeLabel}` : timeLabel}
      </span>
      <span className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
        {isExpired ? `Expired ${expirationDate}` : `Expires ${expirationDate}`}
      </span>
    </div>
  );
}
