// Session storage helpers. Everything is wrapped in try/catch because
// localStorage can be blocked (private mode, strict browser settings).

const ACCESS = 'accessToken';
const REFRESH = 'refreshToken';
const USER = 'authUser';

function safeSet(key: string, value: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export const setAuthToken = (token: string) => safeSet(ACCESS, token);
export const getAuthToken = () => safeGet(ACCESS);
export const setRefreshToken = (token: string | null | undefined) => safeSet(REFRESH, token ?? null);
export const getRefreshToken = () => safeGet(REFRESH);

export function saveSession(session: { accessToken: string; refreshToken?: string; user: unknown }) {
  safeSet(ACCESS, session.accessToken);
  if (session.refreshToken) safeSet(REFRESH, session.refreshToken);
  safeSet(USER, JSON.stringify(session.user));
}

export function saveUser(user: unknown) {
  safeSet(USER, JSON.stringify(user));
}

export function loadSession<U>(): { token: string; user: U } | null {
  const token = safeGet(ACCESS);
  const raw = safeGet(USER);
  if (!token || !raw) return null;
  try {
    return { token, user: JSON.parse(raw) as U };
  } catch {
    return null;
  }
}

export const removeAuthToken = () => {
  safeSet(ACCESS, null);
  safeSet(REFRESH, null);
  safeSet(USER, null);
};
