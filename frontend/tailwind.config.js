/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // ============ الألوان ============
      colors: {
        // Ink (رمادي دافئ)
        ink: {
          50: "#F7F7F5",
          100: "#F0F0EC",
          200: "#E5E5E0",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0A0A0A",
        },
        // Gold (Champagne accent)
        gold: {
          100: "#F5EDE0",
          400: "#C4A574",
          500: "#B08D57",
          600: "#A17F4A",
          700: "#8B6F3F",
        },
        // Semantic (Desaturated)
        success: {
          100: "#DCFCE7",
          500: "#16A34A",
          700: "#166534",
        },
        warning: {
          100: "#FEF9C3",
          500: "#CA8A04",
          700: "#854D0E",
        },
        danger: {
          100: "#FEE2E2",
          500: "#DC2626",
          700: "#991B1B",
        },
        info: {
          100: "#DBEAFE",
          500: "#3B82F6",
          700: "#1E40AF",
        },
      },

      // ============ الخطوط ============
      fontFamily: {
        sans: ["Inter", "IBM Plex Sans Arabic", "system-ui", "sans-serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },

      // ============ أحجام الخطوط ============
      fontSize: {
        micro: ["0.6875rem", { lineHeight: "1rem" }], // 11px
        caption: ["0.75rem", { lineHeight: "1rem" }], // 12px
        "body-sm": ["0.8125rem", { lineHeight: "1.25rem" }], // 13px
        body: ["0.875rem", { lineHeight: "1.5rem" }], // 14px
        "body-lg": ["1rem", { lineHeight: "1.5rem" }], // 16px
        h4: ["1rem", { lineHeight: "1.5rem", letterSpacing: "-0.01em" }],
        h3: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        h2: ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.015em" }],
        h1: ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.015em" }],
        "display-sm": [
          "2.25rem",
          { lineHeight: "2.5rem", letterSpacing: "-0.02em" },
        ],
        display: ["3rem", { lineHeight: "3.5rem", letterSpacing: "-0.02em" }],
        "display-xl": [
          "4rem",
          { lineHeight: "4.5rem", letterSpacing: "-0.025em" },
        ],
      },

      // ============ نصف قطر الحدود ============
      borderRadius: {
        none: "0",
        sm: "0.25rem", // 4px
        md: "0.375rem", // 6px
        lg: "0.5rem", // 8px
        xl: "0.75rem", // 12px (الحد الأقصى)
      },

      // ============ الظلال ============
      boxShadow: {
        xs: "0 1px 2px rgba(0, 0, 0, 0.04)",
        sm: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        md: "0 4px 12px rgba(0, 0, 0, 0.08)",
        lg: "0 8px 24px rgba(0, 0, 0, 0.12)",
        "ring-focus": "0 0 0 2px #FFFFFF, 0 0 0 4px #171717",
        "ring-accent": "0 0 0 2px #FFFFFF, 0 0 0 4px #B08D57",
      },

      // ============ التباعد الإضافي ============
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },

      // ============ الحركة ============
      transitionDuration: {
        instant: "100ms",
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      // ============ Keyframes ============
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in-up": "fade-in-up 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};
