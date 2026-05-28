export interface Avaliacao {
  id: string;
  aluguel_id: string;
  consumidor_id: string;
  cacambeiro_id: string;
  nota: number;
  comentario: string | null;
  data_avaliacao: string;
  consumidor_nome?: string;
}
