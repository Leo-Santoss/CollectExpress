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
import { Badge, Card, EmptyState, LoadingSpinner } from '../../../components/ui';
import { renderRefreshControl } from '../../../components/ui/PlatformRefreshControl';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../hooks/useTheme';
import * as cacambasService from '../../../services/cacambasService';
import { Cacamba } from '../../../types';

export default function CacambasListScreen() {
  const router = useRouter();
  const { colors, spacing, typography, radius } = useTheme();
  const { user } = useAuth();

  const [cacambas, setCacambas] = useState<Cacamba[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCacambas = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await cacambasService.listar({ cacambeiro_id: user?.id });
      // Sort by criado_em descending
      const sorted = [...response.data].sort(
        (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      );
      setCacambas(sorted);
    } catch (err: any) {
      const message =
        err?.response?.data?.mensagem ||
        err?.response?.data?.message ||
        'Não foi possível carregar suas caçambas.';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCacambas();
  }, [fetchCacambas]);

  const handleRefresh = () => {
    fetchCacambas(true);
  };

  const handleNavigateToCreate = () => {
    router.push('/(cacambeiro)/cacambas/criar');
  };

  const handleNavigateToEdit = (id: string) => {
    router.push(`/(cacambeiro)/cacambas/${id}`);
  };

  // ── Loading state ───────────────────────────────────────────────────────────

  if (isLoading && cacambas.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Carregando caçambas..." />
      </View>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error && cacambas.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Erro ao carregar"
          description={error}
          icon="alert-circle-outline"
          actionLabel="Tentar novamente"
          onActionPress={() => fetchCacambas()}
        />
      </View>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (!isLoading && cacambas.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Nenhuma caçamba cadastrada"
          description="Cadastre sua primeira caçamba para começar a receber pedidos."
          icon="cube-outline"
          actionLabel="Cadastrar Caçamba"
          onActionPress={handleNavigateToCreate}
        />
      </View>
    );
  }

  // ── List ────────────────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Cacamba }) => (
    <TouchableOpacity
      onPress={() => handleNavigateToEdit(item.id)}
      activeOpacity={0.7}
      accessibilityLabel={`Caçamba ${item.nome}, ${item.tipo_residuo}, ${item.tamanho_m3}m³`}
      accessibilityRole="button"
    >
      <Card style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <View style={styles.itemHeader}>
          <Text
            style={{
              fontSize: typography.fontSizeMd,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.nome}
          </Text>
          <Badge
            label={item.disponivel ? 'Disponível' : 'Indisponível'}
            variant={item.disponivel ? 'success' : 'warning'}
          />
        </View>

        <View style={[styles.itemDetails, { marginTop: spacing.sm }]}>
          <View style={styles.detailRow}>
            <Ionicons name="trash-outline" size={14} color={colors.textSecondary} />
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                color: colors.textSecondary,
                marginLeft: spacing.xs,
              }}
            >
              {item.tipo_residuo}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="resize-outline" size={14} color={colors.textSecondary} />
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                color: colors.textSecondary,
                marginLeft: spacing.xs,
              }}
            >
              {item.tamanho_m3} m³
            </Text>
          </View>
        </View>

        <View style={[styles.priceRow, { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }]}>
          <Text
            style={{
              fontSize: typography.fontSizeLg,
              fontFamily: typography.fontFamilyBold,
              color: colors.primaryGreen,
            }}
          >
            R$ {Number(item.preco_diaria).toFixed(2)}
          </Text>
          <Text
            style={{
              fontSize: typography.fontSizeXs,
              color: colors.textSecondary,
            }}
          >
            / dia
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={cacambas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={renderRefreshControl({
            refreshing: isRefreshing,
            onRefresh: handleRefresh,
            colors: [colors.primaryGreen],
            tintColor: colors.primaryGreen,
        })}
      />

      {/* FAB - Floating Action Button */}
      <TouchableOpacity
        onPress={handleNavigateToCreate}
        activeOpacity={0.8}
        accessibilityLabel="Cadastrar nova caçamba"
        accessibilityRole="button"
        style={[
          styles.fab,
          {
            backgroundColor: colors.primaryGreen,
            borderRadius: radius.lg * 2,
          },
        ]}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
});
