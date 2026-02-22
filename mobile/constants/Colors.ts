const tintColorLight = '#16a34a'; // Green primary
const tintColorDark = '#fff';

export default {
  light: {
    text: '#1e293b',
    textSecondary: '#64748b',
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    tint: tintColorLight,
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    primary: '#16a34a',
    danger: '#ef4444',
    inputBackground: '#ffffff',
    success: '#10b981',
    warning: '#f59e0b',
    highlight: '#dcfce7', // Very light green for active states
  },
  dark: {
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    background: '#0f172a',
    card: '#1e293b',
    border: '#334155',
    tint: tintColorDark,
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorDark,
    primary: '#22c55e', // Slightly lighter green for dark mode
    danger: '#f87171',
    inputBackground: '#1e293b',
    success: '#4ade80',
    warning: '#fbbf24',
    highlight: '#064e3b', // Dark green for active states
  },
};
