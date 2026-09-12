import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const baseStyles = [
  "inline-flex items-center justify-center gap-2",
  "font-medium tracking-tight",
  "transition-colors duration-150 ease-out",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  "whitespace-nowrap select-none",
].join(" ");

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-ink-900 text-white hover:bg-ink-800 focus-visible:ring-ink-900 active:bg-ink-950",
  secondary:
    "bg-white text-ink-900 border border-ink-200 hover:bg-ink-50 hover:border-ink-300 focus-visible:ring-ink-900",
  ghost:
    "text-ink-700 hover:bg-ink-100 hover:text-ink-900 focus-visible:ring-ink-900",
  danger:
    "bg-danger-500 text-white hover:bg-danger-700 focus-visible:ring-danger-500",
  accent:
    "bg-gold-500 text-white hover:bg-gold-600 focus-visible:ring-gold-500 active:bg-gold-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-md",
  md: "h-10 px-4 text-sm rounded-md",
  lg: "h-11 px-6 text-sm rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={[
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth ? "w-full" : "",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
