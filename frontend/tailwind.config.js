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
          primary: '#0A0A1B',
          secondary: '#0F0F2A',
          card: '#13132A',
          elevated: '#1A1A35',
        },
        accent: {
          purple: '#7C3AED',
          violet: '#8B5CF6',
          indigo: '#6366F1',
          pink: '#EC4899',
          glow: '#A78BFA',
        },
        status: {
          verified: '#10B981',
          validation: '#F59E0B',
          missing: '#EF4444',
          info: '#3B82F6',
        },
        border: {
          subtle: '#1E1E40',
          default: '#2A2A50',
          bright: '#3D3D70',
        },
        text: {
          primary: '#F0F0FF',
          secondary: '#A0A0C8',
          muted: '#6B6B95',
          accent: '#A78BFA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'card-gradient': 'linear-gradient(135deg, #13132A 0%, #1A1A35 100%)',
        'accent-gradient': 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
        'glow-gradient': 'radial-gradient(ellipse at top left, rgba(124, 58, 237, 0.15) 0%, transparent 60%)',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
        'card-hover': '0 4px 20px rgba(124, 58, 237, 0.15), 0 0 0 1px rgba(124, 58, 237, 0.2)',
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.4)',
        'glow-sm': '0 0 10px rgba(124, 58, 237, 0.2)',
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
