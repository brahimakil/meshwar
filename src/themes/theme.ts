export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

export const defaultTheme: ThemeConfig = {
  mode: 'light',
  colors: {
    primary: 'hsl(220, 100%, 50%)',
    secondary: 'hsl(280, 100%, 50%)',
    accent: 'hsl(340, 100%, 50%)',
    background: 'hsl(0, 0%, 100%)',
    foreground: 'hsl(0, 0%, 10%)',
    muted: 'hsl(0, 0%, 96%)',
    mutedForeground: 'hsl(0, 0%, 45%)',
    border: 'hsl(0, 0%, 90%)',
    success: 'hsl(142, 76%, 36%)',
    warning: 'hsl(38, 92%, 50%)',
    error: 'hsl(0, 84%, 60%)',
    info: 'hsl(200, 98%, 39%)',
  },
  fonts: {
    heading: 'system-ui, sans-serif',
    body: 'system-ui, sans-serif',
    mono: 'monospace',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '4rem',
  },
  borderRadius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  },
};

export const darkTheme: ThemeConfig = {
  ...defaultTheme,
  mode: 'dark',
  colors: {
    ...defaultTheme.colors,
    background: 'hsl(0, 0%, 10%)',
    foreground: 'hsl(0, 0%, 98%)',
    muted: 'hsl(0, 0%, 15%)',
    mutedForeground: 'hsl(0, 0%, 65%)',
    border: 'hsl(0, 0%, 20%)',
  },
};

export function getTheme(mode: ThemeMode = 'light'): ThemeConfig {
  if (mode === 'dark') return darkTheme;
  return defaultTheme;
} 