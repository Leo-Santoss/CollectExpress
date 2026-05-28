import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Card, EmptyState, LoadingSpinner, StatusChip } from '../../../components/ui';
import { renderRefreshControl } from '../../../components/ui/PlatformRefreshControl';
import { useTheme } from '../../../hooks/useTheme';
import * as alugueisService from '../../../services/alugueisService';
import type { Pedido, StatusPagamento } from '../../../types';

// Extended type for listing that includes cacambeiro name from API
interface PedidoListItem extends Pedido {
  cacambeiro_nome?: string;
}

const PAGE_SIZE = 20;

const PAGAMENTO_LABELS: Record<StatusPagamento, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
};

export default function PedidosScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [pedidos, setPedidos] = useState<PedidoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch orders
  const fetchPedidos = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      if (pageNum === 1 && !isRefresh) {
        setIsLoading(true);
      }
      setError(null);

      const response = await alugueisService.meusPedidos(pageNum);

      if (pageNum === 1) {
        setPedidos(response.data as PedidoListItem[]);
      } else {
        setPedidos((prev) => [...prev, ...(response.data as PedidoListItem[])]);
      }

      setTotalPages(response.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError('Não foi possível carregar seus pedidos. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPedidos(1);
  }, [fetchPedidos]);

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPedidos(1, true);
  }, [fetchPedidos]);

  // Load more (pagination)
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    fetchPedidos(page + 1);
  }, [isLoadingMore, page, totalPages, fetchPedidos]);

  // Retry on error
  const handleRetry = useCallback(() => {
    fetchPedidos(1);
  }, [fetchPedidos]);

  // Navigate to order detail
  const handleOrderPress = useCallback((id: string) => {
    router.push(`/(consumer)/pedidos/${id}`);
  }, []);

  // Format price
  const formatPrice = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Render order card
  const renderItem = useCallback(
    ({ item }: { item: PedidoListItem }) => (
      <TouchableOpacity
        onPress={() => handleOrderPress(item.id)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Pedido de ${formatDate(item.data_inicio)}, ${formatPrice(item.preco_final)}, status ${item.status_aluguel}`}
      >
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.cardHeader}>
            <StatusChip status={item.status_aluguel} />
            <Badge
              label={PAGAMENTO_LABELS[item.status_pagamento]}
              variant={item.status_pagamento === 'PAGO' ? 'success' : 'warning'}
            />
          </View>

          <View style={[styles.cardBody, { marginTop: spacing.md }]}>
            <View style={styles.cardRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.textSecondary,
                  marginLeft: spacing.xs,
                }}
              >
                Início: {formatDate(item.data_inicio)}
              </Text>
            </View>

            <View style={[styles.cardRow, { marginTop: spacing.xs }]}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.textSecondary,
                  marginLeft: spacing.xs,
                }}
              >
                {item.dias_aluguel} {item.dias_aluguel === 1 ? 'dia' : 'dias'} de aluguel
              </Text>
            </View>

            <View style={[styles.cardRow, { marginTop: spacing.xs }]}>
              <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: typography.fontSize.md,
                  fontFamily: typography.fontFamilyBold,
                  color: colors.primaryGreen,
                  marginLeft: spacing.xs,
                }}
              >
                {formatPrice(item.preco_final)}
              </Text>
            </View>

            {item.cacambeiro_nome && (
              <View style={[styles.cardRow, { marginTop: spacing.xs }]}>
                <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                <Text
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.textSecondary,
                    marginLeft: spacing.xs,
                  }}
                  numberOfLines={1}
                >
                  {item.cacambeiro_nome}
                </Text>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    ),
    [colors, spacing, typography, handleOrderPress]
  );

  // Render footer (loading more indicator)
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: spacing.lg }}>
        <LoadingSpinner size="small" message="Carregando mais pedidos..." />
      </View>
    );
  };

  // Loading state (initial)
  if (isLoading && pedidos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
          <Text
            style={{
              fontSize: typography.fontSize.xl,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
            }}
          >
            Meus Pedidos
          </Text>
        </View>
        <View style={styles.centered}>
          <LoadingSpinner message="Carregando pedidos..." />
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <EmptyState
            title="Acesso Negado"
            description={error}
            actionLabel="Voltar para a tela de login"
            onActionPress={() => router.replace('/(auth)/login')}
            icon="lock-closed-outline"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <Text
          style={{
            fontSize: typography.fontSize.xl,
            fontFamily: typography.fontFamilyBold,
            color: colors.textPrimary,
          }}
        >
          Meus Pedidos
        </Text>
      </View>

      <FlatList
        data={pedidos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <EmptyState
            title="Nenhum pedido encontrado"
            description="Você ainda não realizou nenhum pedido. Explore o marketplace para alugar caçambas."
            icon="receipt-outline"
            actionLabel="Explorar marketplace"
            onActionPress={() => router.push('/(consumer)/(home)')}
          />
        }
        refreshControl={renderRefreshControl({
            refreshing: isRefreshing,
            onRefresh: handleRefresh,
            colors: [colors.primaryGreen],
            tintColor: colors.primaryGreen,
        })}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBody: {
    flexDirection: 'column',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
