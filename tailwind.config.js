/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  /* ============================================================
     SAFELIST — classes montadas dinamicamente em objetos (CFG)
     O Tailwind não consegue "enxergar" strings dentro de variáveis,
     então precisamos listá-las aqui para não serem removidas no build.
     ============================================================ */
  safelist: [
    // Botões — variantes do ConfirmModal / Toast / etc.
    'bg-cdl-danger-500',  'hover:bg-cdl-danger-600',
    'bg-cdl-green-500',   'hover:bg-cdl-green-600',
    'bg-cdl-navy-700',    'hover:bg-cdl-navy-800',
    'bg-cdl-yellow-500',  'hover:bg-cdl-yellow-600',
    'bg-cdl-yellow-gradient',
    'hover:brightness-105', 'hover:brightness-110',

    // Ícones/bordas das variantes
    'text-cdl-danger-500', 'text-cdl-green-500', 'text-cdl-green-600',
    'text-cdl-navy-700',   'text-cdl-yellow-600',
    'bg-cdl-danger-50',    'bg-cdl-green-50',
    'bg-cdl-navy-50',      'bg-cdl-yellow-50',
    'border-cdl-danger-500','border-cdl-green-500',
    'border-cdl-navy-700',  'border-cdl-yellow-500',

    // Badges de status usadas dinamicamente
    'bg-cdl-green-100', 'text-cdl-green-700',
    'bg-cdl-danger-50', 'text-cdl-danger-500',
    'bg-cdl-yellow-100','text-cdl-yellow-700',
    'bg-cdl-navy-100',  'text-cdl-navy-800',
    'bg-cdl-navy-50',   'text-cdl-navy-700',
    'bg-cdl-neutral-100','text-cdl-neutral-500',

    // Animações (usadas via classes dinâmicas eventualmente)
    'animate-fade-in', 'animate-slide-up',
  ],

  theme: {
    extend: {
      colors: {
        // ============================================================
        // IDENTIDADE VISUAL CDL FORTALEZA
        // ============================================================
        cdl: {
          navy: {
            50:  '#EEF2FB',
            100: '#D9E1F5',
            200: '#B3C3EB',
            300: '#8DA5E1',
            400: '#6787D7',
            500: '#4169CD',
            600: '#2D4FB8',
            700: '#1F3A8A',  // 🔥 Cor principal da marca
            800: '#1A2F70',
            900: '#152456',
          },
          yellow: {
            50:  '#FFFBE6',
            100: '#FEF3C7',
            400: '#FBBF24',
            500: '#F5C518',  // 🔥 Amarelo da marca
            600: '#D9A800',
            700: '#B58A00',
          },
          green: {
            50:  '#E7F6EC',
            100: '#C8EBD4',
            400: '#34D399',
            500: '#2D8B4E',  // 🔥 Verde da marca
            600: '#237040',
            700: '#1B5731',
          },
          danger: {
            50:  '#FDECEA',
            100: '#FAD2CE',
            500: '#C0392B',
            600: '#A52F23',
          },
          neutral: {
            50:  '#F5F6F8',
            100: '#EDEEF1',
            500: '#4A4A4A',
            700: '#2E2E2E',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cdl':    '0 4px 14px 0 rgba(31, 58, 138, 0.15)',
        'cdl-lg': '0 10px 30px 0 rgba(31, 58, 138, 0.20)',
      },
      backgroundImage: {
        'cdl-gradient':         'linear-gradient(135deg, #1F3A8A 0%, #2D4FB8 100%)',
        'cdl-gradient-reverse': 'linear-gradient(135deg, #2D4FB8 0%, #1F3A8A 100%)',
        'cdl-yellow-gradient':  'linear-gradient(180deg, #F5C518 0%, #D9A800 100%)',
      },
      animation: {
        'fade-in':   'fadeIn .15s ease-out',
        'slide-up':  'slideUp .2s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(12px) scale(.98)' },
          to:   { opacity: 1, transform: 'translateY(0)   scale(1)' },
        },
      },
    },
  },
  plugins: [],
};