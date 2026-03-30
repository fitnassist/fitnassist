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
        border: 'hsl(230, 15%, 88%)',
        input: 'hsl(230, 15%, 88%)',
        ring: 'hsl(170, 58%, 57%)',
        background: 'hsl(0, 0%, 100%)',
        foreground: 'hsl(230, 25%, 10%)',
        primary: {
          DEFAULT: 'hsl(170, 58%, 57%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        secondary: {
          DEFAULT: 'hsl(230, 20%, 95%)',
          foreground: 'hsl(230, 25%, 10%)',
        },
        destructive: {
          DEFAULT: 'hsl(0, 84.2%, 60.2%)',
          foreground: 'hsl(0, 0%, 98%)',
        },
        muted: {
          DEFAULT: 'hsl(230, 20%, 95%)',
          foreground: 'hsl(230, 15%, 45%)',
        },
        accent: {
          DEFAULT: 'hsl(230, 20%, 95%)',
          foreground: 'hsl(230, 25%, 10%)',
        },
        card: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(230, 25%, 10%)',
        },
        coral: {
          DEFAULT: 'hsl(346, 66%, 52%)',
          foreground: '#ffffff',
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
