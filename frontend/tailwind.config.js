/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#F8FAFC',
          secondary: '#FFFFFF',
          card: '#FFFFFF',
          elevated: '#F1F5F9',
        },
        accent: {
          purple: '#7C3AED',
          violet: '#6D28D9',
          indigo: '#4F46E5',
          pink: '#DB2777',
          glow: '#6D28D9',
        },
        status: {
          verified: '#059669',
          validation: '#D97706',
          missing: '#DC2626',
          info: '#2563EB',
        },
        border: {
          subtle: '#E2E8F0',
          default: '#CBD5E1',
          bright: '#94A3B8',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
          accent: '#6D28D9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'card-gradient': 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        'accent-gradient': 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
        'glow-gradient': 'radial-gradient(ellipse at top left, rgba(124, 58, 237, 0.08) 0%, transparent 60%)',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 14px 0 rgb(109 40 217 / 0.08), 0 2px 4px -2px rgb(109 40 217 / 0.05)',
        'glow-purple': '0 0 15px rgba(124, 58, 237, 0.15)',
        'glow-sm': '0 0 8px rgba(124, 58, 237, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
