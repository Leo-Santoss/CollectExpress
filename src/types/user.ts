export type TipoPerfil = 'CONSUMIDOR' | 'CACAMBEIRO' | 'ADMIN';

export interface User {
  id: string;
  nome_completo: string;
  email: string;
  tipo_perfil: TipoPerfil;
  documento: string;
  telefone: string;
  criado_em: string;
}

export interface DetalhesCacambeiro {
  horario_inicio: string;
  horario_fim: string;
  raio_entrega_km: number;
  taxa_entrega: number;
}
