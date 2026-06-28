/** @type {import('tailwindcss').Config} */
module.exports = {
  // Include paths to all components and App.tsx
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#080A0C',      // Deep premium dark background
        surface: '#12161A',         // Card/surface container background
        surfaceHover: '#1B2026',    // Highlighted card/button hover
        border: '#1F262E',          // High contrast border
        primary: '#00E676',         // Vibrant neon green (primary action/gains)
        primaryHover: '#00C853',    // Darker green for press state
        secondary: '#1A8CFF',       // Sleek blue for secondary actions
        secondaryHover: '#0070E0',  // Darker blue for press state
        text: '#FFFFFF',            // Primary text (pure white)
        textSecondary: '#94A3B8',   // Secondary text (slate gray)
        textMuted: '#64748B',       // Muted/disabled text (dark slate gray)
        gains: '#00E676',           // Gains green
        losses: '#FF3B30',          // Losses red
        accent: '#A855F7',          // Premium accent color (purple)
        warning: '#F59E0B',         // Warning amber
        info: '#3B82F6',            // Info blue
      },
      spacing: {
        'space-none': '0px',
        'space-xs': '4px',
        'space-sm': '8px',
        'space-md': '12px',
        'space-lg': '16px',
        'space-xl': '24px',
        'space-xxl': '32px',
        'space-xxxl': '48px',
      },
      borderRadius: {
        'radius-none': '0px',
        'radius-xs': '4px',
        'radius-sm': '8px',
        'radius-md': '12px',
        'radius-lg': '16px',
        'radius-xl': '24px',
        'radius-full': '9999px',
      },
    },
  },
  plugins: [],
}
