import api from './api';

// ─── Response Types ──────────────────────────────────────────────────────────

export interface DashboardMetrics {
  total_pedidos: number;
  pedidos_ativos: number;
  receita_total: number;
  nota_media: number | null;
}

export interface FinanceiroFilters {
  mes?: number;
  ano?: number;
}

export interface FinanceiroData {
  resumo_mensal: {
    total: number;
    quantidade: number;
  };
  pedidos: Array<{
    id: string;
    data_pedido: string;
    preco_final: number;
    status_aluguel: string;
    status_pagamento: string;
  }>;
}

// ─── Service Functions ───────────────────────────────────────────────────────

export async function dashboard(): Promise<DashboardMetrics> {
  const response = await api.get<DashboardMetrics>('/cacambeiros/dashboard');
  return response.data;
}

export async function financeiro(filters?: FinanceiroFilters): Promise<FinanceiroData> {
  const response = await api.get<FinanceiroData>('/cacambeiros/financeiro', {
    params: filters,
  });
  return response.data;
}
