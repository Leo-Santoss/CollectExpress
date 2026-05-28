import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Badge, Card, EmptyState, LoadingSpinner, StatusChip } from '../../../components/ui';
import { renderRefreshControl } from '../../../components/ui/PlatformRefreshControl';
import { useDebounce } from '../../../hooks/useDebounce';
import { useTheme } from '../../../hooks/useTheme';
import * as alugueisService from '../../../services/alugueisService';
import { StatusAluguel, StatusPagamento } from '../../../types';

// ─── Filter Options ──────────────────────────────────────────────────────────

const STATUS_ALUGUEL_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Todos', value: '' },
  { label: 'Aguardando Entrega', value: 'AGUARDANDO_ENTREGA' },
  { label: 'Em Uso', value: 'EM_USO' },
  { label: 'Aguardando Retirada', value: 'AGUARDANDO_RETIRADA' },
  { label: 'Finalizado', value: 'FINALIZADO' },
];

const STATUS_PAGAMENTO_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Todos', value: '' },
  { label: 'Pendente', value: 'PENDENTE' },
  { label: 'Pago', value: 'PAGO' },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface PedidoListItem {
  id: string;
  consumidor_id: string;
  cacambeiro_id: string;
  status_aluguel: StatusAluguel;
  status_pagamento: StatusPagamento;
  preco_final: number;
  data_pedido: string;
  data_inicio: string;
  dias_aluguel: number;
  consumidor_nome: string;
  cacambeiro_nome: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade_estado: string;
  cep: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

function getPagamentoBadgeVariant(status: StatusPagamento): 'success' | 'warning' | 'default' {
  switch (status) {
    case 'PAGO':
      return 'success';
    case 'PENDENTE':
      return 'warning';
    default:
      return 'default';
  }
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function PedidosScreen() {
  const router = useRouter();
  const { colors, spacing, typography, radius } = useTheme();

  // State
  const [pedidos, setPedidos] = useState<PedidoListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusAluguel, setStatusAluguel] = useState('');
  const [statusPagamento, setStatusPagamento] = useState('');

  const debouncedSearch = useDebounce(searchText, 300);

  // Fetch orders
  const fetchPedidos = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const params: alugueisService.OrderFilters = {
          page: pageNum,
          limit: 20,
        };

        if (statusAluguel) {
          params.status_aluguel = statusAluguel as StatusAluguel;
        }

        if (statusPagamento) {
          params.status_pagamento = statusPagamento;
        }

        if (debouncedSearch.length >= 1) {
          params.search = debouncedSearch;
        }

        const response = await alugueisService.listarTodos(params);

        const data = response.data as unknown as PedidoListItem[];

        if (reset) {
          setPedidos(data);
        } else {
          setPedidos((prev) => [...prev, ...data]);
        }

        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotal(response.total);
      } catch {
        setError('Não foi possível carregar os pedidos. Tente novamente.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [statusAluguel, statusPagamento, debouncedSearch]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchPedidos(1, true);
  }, [statusAluguel, statusPagamento, debouncedSearch]);

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPage(1);
    fetchPedidos(1, true);
  }, [fetchPedidos]);

  // Load more (infinite scroll)
  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      fetchPedidos(page + 1, false);
    }
  };

  // Retry
  const handleRetry = () => {
    setPage(1);
    fetchPedidos(1, true);
  };

  // Navigate to detail
  const handlePedidoPress = (id: string) => {
    router.push(`/(admin)/pedidos/${id}`);
  };

  // Render order item
  const renderPedidoItem = ({ item }: { item: PedidoListItem }) => (
    <TouchableOpacity
      onPress={() => handlePedidoPress(item.id)}
      accessibilityLabel={`Pedido de ${item.consumidor_nome}`}
      accessibilityRole="button"
      activeOpacity={0.7}
    >
      <Card style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md }}>
        {/* Consumer & Cacambeiro names */}
        <View style={styles.orderRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: typography.fontSizeMd,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
                marginBottom: spacing.xs,
              }}
              numberOfLines={1}
            >
              {item.consumidor_nome}
            </Text>
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                color: colors.textSecondary,
                marginBottom: spacing.sm,
              }}
              numberOfLines={1}
            >
              Caçambeiro: {item.cacambeiro_nome}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
          />
        </View>

        {/* Status chips */}
        <View style={[styles.statusRow, { marginBottom: spacing.sm }]}>
          <StatusChip status={item.status_aluguel} />
          <Badge
            label={item.status_pagamento === 'PAGO' ? 'Pago' : 'Pendente'}
            variant={getPagamentoBadgeVariant(item.status_pagamento)}
            style={{ marginLeft: spacing.sm }}
          />
        </View>

        {/* Price and date */}
        <View style={styles.footerRow}>
          <Text
            style={{
              fontSize: typography.fontSizeMd,
              fontFamily: typography.fontFamilyBold,
              color: colors.primaryGreen,
            }}
          >
            {formatCurrency(item.preco_final)}
          </Text>
          <Text
            style={{
              fontSize: typography.fontSizeXs,
              color: colors.textSecondary,
            }}
          >
            {formatDate(item.data_pedido)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Footer (load more indicator)
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primaryGreen} />
      </View>
    );
  };

  // Empty state
  const renderEmpty = () => {
    if (loading) return null;
    return (
      <EmptyState
        title="Nenhum pedido encontrado"
        description={
          debouncedSearch.length >= 1 || statusAluguel || statusPagamento
            ? 'Tente ajustar os filtros ou o termo de busca.'
            : 'Nenhum pedido cadastrado no sistema.'
        }
        icon="receipt-outline"
      />
    );
  };

  // Error state
  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.error} />
        <Text
          style={{
            fontSize: typography.fontSizeMd,
            color: colors.textPrimary,
            marginTop: spacing.md,
            marginBottom: spacing.lg,
            textAlign: 'center',
            paddingHorizontal: spacing.xl,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          accessibilityLabel="Voltar para a tela de login"
          accessibilityRole="button"
          style={[
            styles.retryButton,
            {
              backgroundColor: colors.primaryGreen,
              borderRadius: radius.md,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
            },
          ]}
        >
          <Text
            style={{
              fontSize: typography.fontSizeMd,
              fontFamily: typography.fontFamilyBold,
              color: colors.textInverse,
            }}
          >
            Voltar para a tela de login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
        <Text
          style={{
            fontSize: typography.fontSize.xl,
            fontFamily: typography.fontFamilyBold,
            color: colors.textPrimary,
          }}
        >
          Pedidos
        </Text>
        {total > 0 && (
          <Text style={{ fontSize: typography.fontSizeSm, color: colors.textSecondary }}>
            {total} {total === 1 ? 'pedido' : 'pedidos'}
          </Text>
        )}
      </View>

      {/* Search Input */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar por consumidor ou caçambeiro (mín. 1 caractere)"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.searchInput,
              {
                color: colors.textPrimary,
                fontSize: typography.fontSizeSm,
                marginLeft: spacing.sm,
              },
            ]}
            accessibilityLabel="Buscar pedidos"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              accessibilityLabel="Limpar busca"
              accessibilityRole="button"
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Aluguel Filter */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
        <FlatList
          horizontal
          data={STATUS_ALUGUEL_OPTIONS}
          keyExtractor={(item) => `aluguel-${item.value}`}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setStatusAluguel(item.value)}
              accessibilityLabel={`Filtrar aluguel: ${item.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: statusAluguel === item.value }}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    statusAluguel === item.value ? colors.primaryGreen : colors.surface,
                  borderRadius: radius.pill,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  marginRight: spacing.sm,
                  borderWidth: 1,
                  borderColor:
                    statusAluguel === item.value ? colors.primaryGreen : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: typography.fontSizeXs,
                  fontFamily:
                    statusAluguel === item.value
                      ? typography.fontFamilyBold
                      : typography.fontFamilyRegular,
                  color:
                    statusAluguel === item.value ? colors.textInverse : colors.textPrimary,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Status Pagamento Filter */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
        <FlatList
          horizontal
          data={STATUS_PAGAMENTO_OPTIONS}
          keyExtractor={(item) => `pagamento-${item.value}`}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setStatusPagamento(item.value)}
              accessibilityLabel={`Filtrar pagamento: ${item.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: statusPagamento === item.value }}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    statusPagamento === item.value ? colors.primaryGreen : colors.surface,
                  borderRadius: radius.pill,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  marginRight: spacing.sm,
                  borderWidth: 1,
                  borderColor:
                    statusPagamento === item.value ? colors.primaryGreen : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: typography.fontSizeXs,
                  fontFamily:
                    statusPagamento === item.value
                      ? typography.fontFamilyBold
                      : typography.fontFamilyRegular,
                  color:
                    statusPagamento === item.value ? colors.textInverse : colors.textPrimary,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.centered}>
          <LoadingSpinner message="Carregando pedidos..." />
        </View>
      ) : (
        /* Order List */
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id}
          renderItem={renderPedidoItem}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxxl }}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          refreshControl={renderRefreshControl({
            refreshing: isRefreshing,
            onRefresh: handleRefresh,
            colors: [colors.primaryGreen],
            tintColor: colors.primaryGreen,
          })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  filterButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
