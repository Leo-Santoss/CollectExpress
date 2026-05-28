import { Avaliacao } from './review';

export interface Cacamba {
  id: string;
  cacambeiro_id: string;
  nome: string;
  tipo_residuo: string;
  tamanho_m3: number;
  preco_diaria: number;
  foto_url: string | null;
  disponivel: boolean;
  criado_em: string;
}

export interface CacambaDetalhe extends Cacamba {
  cacambeiro: {
    nome_completo: string;
    telefone: string;
    horario_inicio: string;
    horario_fim: string;
    raio_entrega_km: number;
    nota_media: number | null;
    taxa_entrega: number;
  };
  avaliacoes: Avaliacao[];
}
