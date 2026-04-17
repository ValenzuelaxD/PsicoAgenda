import type { CSSProperties } from 'react';

export type ThemeMode = 'dark' | 'light';
export type ThemePreset = 'midnight' | 'forest' | 'ocean' | 'sunset' | 'lavender' | 'coral' | 'mint' | 'bronze' | 'rose' | 'indigo' | 'lime' | 'cyan';

export interface ThemePreferences {
  preset: ThemePreset;
  mode: ThemeMode;
  primaryColor: string;
  accentColor: string;
  backgroundImage: string;
}

interface ThemePalette {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceStrong: string;
  border: string;
  text: string;
  muted: string;
}

export const THEME_STORAGE_KEY = 'psicoagenda-theme-preferences';

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  preset: 'midnight',
  mode: 'dark',
  primaryColor: '#14b8a6',
  accentColor: '#a78bfa',
  backgroundImage: '',
};

export const THEME_PRESET_OPTIONS: Array<{
  preset: ThemePreset;
  label: string;
  description: string;
  preview: string;
}> = [
  {
    preset: 'midnight',
    label: 'Temas predefinidos',
    description: 'Base sobria con teal y violeta',
    preview: 'from-slate-900 via-teal-900 to-violet-900',
  },
  {
    preset: 'forest',
    label: 'Bosque clínico',
    description: 'Verde profundo con acento cálido',
    preview: 'from-emerald-950 via-slate-900 to-lime-900',
  },
  {
    preset: 'ocean',
    label: 'Océano sereno',
    description: 'Azules tranquilos y fondo limpio',
    preview: 'from-sky-950 via-slate-900 to-cyan-900',
  },
  {
    preset: 'sunset',
    label: 'Atardecer cálido',
    description: 'Tonos tierra con energía suave',
    preview: 'from-rose-950 via-orange-950 to-amber-900',
  },
  {
    preset: 'lavender',
    label: 'Lavanda elegante',
    description: 'Púrpura suave y rosa',
    preview: 'from-purple-950 via-slate-900 to-pink-900',
  },
  {
    preset: 'coral',
    label: 'Coral vibrante',
    description: 'Coral energético y naranja',
    preview: 'from-red-950 via-orange-900 to-amber-800',
  },
  {
    preset: 'mint',
    label: 'Menta fresca',
    description: 'Verde menta y aguamarina',
    preview: 'from-teal-950 via-green-950 to-cyan-900',
  },
  {
    preset: 'bronze',
    label: 'Bronce clásico',
    description: 'Tonos marrón y oro',
    preview: 'from-amber-950 via-yellow-950 to-orange-900',
  },
  {
    preset: 'rose',
    label: 'Rosa romántico',
    description: 'Rosa suave y rojo',
    preview: 'from-rose-950 via-pink-900 to-red-900',
  },
  {
    preset: 'indigo',
    label: 'Índigo profundo',
    description: 'Azul oscuro y púrpura',
    preview: 'from-indigo-950 via-blue-950 to-purple-900',
  },
  {
    preset: 'lime',
    label: 'Lima vibrante',
    description: 'Verde lima y amarillo',
    preview: 'from-lime-950 via-green-950 to-yellow-900',
  },
  {
    preset: 'cyan',
    label: 'Cyan futurista',
    description: 'Cyan brillante y azul',
    preview: 'from-cyan-950 via-blue-950 to-teal-900',
  },
];

