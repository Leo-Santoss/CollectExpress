import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../components/ui';
import { useTheme } from '../../hooks/useTheme';
import type { AdminDashboardData } from '../../services/adminService';
import * as adminService from '../../services/adminService';

const FETCH_TIMEOUT_MS = 10000;

type Granularity = 'daily' | 'weekly';

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_ENTREGA: 'Aguardando Entrega',
  EM_USO: 'Em Uso',
  AGUARDANDO_RETIRADA: 'Aguardando Retirada',
  FINALIZADO: 'Finalizado',
};

export default function AdminDashboardScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDashboard = useCallback(async (gran: Granularity = granularity) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeout = setTimeout(() => {
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    try {
      setIsLoading(true);
      setError(null);
      const result = await adminService.dashboard({ granularity: gran });
      if (!controller.signal.aborted) {
        setData(result);
      }
    } catch {
      if (!controller.signal.aborted) {
        setError('Não foi possível carregar o dashboard. Tente novamente.');
      } else {
        setError('A requisição excedeu o tempo limite. Tente novamente.');
      }
    } finally {
      clearTimeout(timeout);
      if (!controller.signal.aborted) {
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [granularity]);

  useEffect(() => {
    fetchDashboard();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchDashboard]);

  const handleGranularityToggle = (gran: Granularity) => {
    setGranularity(gran);
    fetchDashboard(gran);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'AGUARDANDO_ENTREGA':
        return colors.warning;
      case 'EM_USO':
        return colors.info;
      case 'AGUARDANDO_RETIRADA':
        return '#F97316'; // orange
      case 'FINALIZADO':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  // ─── Loading State ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
        accessibilityLabel="Carregando dashboard administrativo"
      >
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }]}>
          <Text
            style={{
              fontSize: typography.fontSize.xl,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
            }}
          >
            Painel Administrativo
          </Text>
        </View>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
        >
          {/* Skeleton metric cards */}
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
          {/* Skeleton status section */}
          <View style={{ marginTop: spacing.xl }}>
            <View
              style={[
                styles.skeletonCard,
                {
                  backgroundColor: colors.skeleton,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  height: 120,
                  width: '100%',
                  marginBottom: spacing.md,
                },
              ]}
            />
          </View>
          {/* Skeleton orders-over-time section */}
          <View style={{ marginTop: spacing.md }}>
            <View
              style={[
                styles.skeletonCard,
                {
                  backgroundColor: colors.skeleton,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  height: 200,
                  width: '100%',
                },
              ]}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────────

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
            Painel Administrativo
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
            onPress={() => fetchDashboard()}
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

  // ─── Main Content ────────────────────────────────────────────────────────────

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
          Painel Administrativo
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Metric Cards (2x2 Grid) ─────────────────────────────────────── */}
        <View style={styles.metricsGrid}>
          {/* Total de Usuários */}
          <Card
            style={styles.metricCard}
            accessibilityLabel={`Total de Usuários: ${data?.total_usuarios ?? 0}`}
          >
            <View style={styles.metricIconRow}>
              <Ionicons name="people-outline" size={20} color={colors.info} />
            </View>
            <Text
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.textSecondary,
                marginTop: spacing.sm,
              }}
            >
              Total de Usuários
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
                marginTop: spacing.xs,
              }}
            >
              {data?.total_usuarios ?? 0}
            </Text>
          </Card>

          {/* Total de Pedidos */}
          <Card
            style={styles.metricCard}
            accessibilityLabel={`Total de Pedidos: ${data?.total_pedidos ?? 0}`}
          >
            <View style={styles.metricIconRow}>
              <Ionicons name="receipt-outline" size={20} color={colors.warning} />
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
              {data?.total_pedidos ?? 0}
            </Text>
          </Card>

          {/* Receita Total */}
          <Card
            style={styles.metricCard}
            accessibilityLabel={`Volume Total Movimentado: ${data ? formatCurrency(data.receita_total) : 'R$ 0,00'}`}
          >
            <View style={styles.metricIconRow}>
              <Ionicons name="cash-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.textSecondary,
                marginTop: spacing.sm,
              }}
            >
              Volume Total Movimentado
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
              {data ? formatCurrency(data.receita_total) : 'R$ 0,00'}
            </Text>
          </Card>

          {/* Lucro Plataforma */}
          <Card
            style={styles.metricCard}
            accessibilityLabel={`Lucro da Plataforma: ${data ? formatCurrency(data.lucro_plataforma) : 'R$ 0,00'}`}
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
              Lucro da Plataforma (5%)
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamilyBold,
                color: colors.success,
                marginTop: spacing.xs,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {data ? formatCurrency(data.lucro_plataforma) : 'R$ 0,00'}
            </Text>
          </Card>

          {/* Caçambeiros Ativos */}
          <Card
            style={styles.metricCard}
            accessibilityLabel={`Caçambeiros Ativos: ${data?.cacambeiros_ativos ?? 0}`}
          >
            <View style={styles.metricIconRow}>
              <Ionicons name="truck-outline" size={20} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.textSecondary,
                marginTop: spacing.sm,
              }}
            >
              Caçambeiros Ativos
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
                marginTop: spacing.xs,
              }}
            >
              {data?.cacambeiros_ativos ?? 0}
            </Text>
          </Card>
        </View>

        {/* ─── Orders by Status ─────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xl }}>
          <Text
            style={{
              fontSize: typography.fontSize.md,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Pedidos por Status
          </Text>
          <Card>
            {data?.pedidos_por_status &&
              Object.entries(data.pedidos_por_status).map(([status, count], index, arr) => (
                <View
                  key={status}
                  style={[
                    styles.statusRow,
                    {
                      paddingVertical: spacing.sm,
                      borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.statusLabelRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(status) },
                      ]}
                    />
                    <Text
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.textPrimary,
                        marginLeft: spacing.sm,
                      }}
                    >
                      {STATUS_LABELS[status] ?? status}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(status) + '20',
                        borderRadius: radius.sm,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: typography.fontSize.sm,
                        fontFamily: typography.fontFamilyBold,
                        color: getStatusColor(status),
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                </View>
              ))}
            {(!data?.pedidos_por_status ||
              Object.keys(data.pedidos_por_status).length === 0) && (
              <Text
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  paddingVertical: spacing.md,
                }}
              >
                Nenhum pedido encontrado
              </Text>
            )}
          </Card>
        </View>

        {/* ─── Orders Over Time ─────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing.xl }}>
          <View style={styles.sectionHeaderRow}>
            <Text
              style={{
                fontSize: typography.fontSize.md,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
              }}
            >
              Pedidos ao Longo do Tempo
            </Text>
            {/* Granularity Toggle */}
            <View
              style={[
                styles.toggleContainer,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: radius.md,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleGranularityToggle('daily')}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: granularity === 'daily' ? colors.primary : 'transparent',
                    borderRadius: radius.sm,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Visualizar por dia"
                accessibilityState={{ selected: granularity === 'daily' }}
              >
                <Text
                  style={{
                    fontSize: typography.fontSize.xs,
                    fontFamily: typography.fontFamilyMedium,
                    color: granularity === 'daily' ? colors.textInverse : colors.textSecondary,
                  }}
                >
                  Diário
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleGranularityToggle('weekly')}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: granularity === 'weekly' ? colors.primary : 'transparent',
                    borderRadius: radius.sm,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Visualizar por semana"
                accessibilityState={{ selected: granularity === 'weekly' }}
              >
                <Text
                  style={{
                    fontSize: typography.fontSize.xs,
                    fontFamily: typography.fontFamilyMedium,
                    color: granularity === 'weekly' ? colors.textInverse : colors.textSecondary,
                  }}
                >
                  Semanal
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Card style={{ marginTop: spacing.md }}>
            {data?.pedidos_ao_longo_do_tempo && data.pedidos_ao_longo_do_tempo.length > 0 ? (
              data.pedidos_ao_longo_do_tempo.map((entry, index) => {
                const maxCount = Math.max(
                  ...data.pedidos_ao_longo_do_tempo.map((e) => e.count),
                  1
                );
                const barWidth = (entry.count / maxCount) * 100;

                return (
                  <View
                    key={entry.date}
                    style={[
                      styles.timeRow,
                      {
                        paddingVertical: spacing.xs,
                        borderBottomWidth:
                          index < data.pedidos_ao_longo_do_tempo.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.textSecondary,
                        width: 80,
                      }}
                    >
                      {formatDate(entry.date)}
                    </Text>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            width: `${barWidth}%`,
                            backgroundColor: colors.primary,
                            borderRadius: radius.xs,
                            height: 16,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: typography.fontSize.xs,
                        fontFamily: typography.fontFamilyBold,
                        color: colors.textPrimary,
                        width: 30,
                        textAlign: 'right',
                      }}
                    >
                      {entry.count}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  paddingVertical: spacing.md,
                }}
              >
                Nenhum dado disponível
              </Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}`;
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 2,
  },
  toggleButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    marginHorizontal: 8,
    height: 16,
    justifyContent: 'center',
  },
  bar: {
    minWidth: 4,
  },
});
