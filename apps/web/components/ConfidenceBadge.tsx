const LABELS: Record<string, string> = {
  HIGH: "High confidence",
  MEDIUM: "Medium confidence",
  LOW: "Low confidence",
  INDETERMINATE: "Indeterminate",
};

export default function ConfidenceBadge({ confidence }: { confidence: string }) {
  return (
    <span className={`text-xs font-medium confidence-${confidence}`}>
      {LABELS[confidence] ?? confidence}
    </span>
  );
}
