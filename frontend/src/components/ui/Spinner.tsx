import { Loader2 } from "lucide-react";

type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 20,
  lg: 32,
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2
      size={sizeMap[size]}
      className={["animate-spin text-ink-500", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    />
  );
}

// ========== Full Page Loading ==========
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner size="lg" />
      {label && <p className="text-body-sm text-ink-600">{label}</p>}
    </div>
  );
}
