import { Endereco } from '../types';
import api from './api';

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface CriarEnderecoPayload {
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade_estado: string;
}

// ─── Service Functions ───────────────────────────────────────────────────────

export async function listar(): Promise<Endereco[]> {
  const response = await api.get<Endereco[]>('/enderecos');
  return response.data;
}

export async function criar(data: CriarEnderecoPayload): Promise<Endereco> {
  const response = await api.post<Endereco>('/enderecos', data);
  return response.data;
}

export async function remover(id: string): Promise<void> {
  await api.delete(`/enderecos/${id}`);
}
