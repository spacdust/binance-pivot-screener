/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        foreground: '#fafafa',
        card: {
          DEFAULT: '#121215',
          foreground: '#fafafa',
        },
        popover: {
          DEFAULT: '#18181b',
          foreground: '#fafafa',
        },
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#27272a',
          foreground: '#fafafa',
        },
        muted: {
          DEFAULT: '#27272a',
          foreground: '#a1a1aa',
        },
        accent: {
          DEFAULT: '#27272a',
          foreground: '#fafafa',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        border: '#2b313a',
        input: '#2b313a',
        ring: '#f0b90b',
        binance: {
          bg: '#0b0e11',
          card: '#181a20',
          hover: '#1e2329',
          border: '#2b313a',
          borderLight: '#363d47',
          yellow: '#f0b90b',
          yellowHover: '#fcd535',
          green: '#0ecb81',
          red: '#f6465d',
          textPrimary: '#eaecef',
          textSecondary: '#848e9c',
          textMuted: '#474d57',
        },
        bullish: {
          DEFAULT: '#0ecb81',
          light: '#2ee69a',
          dark: '#0ba367',
          bg: 'rgba(14, 203, 129, 0.12)',
          border: 'rgba(14, 203, 129, 0.3)',
        },
        bearish: {
          DEFAULT: '#f6465d',
          light: '#ff6579',
          dark: '#d13247',
          bg: 'rgba(246, 70, 93, 0.12)',
          border: 'rgba(246, 70, 93, 0.3)',
        },
        pivot: {
          p: '#f0b90b',       // Binance Yellow for P
          r1: '#0ecb81',      // Binance Green for R1
          r2: '#10b981',      // Emerald for R2
          s1: '#f59e0b',      // Amber for S1
          s2: '#f6465d',      // Binance Red for S2
          s3: '#dc2626',      // Crimson for S3
          r3: '#059669',      // Deep green for R3
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
    },
  },
  plugins: [],
}