const THEME_PALETTES: Record<ThemePreset, Record<ThemeMode, ThemePalette>> = {
  midnight: {
    dark: {
      background: '#0f172a',
      backgroundSecondary: '#111827',
      surface: '#1e293b',
      surfaceStrong: '#0f172a',
      border: '#334155',
      text: '#f8fafc',
      muted: '#94a3b8',
    },
    light: {
      background: '#f8fafc',
      backgroundSecondary: '#e2e8f0',
      surface: '#ffffff',
      surfaceStrong: '#f1f5f9',
      border: '#cbd5e1',
      text: '#0f172a',
      muted: '#475569',
    },
  },
  forest: {
    dark: {
      background: '#052e2b',
      backgroundSecondary: '#0f172a',
      surface: '#11332e',
      surfaceStrong: '#08211d',
      border: '#1f5a52',
      text: '#ecfdf5',
      muted: '#9cc6bc',
    },
    light: {
      background: '#f0fdf4',
      backgroundSecondary: '#dcfce7',
      surface: '#ffffff',
      surfaceStrong: '#f8faf8',
      border: '#bbf7d0',
      text: '#0f172a',
      muted: '#4b5563',
    },
  },
  ocean: {
    dark: {
      background: '#082f49',
      backgroundSecondary: '#0f172a',
      surface: '#123352',
      surfaceStrong: '#071b2d',
      border: '#1d4f7a',
      text: '#f0f9ff',
      muted: '#9fbad0',
    },
    light: {
      background: '#eff6ff',
      backgroundSecondary: '#dbeafe',
      surface: '#ffffff',
      surfaceStrong: '#f8fbff',
      border: '#bfdbfe',
      text: '#0f172a',
      muted: '#475569',
    },
  },
  sunset: {
    dark: {
      background: '#3f1d16',
      backgroundSecondary: '#111827',
      surface: '#4c2217',
      surfaceStrong: '#2d150f',
      border: '#7c3f26',
      text: '#fff7ed',
      muted: '#e2b8a4',
    },
    light: {
      background: '#fff7ed',
      backgroundSecondary: '#ffedd5',
      surface: '#ffffff',
      surfaceStrong: '#fffaf4',
      border: '#fed7aa',
      text: '#0f172a',
      muted: '#57534e',
    },
  },
  lavender: {
    dark: {
      background: '#3b0764',
      backgroundSecondary: '#111827',
      surface: '#5b21b6',
      surfaceStrong: '#2d0a4e',
      border: '#9333ea',
      text: '#f3e8ff',
      muted: '#d8b4fe',
    },
    light: {
      background: '#faf5ff',
      backgroundSecondary: '#f3e8ff',
      surface: '#ffffff',
      surfaceStrong: '#fdf8ff',
      border: '#e9d5ff',
      text: '#0f172a',
      muted: '#6b21a8',
    },
  },
  coral: {
    dark: {
      background: '#5f1f13',
      backgroundSecondary: '#111827',
      surface: '#7c2d12',
      surfaceStrong: '#431407',
      border: '#ea580c',
      text: '#ffedd5',
      muted: '#fbcfe8',
    },
    light: {
      background: '#fff7ed',
      backgroundSecondary: '#fed7aa',
      surface: '#ffffff',
      surfaceStrong: '#fffaf4',
      border: '#fed7aa',
      text: '#0f172a',
      muted: '#92400e',
    },
  },
  mint: {
    dark: {
      background: '#0d3838',
      backgroundSecondary: '#0f172a',
      surface: '#134e4a',
      surfaceStrong: '#082f2f',
      border: '#14b8a6',
      text: '#ccfbf1',
      muted: '#99f6e4',
    },
    light: {
      background: '#f0fdfa',
      backgroundSecondary: '#ccfbf1',
      surface: '#ffffff',
      surfaceStrong: '#f8fefc',
      border: '#99f6e4',
      text: '#0f172a',
      muted: '#0d5d5d',
    },
  },
  bronze: {
    dark: {
      background: '#44280d',
      backgroundSecondary: '#111827',
      surface: '#5a370d',
      surfaceStrong: '#2d1800',
      border: '#d97706',
      text: '#fef3c7',
      muted: '#fcd34d',
    },
    light: {
      background: '#fefce8',
      backgroundSecondary: '#fef08a',
      surface: '#ffffff',
      surfaceStrong: '#fffbf0',
      border: '#fcd34d',
      text: '#0f172a',
      muted: '#78350f',
    },
  },
  rose: {
    dark: {
      background: '#500724',
      backgroundSecondary: '#111827',
      surface: '#6b1b35',
      surfaceStrong: '#3f0620',
      border: '#be185d',
      text: '#fce7f3',
      muted: '#fbcfe8',
    },
    light: {
      background: '#fff0f6',
      backgroundSecondary: '#fecdd3',
      surface: '#ffffff',
      surfaceStrong: '#fff8fa',
      border: '#fbcfe8',
      text: '#0f172a',
      muted: '#831843',
    },
  },
  indigo: {
    dark: {
      background: '#1e1b4b',
      backgroundSecondary: '#111827',
      surface: '#312e81',
      surfaceStrong: '#0f0d2a',
      border: '#4f46e5',
      text: '#e0e7ff',
      muted: '#c7d2fe',
    },
    light: {
      background: '#f0f4ff',
      backgroundSecondary: '#e0e7ff',
      surface: '#ffffff',
      surfaceStrong: '#f8faff',
      border: '#c7d2fe',
      text: '#0f172a',
      muted: '#3730a3',
    },
  },
  lime: {
    dark: {
      background: '#3d5a1d',
      backgroundSecondary: '#111827',
      surface: '#4d7324',
      surfaceStrong: '#263a0b',
      border: '#84cc16',
      text: '#f2fe16',
      muted: '#d4fc79',
    },
    light: {
      background: '#f7fee7',
      backgroundSecondary: '#dcfce7',
      surface: '#ffffff',
      surfaceStrong: '#fefef0',
      border: '#d4fc79',
      text: '#0f172a',
      muted: '#3f6212',
    },
  },
  cyan: {
    dark: {
      background: '#0d3c42',
      backgroundSecondary: '#111827',
      surface: '#164450',
      surfaceStrong: '#082838',
      border: '#06b6d4',
      text: '#cffafe',
      muted: '#a5f3fc',
    },
    light: {
      background: '#ecfdf5',
      backgroundSecondary: '#cffafe',
      surface: '#ffffff',
      surfaceStrong: '#f0fdfa',
      border: '#a5f3fc',
      text: '#0f172a',
      muted: '#0d7a78',
    },
  },
};

