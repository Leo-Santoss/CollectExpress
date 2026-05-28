import { Carrinho } from '../types';
import api from './api';

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface AdicionarItemPayload {
  cacamba_id: string;
  quantidade: number;
  dias_aluguel: number;
}

export interface AtualizarItemPayload {
  quantidade: number;
}

// ─── Service Functions ───────────────────────────────────────────────────────

export async function obter(): Promise<Carrinho> {
  const response = await api.get<Carrinho>('/carrinho');
  return response.data;
}

export async function adicionarItem(data: AdicionarItemPayload): Promise<Carrinho> {
  const response = await api.post<Carrinho>('/carrinho/itens', data);
  return response.data;
}

export async function atualizarItem(id: string, quantidade: number): Promise<Carrinho> {
  const response = await api.put<Carrinho>(`/carrinho/itens/${id}`, { quantidade });
  return response.data;
}

export async function limpar(): Promise<void> {
  await api.delete('/carrinho');
}
