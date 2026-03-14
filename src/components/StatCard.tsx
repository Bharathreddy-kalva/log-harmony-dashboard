import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  dotColor?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, dotColor, icon }: StatCardProps) {
  return (
    <div className="rounded-md border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {dotColor && <div className={`h-2 w-2 rounded-full ${dotColor}`} />}
        {icon}
        <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <span className="text-2xl font-mono font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
