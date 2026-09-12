import type { ReactNode } from "react";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent";

type BadgeSize = "sm" | "md";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-ink-100 text-ink-700 border-ink-200",
  success: "bg-success-100 text-success-700 border-success-500/20",
  warning: "bg-warning-100 text-warning-700 border-warning-500/20",
  danger: "bg-danger-100 text-danger-700 border-danger-500/20",
  info: "bg-info-100 text-info-700 border-info-500/20",
  accent: "bg-gold-100 text-gold-700 border-gold-500/20",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-ink-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  info: "bg-info-500",
  accent: "bg-gold-500",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "h-5 px-1.5 text-micro gap-1 rounded-sm",
  md: "h-6 px-2 text-caption gap-1.5 rounded-sm",
};

export function Badge({
  variant = "default",
  size = "md",
  icon,
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center font-semibold uppercase tracking-wider border whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
