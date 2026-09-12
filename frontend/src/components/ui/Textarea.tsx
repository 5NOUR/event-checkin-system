import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      required,
      id,
      className,
      disabled,
      rows = 4,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
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

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={hasError || undefined}
          aria-describedby={
            [error ? errorId : null, hint ? hintId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          disabled={disabled}
          className={[
            "block w-full rounded-md border bg-white text-body text-ink-900",
            "px-3 py-2 leading-relaxed",
            "placeholder:text-ink-400",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            "disabled:bg-ink-50 disabled:text-ink-500 disabled:cursor-not-allowed",
            "resize-y",
            hasError
              ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
              : "border-ink-200 hover:border-ink-300 focus:border-ink-900 focus:ring-ink-900/10",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />

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

Textarea.displayName = "Textarea";
