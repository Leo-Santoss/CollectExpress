import { User } from '../types';
import api from './api';
import { PaginatedResponse } from './cacambasService';

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface UpdatePerfilPayload {
  nome_completo?: string;
  telefone?: string;
}

export interface UserFilters {
  tipo_perfil?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Service Functions ───────────────────────────────────────────────────────

export async function getPerfil(): Promise<User> {
  const response = await api.get<User>('/usuarios/perfil');
  return response.data;
}

export async function updatePerfil(data: UpdatePerfilPayload): Promise<User> {
  const response = await api.put<User>('/usuarios/perfil', data);
  return response.data;
}

export async function listarUsuarios(filters?: UserFilters): Promise<PaginatedResponse<User>> {
  const response = await api.get<PaginatedResponse<User>>('/usuarios', {
    params: filters,
  });
  return response.data;
}

export async function detalheUsuario(id: string): Promise<User> {
  const response = await api.get<User>(`/usuarios/${id}`);
  return response.data;
}
