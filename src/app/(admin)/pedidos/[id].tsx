import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Badge, Card, EmptyState, LoadingSpinner, StatusChip } from '../../../components/ui';
import { useTheme } from '../../../hooks/useTheme';
import * as alugueisService from '../../../services/alugueisService';
import { StatusAluguel, StatusPagamento } from '../../../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ItemAluguel {
  id: string;
  cacamba_nome: string;
  quantidade: number;
  dias_aluguel: number;
  preco_diaria: number;
}

interface PedidoDetalhe {
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
  itens_aluguel?: ItemAluguel[];
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

export default function PedidoDetalheScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, typography, radius } = useTheme();

  const [pedido, setPedido] = useState<PedidoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPedido = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch from the list endpoint filtering by the specific order
      // The API returns paginated data; we fetch page 1 with the order id
      const response = await alugueisService.listarTodos({ page: 1, limit: 1, search: id });
      const data = response.data as unknown as PedidoDetalhe[];

      if (data.length > 0) {
        setPedido(data[0]);
      } else {
        setError('Pedido não encontrado.');
      }
    } catch {
      setError('Não foi possível carregar os dados do pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPedido();
  }, [fetchPedido]);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Carregando pedido..." />
      </View>
    );
  }

  // Error state
  if (error || !pedido) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
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
          {error || 'Pedido não encontrado.'}
        </Text>
        <TouchableOpacity
          onPress={fetchPedido}
          accessibilityLabel="Tentar novamente"
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
            Tentar novamente
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button + Header */}
        <View style={[styles.headerRow, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
            accessibilityRole="button"
            style={{ padding: spacing.xs }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: typography.fontSize.xl,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              flex: 1,
              marginLeft: spacing.md,
            }}
            numberOfLines={1}
          >
            Detalhe do Pedido
          </Text>
        </View>

        {/* Status Section */}
        <Card
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg }}
          accessibilityLabel="Status do pedido"
        >
          <View style={[styles.statusRow, { marginBottom: spacing.md }]}>
            <StatusChip status={pedido.status_aluguel} />
            <Badge
              label={pedido.status_pagamento === 'PAGO' ? 'Pago' : 'Pendente'}
              variant={getPagamentoBadgeVariant(pedido.status_pagamento)}
              style={{ marginLeft: spacing.sm }}
            />
          </View>

          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontFamily: typography.fontFamilyBold,
              color: colors.primaryGreen,
              marginBottom: spacing.sm,
            }}
          >
            {formatCurrency(pedido.preco_final)}
          </Text>
        </Card>

        {/* People Section */}
        <Card
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}
          accessibilityLabel="Pessoas envolvidas"
        >
          <Text
            style={{
              fontSize: typography.fontSizeMd,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Pessoas
          </Text>

          <InfoField
            label="Consumidor"
            value={pedido.consumidor_nome}
            colors={colors}
            spacing={spacing}
            typography={typography}
          />
          <InfoField
            label="Caçambeiro"
            value={pedido.cacambeiro_nome}
            colors={colors}
            spacing={spacing}
            typography={typography}
          />
        </Card>

        {/* Dates Section */}
        <Card
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}
          accessibilityLabel="Datas do pedido"
        >
          <Text
            style={{
              fontSize: typography.fontSizeMd,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Datas
          </Text>

          <InfoField
            label="Data Pedido"
            value={formatDate(pedido.data_pedido)}
            colors={colors}
            spacing={spacing}
            typography={typography}
          />
          <InfoField
            label="Data Início"
            value={formatDate(pedido.data_inicio)}
            colors={colors}
            spacing={spacing}
            typography={typography}
          />
          <InfoField
            label="Dias Aluguel"
            value={`${pedido.dias_aluguel} ${pedido.dias_aluguel === 1 ? 'dia' : 'dias'}`}
            colors={colors}
            spacing={spacing}
            typography={typography}
          />
        </Card>

        {/* Address Section */}
        <Card
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}
          accessibilityLabel="Endereço de entrega"
        >
          <View style={styles.sectionHeader}>
            <Ionicons
              name="location-outline"
              size={18}
              color={colors.primaryGreen}
              style={{ marginRight: spacing.sm }}
            />
            <Text
              style={{
                fontSize: typography.fontSizeMd,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
              }}
            >
              Endereço
            </Text>
          </View>

          <Text
            style={{
              fontSize: typography.fontSizeSm,
              color: colors.textPrimary,
              marginTop: spacing.sm,
            }}
          >
            {pedido.logradouro}, {pedido.numero}
          </Text>
          <Text
            style={{
              fontSize: typography.fontSizeSm,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            }}
          >
            {pedido.bairro} - {pedido.cidade_estado}
          </Text>
          <Text
            style={{
              fontSize: typography.fontSizeXs,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            }}
          >
            CEP: {pedido.cep}
          </Text>
        </Card>

        {/* Itens Aluguel Section */}
        {pedido.itens_aluguel && pedido.itens_aluguel.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
            <Text
              style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
                marginBottom: spacing.md,
              }}
            >
              Itens do Aluguel
            </Text>

            {pedido.itens_aluguel.map((item) => (
              <Card
                key={item.id}
                style={{ marginBottom: spacing.md }}
                accessibilityLabel={`Item: ${item.cacamba_nome}`}
              >
                <Text
                  style={{
                    fontSize: typography.fontSizeMd,
                    fontFamily: typography.fontFamilyBold,
                    color: colors.textPrimary,
                    marginBottom: spacing.sm,
                  }}
                >
                  {item.cacamba_nome}
                </Text>

                <View style={styles.itemDetailsRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: typography.fontSizeXs,
                        color: colors.textSecondary,
                        marginBottom: spacing.xs,
                      }}
                    >
                      Quantidade: {item.quantidade}
                    </Text>
                    <Text
                      style={{
                        fontSize: typography.fontSizeXs,
                        color: colors.textSecondary,
                        marginBottom: spacing.xs,
                      }}
                    >
                      Dias: {item.dias_aluguel}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: typography.fontSizeSm,
                      fontFamily: typography.fontFamilyBold,
                      color: colors.primaryGreen,
                    }}
                  >
                    {formatCurrency(item.preco_diaria)}/dia
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Empty items state */}
        {(!pedido.itens_aluguel || pedido.itens_aluguel.length === 0) && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
            <Text
              style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
                marginBottom: spacing.md,
              }}
            >
              Itens do Aluguel
            </Text>
            <EmptyState
              title="Nenhum item"
              description="Não há itens detalhados para este pedido."
              icon="cube-outline"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Helper Component ─────────────────────────────────────────────────────────

interface InfoFieldProps {
  label: string;
  value: string;
  colors: any;
  spacing: any;
  typography: any;
}

function InfoField({ label, value, colors, spacing, typography }: InfoFieldProps) {
  return (
    <View style={[styles.fieldRow, { marginBottom: spacing.sm }]}>
      <Text
        style={{
          fontSize: typography.fontSizeSm,
          color: colors.textSecondary,
          width: 100,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: typography.fontSizeSm,
          fontFamily: typography.fontFamilyMedium,
          color: colors.textPrimary,
          flex: 1,
        }}
        selectable
      >
        {value}
      </Text>
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
  scrollView: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
