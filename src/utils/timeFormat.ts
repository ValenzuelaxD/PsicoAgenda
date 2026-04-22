export type HourFormatPreference = '24h' | '12h';

const HOUR_FORMAT_STORAGE_KEY = 'psicoagenda-hour-format';

const getHourFormatStorageKey = (userKey?: string): string => {
  const key = String(userKey || '').trim();
  return key ? `${HOUR_FORMAT_STORAGE_KEY}:${key}` : `${HOUR_FORMAT_STORAGE_KEY}:anon`;
};

const getCurrentUserKey = (): string => {
  if (typeof localStorage === 'undefined') {
    return 'anon';
  }

  try {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return 'anon';
    }

    const parsed = JSON.parse(raw);
    const candidate = parsed?.usuarioid || parsed?.id || parsed?.correo || parsed?.email || parsed?.nombre;
    return String(candidate || 'anon');
  } catch {
    return 'anon';
  }
};

const normalizeHourFormat = (value: unknown): HourFormatPreference => {
  return value === '12h' ? '12h' : '24h';
};

export const loadHourFormatPreference = (userKey?: string): HourFormatPreference => {
  if (typeof localStorage === 'undefined') {
    return '24h';
  }

  try {
    const storageKey = getHourFormatStorageKey(userKey || getCurrentUserKey());
    const stored = localStorage.getItem(storageKey);
    return normalizeHourFormat(stored);
  } catch {
    return '24h';
  }
};

export const saveHourFormatPreference = (format: HourFormatPreference, userKey?: string): void => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    const storageKey = getHourFormatStorageKey(userKey || getCurrentUserKey());
    localStorage.setItem(storageKey, normalizeHourFormat(format));
  } catch {
    // Ignore storage failures to avoid blocking UI actions.
  }
};

export const formatHourLabel = (hourValue: string, format: HourFormatPreference): string => {
  const normalized = String(hourValue || '').slice(0, 5);
  const [hourRaw, minuteRaw] = normalized.split(':').map(Number);

  if (Number.isNaN(hourRaw) || Number.isNaN(minuteRaw)) {
    return hourValue;
  }

  if (format === '24h') {
    return `${String(hourRaw).padStart(2, '0')}:${String(minuteRaw).padStart(2, '0')}`;
  }

  const suffix = hourRaw >= 12 ? 'p.m.' : 'a.m.';
  const hour12 = ((hourRaw + 11) % 12) + 1;
  return `${String(hour12).padStart(2, '0')}:${String(minuteRaw).padStart(2, '0')} ${suffix}`;
};
