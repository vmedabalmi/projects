import type { UrgencyLabel } from "@/lib/types";

const LABELS: Record<UrgencyLabel, string> = {
  CRITICAL: "Critical",
  WARNING: "Warning",
  EXPIRED: "Expired",
  ACTIVE: "Active",
  UPCOMING: "Upcoming",
  INDETERMINATE: "Unknown",
};

export default function UrgencyBadge({ urgency }: { urgency: UrgencyLabel }) {
  return (
    <span className={`badge badge-${urgency}`}>
      {LABELS[urgency]}
    </span>
  );
}
