interface DemoBadgeProps {
  label?: string;
}

export function DemoBadge({ label = "Demo data" }: DemoBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 border border-line px-2.5 py-1 text-[0.78rem] font-medium text-stone-deep">
      <span aria-hidden="true" className="size-1.5 bg-lip" />
      {label}
    </span>
  );
}
