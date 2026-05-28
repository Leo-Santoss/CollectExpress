import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { router } from 'expo-router';
import {
    clearStoredToken,
    getStoredToken,
    onAuthExpired,
    setStoredToken,
} from '../services/api';
import {
    login as authLogin,
    register as authRegister,
    RegisterPayload,
} from '../services/authService';
import { User } from '../types';

// ─── Context Interface ───────────────────────────────────────────────────────

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login(email: string, senha: string): Promise<void>;
  register(data: RegisterPayload): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Decode the payload section of a JWT token (base64url → JSON).
 * Returns null if the token is malformed or cannot be parsed.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check whether a JWT token is expired based on its `exp` claim.
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
}

/**
 * Extract a User object from the JWT payload.
 * The API stores id and tipo_perfil in the token; other fields are set
 * to empty strings until a full profile fetch is done.
 */
function extractUserFromToken(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const id = payload.id ?? payload.usuario_id ?? payload.sub;
  const tipo_perfil = payload.tipo_perfil;

  if (typeof id !== 'string' || typeof tipo_perfil !== 'string') return null;

  return {
    id: id as string,
    nome_completo: (payload.nome_completo as string) ?? '',
    email: (payload.email as string) ?? '',
    tipo_perfil: tipo_perfil as User['tipo_perfil'],
    documento: (payload.documento as string) ?? '',
    telefone: (payload.telefone as string) ?? '',
    criado_em: (payload.criado_em as string) ?? '',
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Logout ──────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    await clearStoredToken();
    setUser(null);
    setToken(null);
    router.replace('/(auth)/login');
  }, []);

  // ── Check stored token on mount ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const storedToken = await getStoredToken();

        if (!storedToken) return;

        if (isTokenExpired(storedToken)) {
          await clearStoredToken();
          return;
        }

        const extractedUser = extractUserFromToken(storedToken);
        if (!extractedUser) {
          await clearStoredToken();
          return;
        }

        if (!cancelled) {
          setToken(storedToken);
          setUser(extractedUser);
        }
      } catch {
        await clearStoredToken();
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Subscribe to auth expired events (401) ──────────────────────────────────

  useEffect(() => {
    const unsubscribe = onAuthExpired(() => {
      logout();
    });

    return unsubscribe;
  }, [logout]);

  // ── Login ───────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, senha: string) => {
    const response = await authLogin(email, senha);
    await setStoredToken(response.token);
    setToken(response.token);
    setUser(response.usuario);
  }, []);

  // ── Register ────────────────────────────────────────────────────────────────

  const register = useCallback(async (data: RegisterPayload) => {
    await authRegister(data);
    // Auto-login after successful registration
    await login(data.email, data.senha);
  }, [login]);

  // ── Context value ───────────────────────────────────────────────────────────

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, register, logout }),
    [user, token, isLoading, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
