/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'hsl(230, 15%, 22%)',
        input: 'hsl(230, 15%, 22%)',
        ring: 'hsl(346, 66%, 55%)',
        background: 'hsl(230, 20%, 10%)',
        foreground: 'hsl(0, 0%, 95%)',
        primary: {
          DEFAULT: 'hsl(346, 66%, 55%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        secondary: {
          DEFAULT: 'hsl(230, 15%, 18%)',
          foreground: 'hsl(0, 0%, 90%)',
        },
        destructive: {
          DEFAULT: 'hsl(0, 84.2%, 60.2%)',
          foreground: 'hsl(0, 0%, 98%)',
        },
        muted: {
          DEFAULT: 'hsl(230, 15%, 18%)',
          foreground: 'hsl(230, 10%, 55%)',
        },
        accent: {
          DEFAULT: 'hsl(230, 15%, 18%)',
          foreground: 'hsl(0, 0%, 95%)',
        },
        card: {
          DEFAULT: 'hsl(230, 18%, 14%)',
          foreground: 'hsl(0, 0%, 95%)',
        },
        coral: {
          DEFAULT: 'hsl(346, 66%, 55%)',
          foreground: '#ffffff',
        },
        teal: {
          DEFAULT: 'hsl(170, 58%, 57%)',
          foreground: 'hsl(170, 50%, 12%)',
        },
      },
      borderRadius: {
        lg: 12,
        md: 10,
        sm: 8,
      },
    },
  },
  plugins: [],
};
