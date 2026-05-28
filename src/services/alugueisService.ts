import { Pedido, StatusAluguel } from '../types';
import api from './api';
import { PaginatedResponse } from './cacambasService';

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface CheckoutPayload {
  endereco_id: string;
  data_inicio: string;
  dias_aluguel: number;
}

export interface OrderFilters {
  status_aluguel?: StatusAluguel;
  status_pagamento?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Service Functions ───────────────────────────────────────────────────────

export async function checkout(data: CheckoutPayload): Promise<Pedido> {
  const response = await api.post<Pedido>('/alugueis/checkout', data);
  return response.data;
}

export async function meusPedidos(page: number = 1): Promise<PaginatedResponse<Pedido>> {
  const response = await api.get<PaginatedResponse<Pedido>>('/alugueis/meus', {
    params: { page },
  });
  return response.data;
}

export async function gestaoPedidos(): Promise<Pedido[]> {
  const response = await api.get<Pedido[]>('/alugueis/gestao');
  return response.data;
}

export async function atualizarStatus(id: string, status: StatusAluguel): Promise<Pedido> {
  const response = await api.patch<Pedido>(`/alugueis/${id}/status`, { status_aluguel: status });
  return response.data;
}

export async function listarTodos(filters?: OrderFilters): Promise<PaginatedResponse<Pedido>> {
  const response = await api.get<PaginatedResponse<Pedido>>('/alugueis', {
    params: filters,
  });
  return response.data;
}
