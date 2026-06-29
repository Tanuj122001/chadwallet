export const colors = {
  // Premium Luxury Slate/Midnight Base
  background: '#0B0F19',
  surface: '#151E33',
  surfaceHover: '#1E294B',
  border: '#2E3F66',
  borderAlpha: 'rgba(46, 63, 102, 0.4)',

  // Brand Indicators
  primary: '#00E676',
  primaryHover: '#00C853',
  secondary: '#3B82F6',
  secondaryHover: '#2563EB',
  accent: '#8B5CF6',
  accentHover: '#7C3AED',

  // Crypto Gains/Losses
  gains: '#10B981',
  losses: '#EF4444',

  // Accessibility Typo Mappings
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Warnings / Notifications
  warning: '#F59E0B',
  info: '#0EA5E9',

  // Gradient Tokens
  gradients: {
    premium: ['#0B0F19', '#151E33'],
    emerald: ['#10B981', '#059669'],
    card: ['#1E293B', '#0F172A'],
    neon: ['#8B5CF6', '#EC4899'],
    glass: ['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.7)'],
  },

  // Light Theme Indicators Mapping (Readiness)
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
  },
};

export type ThemeColors = typeof colors;
