import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, EmptyState, LoadingSpinner } from '../../components/ui';
import { renderRefreshControl } from '../../components/ui/PlatformRefreshControl';
import { useTheme } from '../../hooks/useTheme';
import type { FinanceiroData } from '../../services/cacambeirosService';
import * as cacambeirosService from '../../services/cacambeirosService';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

function getMonthDiff(year1: number, month1: number, year2: number, month2: number): number {
  return (year2 - year1) * 12 + (month2 - month1);
}

export default function FinanceiroScreen() {
  const { colors, spacing, typography, radius, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-based
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [data, setData] = useState<FinanceiroData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFinanceiro = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);
      const result = await cacambeirosService.financeiro({
        mes: selectedMonth,
        ano: selectedYear,
      });
      setData(result);
    } catch {
      setError('Não foi possível carregar os dados financeiros. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchFinanceiro();
  }, [fetchFinanceiro]);

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchFinanceiro(true);
  }, [fetchFinanceiro]);

  const handlePreviousMonth = () => {
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let newMonth = selectedMonth - 1;
    let newYear = selectedYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    const diff = getMonthDiff(newYear, newMonth, currentYear, currentMonth);
    if (diff > 11) return; // Max 12 months range

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const handleNextMonth = () => {
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let newMonth = selectedMonth + 1;
    let newYear = selectedYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    // Don't go beyond current month
    if (newYear > currentYear || (newYear === currentYear && newMonth > currentMonth)) {
      return;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const isAtCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  const isAtMaxPast = (() => {
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }
    return getMonthDiff(prevYear, prevMonth, currentYear, currentMonth) > 11;
  })();

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  const renderHeader = () => (
    <View>
      {/* Month Navigation */}
      <View
        style={[
          styles.monthNav,
          {
            marginBottom: spacing.lg,
            paddingHorizontal: spacing.sm,
          },
        ]}
        accessibilityRole="toolbar"
        accessibilityLabel="Navegação por mês"
      >
        <TouchableOpacity
          onPress={handlePreviousMonth}
          disabled={isAtMaxPast}
          style={[
            styles.navButton,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.sm,
              opacity: isAtMaxPast ? 0.4 : 1,
              ...shadows.soft,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          accessibilityState={{ disabled: isAtMaxPast }}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={isAtMaxPast ? colors.textDisabled : colors.textPrimary}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: typography.fontSize.md,
            fontFamily: typography.fontFamilyBold,
            color: colors.textPrimary,
          }}
          accessibilityRole="header"
        >
          {monthLabel}
        </Text>

        <TouchableOpacity
          onPress={handleNextMonth}
          disabled={isAtCurrentMonth}
          style={[
            styles.navButton,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.sm,
              opacity: isAtCurrentMonth ? 0.4 : 1,
              ...shadows.soft,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          accessibilityState={{ disabled: isAtCurrentMonth }}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={isAtCurrentMonth ? colors.textDisabled : colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <Card
        style={{ marginBottom: spacing.lg }}
        accessibilityLabel={`Receita do mês: ${formatCurrency(data?.resumo_mensal.total ?? 0)}. ${data?.resumo_mensal.quantidade ?? 0} pedidos finalizados`}
      >
        <View style={styles.summaryRow}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.successLight }]}>
            <Ionicons name="wallet-outline" size={28} color={colors.success} />
          </View>
          <View style={styles.summaryContent}>
            <Text
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.textSecondary,
                marginBottom: spacing.xs,
              }}
            >
              Receita do Mês
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize.xl,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(data?.resumo_mensal.total ?? 0)}
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.textSecondary,
                marginTop: spacing.xs,
              }}
            >
              {data?.resumo_mensal.quantidade ?? 0} pedidos finalizados
            </Text>
          </View>
        </View>
      </Card>

      {/* Section Title */}
      <Text
        style={{
          fontSize: typography.fontSize.md,
          fontFamily: typography.fontFamilyBold,
          color: colors.textPrimary,
          marginBottom: spacing.md,
        }}
      >
        Pedidos
      </Text>
    </View>
  );

  const renderOrderItem = ({ item }: { item: FinanceiroData['pedidos'][number] }) => (
    <Card
      style={{ marginBottom: spacing.md }}
      accessibilityLabel={`Pedido de ${formatCurrency(item.preco_final)} em ${formatDate(item.data_pedido)}`}
    >
      <View style={styles.orderRow}>
        <View style={[styles.orderIcon, { backgroundColor: colors.primaryLight + '30' }]}>
          <Ionicons name="receipt-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.orderContent}>
          <Text
            style={{
              fontSize: typography.fontSize.md,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
            }}
          >
            {formatCurrency(item.preco_final)}
          </Text>
          <Text
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            }}
          >
            {formatDate(item.data_pedido)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: colors.successLight,
              borderRadius: radius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            },
          ]}
        >
          <Text
            style={{
              fontSize: typography.fontSizeXs,
              fontFamily: typography.fontFamilyMedium,
              color: colors.success,
            }}
          >
            Pago
          </Text>
        </View>
      </View>
    </Card>
  );

  // Loading state
  if (isLoading) {
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
            Financeiro
          </Text>
        </View>
        <View style={styles.centered}>
          <LoadingSpinner message="Carregando dados financeiros..." />
        </View>
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
            Financeiro
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
            onPress={() => fetchFinanceiro()}
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

  // Empty state
  const hasOrders = data && data.pedidos && data.pedidos.length > 0;

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
          Financeiro
        </Text>
      </View>

      {hasOrders ? (
        <FlatList
          data={data.pedidos}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={renderRefreshControl({
            refreshing: isRefreshing,
            onRefresh: handleRefresh,
            colors: [colors.primaryGreen],
            tintColor: colors.primaryGreen,
          })}
        />
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => 'empty'}
          renderItem={() => null}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={
            <EmptyState
              title="Nenhum pedido encontrado"
              description={`Não há pedidos finalizados em ${monthLabel}.`}
              icon="cash-outline"
            />
          }
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
          }}
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  summaryContent: {
    flex: 1,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderContent: {
    flex: 1,
  },
  statusBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