export function normalizeThemePreferences(theme?: Partial<ThemePreferences> | null): ThemePreferences {
  const nextTheme = theme || {};

  return {
    preset: THEME_PRESET_OPTIONS.some((option) => option.preset === nextTheme.preset)
      ? (nextTheme.preset as ThemePreset)
      : DEFAULT_THEME_PREFERENCES.preset,
    mode: nextTheme.mode === 'light' ? 'light' : 'dark',
    primaryColor: nextTheme.primaryColor || DEFAULT_THEME_PREFERENCES.primaryColor,
    accentColor: nextTheme.accentColor || DEFAULT_THEME_PREFERENCES.accentColor,
    backgroundImage: nextTheme.backgroundImage || '',
  };
}

export function loadThemePreferences(): ThemePreferences {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_THEME_PREFERENCES;
  }

  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_THEME_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<ThemePreferences>;
    return normalizeThemePreferences(parsed);
  } catch {
    return DEFAULT_THEME_PREFERENCES;
  }
}

export function saveThemePreferences(theme: ThemePreferences) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(normalizeThemePreferences(theme)));
}

export function buildThemePalette(theme: ThemePreferences): ThemePalette {
  return THEME_PALETTES[theme.preset][theme.mode];
}

export function buildThemeShellStyle(theme: ThemePreferences): CSSProperties {
  const palette = buildThemePalette(theme);
  const accent = theme.primaryColor || DEFAULT_THEME_PREFERENCES.primaryColor;
  const secondaryAccent = theme.accentColor || DEFAULT_THEME_PREFERENCES.accentColor;

  const backgroundLayer = theme.backgroundImage
    ? `linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.48)), url("${theme.backgroundImage}")`
    : `linear-gradient(135deg, ${palette.background}, ${palette.backgroundSecondary})`;

  return {
    backgroundImage: backgroundLayer,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    color: palette.text,
    ['--theme-background' as any]: palette.background,
    ['--theme-background-secondary' as any]: palette.backgroundSecondary,
    ['--theme-surface' as any]: palette.surface,
    ['--theme-surface-strong' as any]: palette.surfaceStrong,
    ['--theme-border' as any]: palette.border,
    ['--theme-text' as any]: palette.text,
    ['--theme-muted' as any]: palette.muted,
    ['--theme-primary' as any]: accent,
    ['--theme-accent' as any]: secondaryAccent,
    ['--theme-primary-contrast' as any]: theme.mode === 'light' ? '#ffffff' : '#0f172a',
  };
}

export function buildThemeSurfaceStyle(theme: ThemePreferences): CSSProperties {
  const palette = buildThemePalette(theme);

  return {
    backgroundColor: palette.surface,
    backgroundImage: `linear-gradient(180deg, ${palette.surface}, ${palette.surfaceStrong})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderColor: palette.border,
    color: palette.text,
  };
}
