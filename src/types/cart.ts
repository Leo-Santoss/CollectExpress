import { Cacamba } from './cacamba';

export interface ItemCarrinho {
  id: string;
  cacamba_id: string;
  quantidade: number;
  dias_aluguel: number;
  cacamba?: Cacamba;
}

export interface Carrinho {
  id: string;
  consumidor_id: string;
  cacambeiro_id: string;
  itens: ItemCarrinho[];
}
