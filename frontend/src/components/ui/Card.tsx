import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  padding = "md",
  interactive = false,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "bg-white border border-ink-200 rounded-lg",
        interactive
          ? "transition-colors duration-150 hover:border-ink-300 cursor-pointer"
          : "",
        paddingStyles[padding],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

// ========== Card Header ==========
export interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="min-w-0 flex-1">
        <h3 className="text-h4 font-semibold text-ink-900 tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-body-sm text-ink-600">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
