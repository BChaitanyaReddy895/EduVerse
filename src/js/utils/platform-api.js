import { io } from 'socket.io-client';
import { store } from './data-store.js';

const TOKEN_KEY = 'platform_token';

export function getPlatformBaseUrl() {
  return window.__PLATFORM_API_BASE__ || 'http://127.0.0.1:5001';
}

export function getToken() {
  return store.get(TOKEN_KEY, null);
}

export function setToken(token) {
  if (!token) {
    store.remove(TOKEN_KEY);
    return;
  }
  store.set(TOKEN_KEY, token);
}

async function api(path, { method = 'GET', body = null, auth = true } = {}) {
  const url = `${getPlatformBaseUrl()}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const platformApi = {
  async health() {
    return api('/api/health', { auth: false });
  },

  async signup({ email, password, display_name, preferred_language }) {
    const data = await api('/api/auth/signup', {
      method: 'POST',
      auth: false,
      body: { email, password, display_name, preferred_language },
    });
    setToken(data.token);
    store.set('platform_user', data.user);
    return data;
  },

  async login({ email, password }) {
    const data = await api('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    });
    setToken(data.token);
    store.set('platform_user', data.user);
    return data;
  },

  async me() {
    const data = await api('/api/auth/me');
    store.set('platform_user', data.user);
    return data;
  },

  logout() {
    setToken(null);
    store.remove('platform_user');
  },

  async createSession() {
    return api('/api/sessions/create', { method: 'POST', body: {} });
  },

  async joinSession(code) {
    return api('/api/sessions/join', { method: 'POST', body: { code } });
  },

  async analyzeCoach({ transcript, duration_ms, language, prompt_type }) {
    return api('/api/coach/analyze', {
      method: 'POST',
      body: { transcript, duration_ms, language, prompt_type },
    });
  },
};

export function getPlatformUser() {
  return store.get('platform_user', null);
}

export function requireAuthOrRedirect() {
  const token = getToken();
  if (!token) {
    window.location.hash = '#/auth';
    return false;
  }
  return true;
}

export function createPeerSocket() {
  return io(getPlatformBaseUrl(), {
    transports: ['websocket', 'polling'],
  });
}

