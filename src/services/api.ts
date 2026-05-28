import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ─── Configuration ───────────────────────────────────────────────────────────

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const TIMEOUT_MS = 15000;

const TOKEN_STORAGE_KEY = '@collectexpress:token';

// ─── Toast Event System ──────────────────────────────────────────────────────

type ToastListener = (message: string) => void;

const toastListeners: Set<ToastListener> = new Set();

/**
 * Subscribe to toast notifications.
 * Returns an unsubscribe function.
 */
export function onToast(listener: ToastListener): () => void {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

function emitToast(message: string): void {
  toastListeners.forEach((listener) => listener(message));
}

// ─── Auth Event System ───────────────────────────────────────────────────────

type AuthExpiredListener = () => void;

const authExpiredListeners: Set<AuthExpiredListener> = new Set();

/**
 * Subscribe to auth expiration events (401 responses).
 * Returns an unsubscribe function.
 */
export function onAuthExpired(listener: AuthExpiredListener): () => void {
  authExpiredListeners.add(listener);
  return () => {
    authExpiredListeners.delete(listener);
  };
}

function emitAuthExpired(): void {
  authExpiredListeners.forEach((listener) => listener());
}

// ─── Token Helpers ───────────────────────────────────────────────────────────

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}

// ─── Axios Instance ──────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: JWT Injection ──────────────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Error Handling ────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Timeout error
    if (error.code === 'ECONNABORTED') {
      emitToast('Servidor demorou para responder. Tente novamente.');
      return Promise.reject(error);
    }

    // Network error (no response received)
    if (!error.response) {
      emitToast('Erro de conexão. Verifique sua internet.');
      return Promise.reject(error);
    }

    const status = error.response.status;

    // 401 Unauthorized → clear token + redirect to login
    if (status === 401) {
      await clearStoredToken();
      emitAuthExpired();
      return Promise.reject(error);
    }

    // 5xx Server errors
    if (status >= 500) {
      emitToast('Erro interno do servidor. Tente novamente mais tarde.');
      return Promise.reject(error);
    }

    // Other errors (4xx) are passed through without toast
    return Promise.reject(error);
  }
);

export default api;
