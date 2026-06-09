interface DetailCellProps {
  label: string;
  value: string;
  highlight?: boolean;
  span?: boolean;
}

export default function DetailCell({ label, value, highlight, span }: DetailCellProps) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--dms-text-muted)]">{label}</p>
      <p className={`mt-0.5 text-sm font-medium ${highlight ? "text-[var(--dms-primary)]" : "text-[var(--dms-text)]"}`}>
        {value}
      </p>
    </div>
  );
}
