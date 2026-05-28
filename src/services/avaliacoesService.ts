import { Avaliacao } from '../types';
import api from './api';

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface CriarAvaliacaoPayload {
  aluguel_id: string;
  nota: number;
  comentario?: string | null;
}

// ─── Service Functions ───────────────────────────────────────────────────────

export async function criar(data: CriarAvaliacaoPayload): Promise<Avaliacao> {
  const response = await api.post<Avaliacao>('/avaliacoes', data);
  return response.data;
}

export async function listarPorCacambeiro(cacambeiroId: string): Promise<Avaliacao[]> {
  const response = await api.get<Avaliacao[]>(`/avaliacoes/cacambeiro/${cacambeiroId}`);
  return response.data;
}
