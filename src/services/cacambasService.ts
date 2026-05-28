import { Cacamba, CacambaDetalhe } from '../types';
import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CacambaFilters {
  tipo_residuo?: string;
  cacambeiro_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CriarCacambaPayload {
  nome: string;
  tipo_residuo: string;
  tamanho_m3: number;
  preco_diaria: number;
  foto_url?: string | null;
  disponivel?: boolean;
}

export interface AtualizarCacambaPayload {
  nome?: string;
  tipo_residuo?: string;
  tamanho_m3?: number;
  preco_diaria?: number;
  foto_url?: string | null;
  disponivel?: boolean;
}

// ─── Service Functions ───────────────────────────────────────────────────────

export async function listar(filters?: CacambaFilters): Promise<PaginatedResponse<Cacamba>> {
  const response = await api.get<PaginatedResponse<Cacamba>>('/cacambas', {
    params: filters,
  });
  return response.data;
}

export async function detalhe(id: string): Promise<CacambaDetalhe> {
  const response = await api.get<CacambaDetalhe>(`/cacambas/${id}`);
  return response.data;
}

export async function criar(data: CriarCacambaPayload): Promise<Cacamba> {
  const response = await api.post<Cacamba>('/cacambas', data);
  return response.data;
}

export async function atualizar(id: string, data: AtualizarCacambaPayload): Promise<Cacamba> {
  const response = await api.put<Cacamba>(`/cacambas/${id}`, data);
  return response.data;
}

export async function remover(id: string): Promise<void> {
  await api.delete(`/cacambas/${id}`);
}
