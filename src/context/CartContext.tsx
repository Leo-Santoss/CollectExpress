import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';

import * as carrinhoService from '../services/carrinhoService';
import { Carrinho } from '../types';
import { useAuth } from './AuthContext';

// ─── Context Interface ───────────────────────────────────────────────────────

export interface CartContextValue {
  cart: Carrinho | null;
  itemCount: number;
  total: number;
  isLoading: boolean;
  addItem(cacamba_id: string, quantidade: number, diasAluguel: number): Promise<void>;
  updateItem(itemId: string, quantidade: number): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  clearCart(): Promise<void>;
  refreshCart(): Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Carrinho | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();

  // ── Refresh cart from API ───────────────────────────────────────────────────

  const refreshCart = useCallback(async () => {
    if (!user || user.tipo_perfil !== 'CONSUMIDOR') return;
    
    setIsLoading(true);
    try {
      const data = await carrinhoService.obter();
      setCart(data);
    } catch {
      // Cart may not exist yet (404), treat as empty
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load cart on mount ──────────────────────────────────────────────────────

  useEffect(() => {
    if (user && user.tipo_perfil === 'CONSUMIDOR') {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [refreshCart, user]);

  // ── Add item to cart ────────────────────────────────────────────────────────

  const addItem = useCallback(
    async (cacamba_id: string, quantidade: number, diasAluguel: number) => {
      setIsLoading(true);
      try {
        const updatedCart = await carrinhoService.adicionarItem({
          cacamba_id,
          quantidade,
          dias_aluguel: diasAluguel,
        });
        setCart(updatedCart);
      } catch (error: any) {
        // Handle single-cacambeiro constraint (409 from API)
        const status = error?.response?.status;
        const message = error?.response?.data?.mensagem || error?.response?.data?.message;

        if (status === 409 || (message && message.toLowerCase().includes('cacambeiro'))) {
          // Show warning dialog for single-cacambeiro constraint
          return new Promise<void>((resolve, reject) => {
            Alert.alert(
              'Fornecedor diferente',
              'Todos os itens do carrinho devem ser do mesmo fornecedor. Deseja limpar o carrinho e adicionar este item?',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel',
                  onPress: () => {
                    setIsLoading(false);
                    reject(new Error('Ação cancelada pelo usuário'));
                  },
                },
                {
                  text: 'Limpar e adicionar',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await carrinhoService.limpar();
                      const newCart = await carrinhoService.adicionarItem({
                        cacamba_id,
                        quantidade,
                        dias_aluguel: diasAluguel,
                      });
                      setCart(newCart);
                      resolve();
                    } catch {
                      reject(new Error('Erro ao limpar carrinho e adicionar item'));
                    } finally {
                      setIsLoading(false);
                    }
                  },
                },
              ]
            );
          });
        }

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── Update item quantity ────────────────────────────────────────────────────

  const updateItem = useCallback(async (itemId: string, quantidade: number) => {
    if (quantidade < 1 || quantidade > 10) return;
    setIsLoading(true);
    try {
      const updatedCart = await carrinhoService.atualizarItem(itemId, quantidade);
      setCart(updatedCart);
    } catch {
      // Refresh to get consistent state
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  }, [refreshCart]);

  // ── Remove item ─────────────────────────────────────────────────────────────

  const removeItem = useCallback(async (itemId: string) => {
    setIsLoading(true);
    try {
      await carrinhoService.removerItem(itemId);
      await refreshCart();
    } catch {
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  }, [refreshCart]);

  // ── Clear cart ──────────────────────────────────────────────────────────────

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      await carrinhoService.limpar();
      setCart(null);
    } catch {
      // Refresh to get consistent state
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  }, [refreshCart]);

  // ── Computed values ─────────────────────────────────────────────────────────

  const itemCount = useMemo(() => {
    if (!cart || !cart.itens) return 0;
    return cart.itens.reduce((sum, item) => sum + item.quantidade, 0);
  }, [cart]);

  const total = useMemo(() => {
    if (!cart || !cart.itens) return 0;
    return cart.itens.reduce((sum, item) => {
      const preco = Number(item.cacamba?.preco_diaria ?? 0);
      return sum + item.quantidade * item.dias_aluguel * preco;
    }, 0);
  }, [cart]);

  // ── Context value ───────────────────────────────────────────────────────────

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      itemCount,
      total,
      isLoading,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      refreshCart,
    }),
    [cart, itemCount, total, isLoading, addItem, updateItem, removeItem, clearCart, refreshCart]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
