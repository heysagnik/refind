interface Props {
  label: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  active: "bg-accent-soft text-accent",
  claimed: "bg-success-soft text-success",
  closed: "bg-bg text-ink-soft",
  pending_review: "bg-warning-soft text-accent-warm",
  approved: "bg-success-soft text-success",
  rejected: "bg-danger-soft text-danger",
};

const statusText: Record<string, string> = {
  pending_review: "pending review",
};

export function Chip({ label, className = "" }: Props) {
  const color = statusColors[label] || "bg-accent-soft text-accent";
  const text = statusText[label] || label.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1 text-[13px] font-semibold capitalize ${color} ${className}`}
    >
      {text}
    </span>
  );
}

export function FloatingChip({ label, className = "" }: Props) {
  const color = statusColors[label] || "bg-surface/90 text-ink";
  const text = statusText[label] || label.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1 text-[12px] font-semibold capitalize backdrop-blur-md shadow-floating ${color} ${className}`}
    >
      {text}
    </span>
  );
}
