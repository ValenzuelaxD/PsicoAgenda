import type { CSSProperties } from 'react';

export type ThemeMode = 'dark' | 'light';
export type ThemePreset = 'midnight' | 'forest' | 'ocean' | 'sunset';

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
