import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../components/ui';
import { useTheme } from '../../hooks/useTheme';
import type { DashboardMetrics } from '../../services/cacambeirosService';
import * as cacambeirosService from '../../services/cacambeirosService';

export default function DashboardScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await cacambeirosService.dashboard();
      setMetrics(data);
    } catch {
      setError('Não foi possível carregar o dashboard. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleNavigateCacambas = () => {
    router.push('/(cacambeiro)/cacambas');
  };

  const handleNavigatePedidos = () => {
    router.push('/(cacambeiro)/pedidos');
  };

  // Skeleton loading state
  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
        accessibilityLabel="Carregando dashboard"
      >
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }]}>
          <Text
            style={{
              fontSize: typography.fontSize.xl,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
            }}
          >
            Dashboard
          </Text>
        </View>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
        >
          <View style={styles.metricsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.skeletonCard,
                  {
                    backgroundColor: colors.skeleton,
                    borderRadius: radius.lg,
                    padding: spacing.lg,
                  },
                ]}
              >
                <View
                  style={[
                    styles.skeletonLine,
                    { backgroundColor: colors.surfaceVariant, borderRadius: radius.sm, width: '60%', height: 14 },
                  ]}
                />
                <View
                  style={[
                    styles.skeletonLine,
                    { backgroundColor: colors.surfaceVariant, borderRadius: radius.sm, width: '40%', height: 24, marginTop: spacing.sm },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={{ marginTop: spacing.xl }}>
            <View
              style={[
                styles.skeletonCard,
                {
                  backgroundColor: colors.skeleton,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  height: 56,
                  marginBottom: spacing.md,
                },
              ]}
            />
            <View
              style={[
                styles.skeletonCard,
                {
                  backgroundColor: colors.skeleton,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  height: 56,
                },
              ]}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      >
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }]}>
          <Text
            style={{
              fontSize: typography.fontSize.xl,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
            }}
          >
            Dashboard
          </Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text
            style={{
              fontSize: typography.fontSize.md,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: spacing.md,
              marginHorizontal: spacing.xl,
            }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchDashboard}
            style={[
              styles.retryButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                marginTop: spacing.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
          >
            <Text
              style={{
                fontSize: typography.fontSize.md,
                fontFamily: typography.fontFamilyMedium,
                color: colors.textInverse,
              }}
            >
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }]}>
        <Text
          style={{
            fontSize: typography.fontSize.xl,
            fontFamily: typography.fontFamilyBold,
            color: colors.textPrimary,
          }}
        >
          Dashboard
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Metric Cards - 2x2 Grid */}
        <View style={styles.metricsGrid}>
          {/* Total de Pedidos */}
          <Card
            style={styles.metricCard}
            accessibilityLabel={`Total de Pedidos: ${metrics?.total_pedidos ?? 0}`}
          >
            <View style={styles.metricIconRow}>
              <Ionicons name="receipt-outline" size={20} color={colors.info} />
            </View>
            <Text
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.textSecondary,
                marginTop: spacing.sm,
              }}
            >
              Total de Pedidos
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
                marginTop: spacing.xs,
              }}
            >
              {metrics?.total_pedidos ?? 0}
            </Text>
          </Card>

          {/* Pedidos Ativos */}
          <Card
            style={styles.metricCard}
            accessibilityLabel={`Pedidos Ativos: ${metrics?.pedidos_ativos ?? 0}`}
          >
            <View style={styles.metricIconRow}>
              <Ionicons name="time-outline" size={20} color={colors.warning} />
            </View>
            <Text
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.textSecondary,
                marginTop: spacing.sm,
              }}
            >
              Pedidos Ativos
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
                marginTop: spacing.xs,
              }}
            >
              {metrics?.pedidos_ativos ?? 0}
            </Text>
          </Card>

          {/* Receita Total */}
          <Card
            style={styles.metricCard}
            accessibilityLabel={`Receita Total: ${metrics ? formatCurrency(metrics.receita_total) : 'R$ 0,00'}`}
          >
            <View style={styles.metricIconRow}>
              <Ionicons name="wallet-outline" size={20} color={colors.success} />
            </View>
            <Text
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.textSecondary,
                marginTop: spacing.sm,
              }}
            >
              Receita Total
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
                marginTop: spacing.xs,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {metrics ? formatCurrency(metrics.receita_total) : 'R$ 0,00'}
            </Text>
          </Card>

          {/* Nota Média */}
          <Card
            style={styles.metricCard}
            accessibilityLabel={`Nota Média: ${metrics?.nota_media !== null && metrics?.nota_media !== undefined ? metrics.nota_media.toFixed(1) : 'Sem avaliações'}`}
          >
            <View style={styles.metricIconRow}>
              <Ionicons name="star-outline" size={20} color={colors.primaryYellow} />
            </View>
            <Text
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.textSecondary,
                marginTop: spacing.sm,
              }}
            >
              Nota Média
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
                marginTop: spacing.xs,
              }}
            >
              {metrics?.nota_media !== null && metrics?.nota_media !== undefined
                ? metrics.nota_media.toFixed(1)
                : 'Sem avaliações'}
            </Text>
          </Card>
        </View>

        {/* Shortcuts Section */}
        <View style={{ marginTop: spacing.xl }}>
          <Text
            style={{
              fontSize: typography.fontSize.md,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Atalhos
          </Text>

          <TouchableOpacity
            onPress={handleNavigateCacambas}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Ir para Minhas Caçambas"
          >
            <Card style={{ marginBottom: spacing.md }}>
              <View style={styles.shortcutRow}>
                <View style={[styles.shortcutIcon, { backgroundColor: colors.primaryLight + '30' }]}>
                  <Ionicons name="cube-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.shortcutText}>
                  <Text
                    style={{
                      fontSize: typography.fontSize.md,
                      fontFamily: typography.fontFamilyMedium,
                      color: colors.textPrimary,
                    }}
                  >
                    Minhas Caçambas
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.textSecondary,
                      marginTop: spacing.xs,
                    }}
                  >
                    Gerencie suas caçambas cadastradas
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNavigatePedidos}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Ir para Gestão de Pedidos"
          >
            <Card>
              <View style={styles.shortcutRow}>
                <View style={[styles.shortcutIcon, { backgroundColor: colors.infoLight }]}>
                  <Ionicons name="receipt-outline" size={24} color={colors.info} />
                </View>
                <View style={styles.shortcutText}>
                  <Text
                    style={{
                      fontSize: typography.fontSize.md,
                      fontFamily: typography.fontFamilyMedium,
                      color: colors.textPrimary,
                    }}
                  >
                    Gestão de Pedidos
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.textSecondary,
                      marginTop: spacing.xs,
                    }}
                  >
                    Acompanhe e gerencie seus pedidos
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    marginBottom: 12,
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonCard: {
    width: '48%',
    marginBottom: 12,
  },
  skeletonLine: {
    height: 14,
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shortcutText: {
    flex: 1,
  },
});
