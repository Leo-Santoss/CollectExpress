import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Card, EmptyState, LoadingSpinner, StatusChip } from '../../../components/ui';
import { renderRefreshControl } from '../../../components/ui/PlatformRefreshControl';
import { useTheme } from '../../../hooks/useTheme';
import * as alugueisService from '../../../services/alugueisService';
import { Pedido } from '../../../types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('pt-BR');

export default function PedidosScreen() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPedidos = useCallback(async () => {
    setError(null);
    try {
      const data = await alugueisService.gestaoPedidos();
      setPedidos(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Não foi possível carregar os pedidos.';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPedidos();
  }, [fetchPedidos]);

  const handleOrderPress = (pedido: Pedido) => {
    router.push(`/(cacambeiro)/pedidos/${pedido.id}`);
  };

  // ── Loading state ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Carregando pedidos..." />
      </View>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Acesso Negado"
          description={error}
          actionLabel="Voltar para a tela de login"
          onActionPress={() => router.replace('/(auth)/login')}
          icon="lock-closed-outline"
        />
      </View>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (pedidos.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Nenhum pedido"
          description="Você ainda não possui pedidos para gerenciar."
          icon="clipboard-outline"
        />
      </View>
    );
  }

  // ── Order list ──────────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Pedido }) => {
    const endereco = [
      (item as any).logradouro,
      (item as any).numero,
      (item as any).bairro,
    ]
      .filter(Boolean)
      .join(', ');

    return (
      <TouchableOpacity
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Pedido de ${(item as any).consumidor_nome || 'consumidor'}, status ${item.status_aluguel}`}
      >
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.cardHeader}>
            <StatusChip status={item.status_aluguel} />
            <Text
              style={{
                fontSize: typography.fontSizeXs,
                color: colors.textSecondary,
              }}
            >
              {formatDate(item.data_inicio)}
            </Text>
          </View>

          <Text
            style={{
              fontSize: typography.fontSizeSm,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              marginTop: spacing.sm,
            }}
            numberOfLines={1}
          >
            {(item as any).consumidor_nome || 'Consumidor'}
          </Text>

          {endereco ? (
            <View style={[styles.infoRow, { marginTop: spacing.xs }]}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: typography.fontSizeXs,
                  color: colors.textSecondary,
                  marginLeft: spacing.xs,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {endereco}
              </Text>
            </View>
          ) : null}

          <View style={[styles.cardFooter, { marginTop: spacing.sm }]}>
            <Text
              style={{
                fontSize: typography.fontSizeXs,
                color: colors.textSecondary,
              }}
            >
              {item.dias_aluguel} {item.dias_aluguel === 1 ? 'dia' : 'dias'}
            </Text>
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                fontFamily: typography.fontFamilyBold,
                color: colors.primaryGreen,
              }}
            >
              {formatCurrency(item.preco_final)}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg }}
        showsVerticalScrollIndicator={false}
        refreshControl={renderRefreshControl({
            refreshing: isRefreshing,
            onRefresh: handleRefresh,
            colors: [colors.primaryGreen],
            tintColor: colors.primaryGreen,
        })}
      />
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
