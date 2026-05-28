export type StatusAluguel =
  | 'AGUARDANDO_ENTREGA'
  | 'EM_USO'
  | 'AGUARDANDO_RETIRADA'
  | 'FINALIZADO';

export type StatusPagamento = 'PENDENTE' | 'PAGO';

export interface Pedido {
  id: string;
  consumidor_id: string;
  cacambeiro_id: string;
  endereco_id: string;
  data_pedido: string;
  data_inicio: string;
  dias_aluguel: number;
  preco_final: number;
  status_pagamento: StatusPagamento;
  status_aluguel: StatusAluguel;
}
