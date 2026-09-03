import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        devotional: {
          blue: {
            950: '#07112c', // deepest midnight pandal blue
            900: '#0c1b44', // royal deep blue
            800: '#142966', // navy royal
            700: '#1d3b8f',
            600: '#254eb8',
            100: '#e8efff',
            50: '#f3f6ff',
          },
          gold: {
            900: '#7a5209',
            800: '#a36d0b',
            600: '#cfa015',
            500: '#e5b31e', // pure warm festive gold
            400: '#f3ca3e',
            300: '#f9de78',
            100: '#fef7dc',
            50: '#fffcf2',
          },
          amber: {
            500: '#f59e0b',
            600: '#d97706',
          }
        },
      },
      boxShadow: {
        'gold-sm': '0 0 10px rgba(229, 179, 30, 0.25)',
        'gold-md': '0 0 20px rgba(229, 179, 30, 0.35)',
        'gold-lg': '0 0 30px rgba(229, 179, 30, 0.45)',
        'blue-glow': '0 8px 30px rgba(12, 27, 68, 0.6)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gold-gradient': 'linear-gradient(135deg, #f9de78 0%, #e5b31e 50%, #cfa015 100%)',
        'pandal-gradient': 'linear-gradient(180deg, #07112c 0%, #0c1b44 50%, #07112c 100%)',
      }
    },
  },
  plugins: [],
};

export default config;
