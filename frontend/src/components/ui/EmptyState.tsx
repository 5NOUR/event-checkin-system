import type { LucideIcon } from "lucide-react";
import { Button } from "./Button";

export interface EmptyState {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: EmptyState) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-6" : "py-16 px-6",
      ].join(" ")}
    >
      <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center mb-5">
        <Icon className="w-5 h-5 text-ink-600" strokeWidth={1.5} />
      </div>
      <h3 className="text-h4 font-semibold text-ink-900 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 text-body-sm text-ink-600 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          <Button variant="secondary" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
