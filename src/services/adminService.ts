import { Categoria } from '../types';
import api from './api';

// ─── Response Types ──────────────────────────────────────────────────────────

export interface OrderOverTimeEntry {
  date: string;
  count: number;
}

export interface AdminDashboardData {
  total_usuarios: number;
  total_pedidos: number;
  receita_total: number;
  lucro_plataforma: number;
  cacambeiros_ativos: number;
  pedidos_por_status: Record<string, number>;
  pedidos_ao_longo_do_tempo: OrderOverTimeEntry[];
}

export interface AdminDashboardParams {
  granularity?: 'daily' | 'weekly';
}

export interface CriarCategoriaPayload {
  nome: string;
}

export interface AtualizarCategoriaPayload {
  nome: string;
}

// ─── Service Functions ───────────────────────────────────────────────────────

export async function dashboard(params?: AdminDashboardParams): Promise<AdminDashboardData> {
  const response = await api.get<AdminDashboardData>('/admin/dashboard', { params });
  return response.data;
}

export async function listarCategorias(): Promise<Categoria[]> {
  const response = await api.get<Categoria[]>('/admin/categorias');
  return response.data;
}

export async function criarCategoria(data: CriarCategoriaPayload): Promise<Categoria> {
  const response = await api.post<Categoria>('/admin/categorias', data);
  return response.data;
}

export async function atualizarCategoria(id: string, data: AtualizarCategoriaPayload): Promise<Categoria> {
  const response = await api.put<Categoria>(`/admin/categorias/${id}`, data);
  return response.data;
}

export async function removerCategoria(id: string): Promise<void> {
  await api.delete(`/admin/categorias/${id}`);
}
