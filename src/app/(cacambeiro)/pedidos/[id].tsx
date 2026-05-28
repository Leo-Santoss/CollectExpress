import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button, Card, EmptyState, LoadingSpinner, StatusChip } from '../../../components/ui';
import { useTheme } from '../../../hooks/useTheme';
import * as alugueisService from '../../../services/alugueisService';
import { Pedido, StatusAluguel } from '../../../types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('pt-BR');

// ── Status state machine ────────────────────────────────────────────────────

const STATUS_ORDER: StatusAluguel[] = [
  'AGUARDANDO_ENTREGA',
  'EM_USO',
  'AGUARDANDO_RETIRADA',
  'FINALIZADO',
];

const NEXT_STATUS_LABEL: Record<string, string> = {
  AGUARDANDO_ENTREGA: 'Marcar como Em Uso',
  EM_USO: 'Marcar como Aguardando Retirada',
  AGUARDANDO_RETIRADA: 'Marcar como Finalizado',
};

function getNextStatus(current: StatusAluguel): StatusAluguel | null {
  const currentIndex = STATUS_ORDER.indexOf(current);
  if (currentIndex < 0 || currentIndex >= STATUS_ORDER.length - 1) {
    return null;
  }
  return STATUS_ORDER[currentIndex + 1];
}

// ── Component ───────────────────────────────────────────────────────────────

export default function PedidoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, spacing, typography, radius } = useTheme();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // ── Fetch order details ─────────────────────────────────────────────────────

  const fetchPedido = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      // Re-fetch from gestao list and find by id
      const pedidos = await alugueisService.gestaoPedidos();
      const found = pedidos.find((p) => p.id === id);
      if (!found) {
        setError('Pedido não encontrado.');
      } else {
        setPedido(found);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Não foi possível carregar o pedido.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPedido();
  }, [fetchPedido]);

  // ── Status advancement ──────────────────────────────────────────────────────

  async function handleAdvanceStatus() {
    if (!pedido || !id) return;

    const nextStatus = getNextStatus(pedido.status_aluguel);
    if (!nextStatus) return;

    setIsAdvancing(true);
    try {
      const updated = await alugueisService.atualizarStatus(id, nextStatus);
      setPedido(updated);
      Alert.alert('Sucesso', `Status atualizado para "${getStatusLabel(nextStatus)}".`);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Não foi possível atualizar o status.';
      Alert.alert('Erro', message);
    } finally {
      setIsAdvancing(false);
    }
  }

  function getStatusLabel(status: StatusAluguel): string {
    const labels: Record<StatusAluguel, string> = {
      AGUARDANDO_ENTREGA: 'Aguardando Entrega',
      EM_USO: 'Em Uso',
      AGUARDANDO_RETIRADA: 'Aguardando Retirada',
      FINALIZADO: 'Finalizado',
    };
    return labels[status];
  }

  // ── Loading state ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Carregando pedido..." />
      </View>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error || !pedido) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Erro ao carregar"
          description={error || 'Pedido não encontrado.'}
          icon="alert-circle-outline"
          actionLabel="Tentar novamente"
          onActionPress={fetchPedido}
        />
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const nextStatus = getNextStatus(pedido.status_aluguel);
  const nextLabel = NEXT_STATUS_LABEL[pedido.status_aluguel];
  const endereco = [
    (pedido as any).logradouro,
    (pedido as any).numero,
    (pedido as any).bairro,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status section */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: typography.fontSizeXs,
              fontFamily: typography.fontFamilyMedium,
              color: colors.textSecondary,
              marginBottom: spacing.sm,
            }}
          >
            Status do Pedido
          </Text>
          <StatusChip status={pedido.status_aluguel} />
        </Card>

        {/* Consumer info */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: typography.fontSizeXs,
              fontFamily: typography.fontFamilyMedium,
              color: colors.textSecondary,
              marginBottom: spacing.md,
            }}
          >
            Consumidor
          </Text>

          <View style={[styles.infoRow, { marginBottom: spacing.sm }]}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                fontFamily: typography.fontFamilyMedium,
                color: colors.textPrimary,
                marginLeft: spacing.sm,
              }}
            >
              {(pedido as any).consumidor_nome || 'Consumidor'}
            </Text>
          </View>

          {endereco ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: typography.fontSizeSm,
                  color: colors.textPrimary,
                  marginLeft: spacing.sm,
                  flex: 1,
                }}
              >
                {endereco}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Order details */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: typography.fontSizeXs,
              fontFamily: typography.fontFamilyMedium,
              color: colors.textSecondary,
              marginBottom: spacing.md,
            }}
          >
            Detalhes do Aluguel
          </Text>

          <View style={[styles.detailRow, { marginBottom: spacing.sm }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.fontSizeXs }]}>
              Data de Início
            </Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary, fontSize: typography.fontSizeSm, fontFamily: typography.fontFamilyMedium }]}>
              {formatDate(pedido.data_inicio)}
            </Text>
          </View>

          <View style={[styles.detailRow, { marginBottom: spacing.sm }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.fontSizeXs }]}>
              Dias de Aluguel
            </Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary, fontSize: typography.fontSizeSm, fontFamily: typography.fontFamilyMedium }]}>
              {pedido.dias_aluguel} {pedido.dias_aluguel === 1 ? 'dia' : 'dias'}
            </Text>
          </View>

          <View style={[styles.detailRow, { marginBottom: spacing.sm }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.fontSizeXs }]}>
              Valor Total
            </Text>
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                fontFamily: typography.fontFamilyBold,
                color: colors.primaryGreen,
              }}
            >
              {formatCurrency(pedido.preco_final)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.fontSizeXs }]}>
              Pagamento
            </Text>
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                fontFamily: typography.fontFamilyMedium,
                color: pedido.status_pagamento === 'PAGO' ? colors.primaryGreen : colors.textSecondary,
              }}
            >
              {pedido.status_pagamento === 'PAGO' ? 'Pago' : 'Pendente'}
            </Text>
          </View>
        </Card>

        {/* Status advancement */}
        {nextStatus && nextLabel ? (
          <Button
            label={nextLabel}
            onPress={handleAdvanceStatus}
            variant="primary"
            loading={isAdvancing}
            disabled={isAdvancing}
            accessibilityLabel={nextLabel}
          />
        ) : (
          <View
            style={[
              styles.finalizedBanner,
              {
                backgroundColor: colors.surface,
                padding: spacing.lg,
                borderRadius: radius.lg,
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={32} color={colors.primaryGreen} />
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                fontFamily: typography.fontFamilyMedium,
                color: colors.textPrimary,
                marginTop: spacing.sm,
                textAlign: 'center',
              }}
            >
              Pedido Finalizado
            </Text>
            <Text
              style={{
                fontSize: typography.fontSizeXs,
                color: colors.textSecondary,
                marginTop: spacing.xs,
                textAlign: 'center',
              }}
            >
              Este pedido já foi concluído com sucesso.
            </Text>
          </View>
        )}
      </ScrollView>
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {},
  detailValue: {},
  finalizedBanner: {
    alignItems: 'center',
  },
});
