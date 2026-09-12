import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      required,
      id,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-body-sm font-medium text-ink-900 mb-1.5"
          >
            {label}
            {required && (
              <span className="text-danger-500 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-ink-500 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={hasError || undefined}
            aria-describedby={
              [error ? errorId : null, hint ? hintId : null]
                .filter(Boolean)
                .join(" ") || undefined
            }
            disabled={disabled}
            className={[
              "block w-full h-10 rounded-md border bg-white text-body text-ink-900",
              "placeholder:text-ink-400",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "disabled:bg-ink-50 disabled:text-ink-500 disabled:cursor-not-allowed",
              leftIcon ? "ps-9" : "ps-3",
              rightIcon ? "pe-9" : "pe-3",
              hasError
                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                : "border-ink-200 hover:border-ink-300 focus:border-ink-900 focus:ring-ink-900/10",
              className ?? "",
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />

          {rightIcon && (
            <span className="absolute inset-y-0 end-0 flex items-center pe-3 text-ink-500">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-caption text-danger-500"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && hint && (
          <p id={hintId} className="mt-1.5 text-caption text-ink-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
