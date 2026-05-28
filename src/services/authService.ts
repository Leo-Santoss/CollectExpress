import { TipoPerfil, User } from '../types';
import api from './api';

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  nome_completo: string;
  email: string;
  senha: string;
  tipo_perfil: TipoPerfil;
  documento: string;
  telefone: string;
  // Campos adicionais para CACAMBEIRO
  horario_inicio?: string;
  horario_fim?: string;
  raio_entrega_km?: number;
  taxa_entrega?: number;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface ResetPasswordPayload {
  token: string;
  nova_senha: string;
}

// ─── Responses ───────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  usuario: User;
}

export interface RegisterResponse {
  usuario: User;
}

// ─── Service Functions ───────────────────────────────────────────────────────

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { email, senha });
  return response.data;
}

export async function register(data: RegisterPayload): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/auth/register', data);
  return response.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, nova_senha: string): Promise<void> {
  await api.post('/auth/reset-password', { token, nova_senha });
}
