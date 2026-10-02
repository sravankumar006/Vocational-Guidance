/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0c1017',
          deep: '#080b10',
          card: '#131923',
          surface: '#18202c',
          elevated: '#1e2634',
        },
        surface: {
          base: '#131923',
          elevated: '#18202c',
          overlay: '#202b3a',
          glass: 'rgba(19, 25, 35, 0.75)',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.04)',
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.14)',
        },
        brand: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        accent: {
          DEFAULT: '#3d566e',
          hover: '#4b6985',
          active: '#31465a',
          subtle: '#141d27',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#8a99ad',
          muted: '#5a697d',
          highlight: '#cbd5e1',
        },
        status: {
          success: '#10b981',
          successBg: 'rgba(16, 185, 129, 0.08)',
          error: '#ef4444',
          errorBg: 'rgba(239, 68, 68, 0.08)',
          warning: '#f59e0b',
          warningBg: 'rgba(245, 158, 11, 0.08)',
          info: '#60a5fa',
          infoBg: 'rgba(96, 165, 250, 0.08)',
        },
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0, 0, 0, 0.2)',
        elevated: '0 4px 16px rgba(0, 0, 0, 0.25)',
        glass: '0 8px 24px 0 rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
}
