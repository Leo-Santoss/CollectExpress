import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingSpinner,
  StatusChip,
} from '../../../components/ui';
import { useTheme } from '../../../hooks/useTheme';
import * as alugueisService from '../../../services/alugueisService';
import * as avaliacoesService from '../../../services/avaliacoesService';
import { Avaliacao, Pedido } from '../../../types';

interface PedidoDetalhe extends Pedido {
  cacambeiro_nome?: string;
  endereco?: string;
  avaliacao?: Avaliacao | null;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, typography, radius } = useTheme();

  const [pedido, setPedido] = useState<PedidoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review state
  const [nota, setNota] = useState<number>(0);
  const [comentario, setComentario] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchOrderDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await alugueisService.meusPedidos(1);
      const order = response.data.find((p: Pedido) => p.id === id) as PedidoDetalhe | undefined;
      if (!order) {
        setError('Pedido não encontrado.');
        return;
      }
      setPedido(order);
    } catch {
      setError('Não foi possível carregar os detalhes do pedido.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number | string): string => {
    return `R$ ${Number(value).toFixed(2)}`;
  };

  const getPaymentBadgeVariant = (status: string): 'success' | 'warning' | 'default' => {
    switch (status) {
      case 'PAGO':
        return 'success';
      case 'PENDENTE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPaymentLabel = (status: string): string => {
    switch (status) {
      case 'PAGO':
        return 'Pago';
      case 'PENDENTE':
        return 'Pendente';
      default:
        return status;
    }
  };

  const handleSubmitReview = async () => {
    if (!pedido || !id) return;

    if (nota < 1 || nota > 5) {
      setReviewError('Selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    if (comentario.length > 500) {
      setReviewError('O comentário deve ter no máximo 500 caracteres.');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      await avaliacoesService.criar({
        aluguel_id: id,
        nota,
        comentario: comentario.trim() || null,
      });
      setReviewSubmitted(true);
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.response?.data?.error;

      if (status === 400) {
        setReviewError(message || 'Dados inválidos. Verifique a nota e o comentário.');
      } else if (status === 403) {
        setReviewError('Você não tem permissão para avaliar este pedido.');
      } else if (status === 409) {
        setReviewError('Você já avaliou este pedido.');
      } else {
        setReviewError('Não foi possível enviar a avaliação. Tente novamente.');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const canReview = pedido?.status_aluguel === 'FINALIZADO' && !pedido?.avaliacao && !reviewSubmitted;
  const alreadyReviewed = pedido?.avaliacao != null || reviewSubmitted;

  const renderStarRating = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setNota(i)}
          accessibilityRole="button"
          accessibilityLabel={`${i} estrela${i > 1 ? 's' : ''}`}
          accessibilityState={{ selected: i <= nota }}
          style={{ padding: spacing.xs }}
        >
          <Ionicons
            name={i <= nota ? 'star' : 'star-outline'}
            size={32}
            color={i <= nota ? colors.warning : colors.textSecondary}
          />
        </TouchableOpacity>
      );
    }
    return (
      <View style={styles.starsRow} accessibilityLabel={`Nota: ${nota} de 5 estrelas`}>
        {stars}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Carregando pedido..." />
      </View>
    );
  }

  if (error || !pedido) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Erro ao carregar"
          description={error || 'Pedido não encontrado.'}
          icon="alert-circle-outline"
          actionLabel="Tentar novamente"
          onActionPress={fetchOrderDetail}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Order Info Section */}
      <Card style={{ marginBottom: spacing.md }}>
        <Text
          style={{
            fontSize: typography.fontSize.xl,
            fontFamily: typography.fontFamilyBold,
            color: colors.textPrimary,
            marginBottom: spacing.md,
          }}
        >
          Detalhes do Pedido
        </Text>

        {/* Status Row */}
        <View style={[styles.row, { marginBottom: spacing.md }]}>
          <StatusChip status={pedido.status_aluguel} />
          <Badge
            label={getPaymentLabel(pedido.status_pagamento)}
            variant={getPaymentBadgeVariant(pedido.status_pagamento)}
            style={{ marginLeft: spacing.sm }}
          />
        </View>

        {/* Order Details */}
        <View style={[styles.detailRow, { marginBottom: spacing.sm }]}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.fontSizeSm }]}>
            Data do Pedido
          </Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary, fontSize: typography.fontSizeSm }]}>
            {formatDate(pedido.data_pedido)}
          </Text>
        </View>

        <View style={[styles.detailRow, { marginBottom: spacing.sm }]}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.fontSizeSm }]}>
            Data de Início
          </Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary, fontSize: typography.fontSizeSm }]}>
            {formatDate(pedido.data_inicio)}
          </Text>
        </View>

        <View style={[styles.detailRow, { marginBottom: spacing.sm }]}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.fontSizeSm }]}>
            Dias de Aluguel
          </Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary, fontSize: typography.fontSizeSm }]}>
            {pedido.dias_aluguel} {pedido.dias_aluguel === 1 ? 'dia' : 'dias'}
          </Text>
        </View>

        <View style={[styles.detailRow, { marginBottom: spacing.sm }]}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.fontSizeSm }]}>
            Preço Final
          </Text>
          <Text
            style={[
              styles.detailValue,
              {
                color: colors.primaryGreen,
                fontSize: typography.fontSizeMd,
                fontFamily: typography.fontFamilyBold,
              },
            ]}
          >
            {formatCurrency(pedido.preco_final)}
          </Text>
        </View>

        {pedido.cacambeiro_nome && (
          <View style={[styles.detailRow, { marginBottom: spacing.sm }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.fontSizeSm }]}>
              Caçambeiro
            </Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary, fontSize: typography.fontSizeSm }]}>
              {pedido.cacambeiro_nome}
            </Text>
          </View>
        )}

        {pedido.endereco && (
          <View style={[styles.detailRow, { marginBottom: spacing.sm }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.fontSizeSm }]}>
              Endereço
            </Text>
            <Text
              style={[
                styles.detailValue,
                { color: colors.textPrimary, fontSize: typography.fontSizeSm, flex: 1, textAlign: 'right' },
              ]}
              numberOfLines={2}
            >
              {pedido.endereco}
            </Text>
          </View>
        )}
      </Card>

      {/* Review Section */}
      {pedido.status_aluguel === 'FINALIZADO' && (
        <Card>
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Avaliação
          </Text>

          {alreadyReviewed && !reviewSubmitted && (
            <View
              style={[styles.messageBox, { backgroundColor: colors.infoLight, borderRadius: radius.md, padding: spacing.md }]}
              accessibilityRole="text"
              accessibilityLabel="Pedido já avaliado"
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.info} />
              <Text
                style={{
                  color: colors.info,
                  fontSize: typography.fontSizeSm,
                  marginLeft: spacing.sm,
                  flex: 1,
                }}
              >
                Você já avaliou este pedido.
              </Text>
            </View>
          )}

          {reviewSubmitted && (
            <View
              style={[styles.messageBox, { backgroundColor: colors.successLight, borderRadius: radius.md, padding: spacing.md }]}
              accessibilityRole="text"
              accessibilityLabel="Avaliação enviada com sucesso"
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text
                style={{
                  color: colors.success,
                  fontSize: typography.fontSizeSm,
                  marginLeft: spacing.sm,
                  flex: 1,
                }}
              >
                Avaliação enviada com sucesso!
              </Text>
            </View>
          )}

          {canReview && (
            <View>
              {/* Star Rating */}
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.fontSizeSm,
                  marginBottom: spacing.sm,
                }}
              >
                Nota *
              </Text>
              {renderStarRating()}

              {/* Comment Input */}
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.fontSizeSm,
                  marginTop: spacing.lg,
                  marginBottom: spacing.sm,
                }}
              >
                Comentário (opcional)
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    padding: spacing.md,
                    fontSize: typography.fontSizeSm,
                    color: colors.textPrimary,
                    backgroundColor: colors.white,
                  },
                ]}
                placeholder="Conte como foi sua experiência..."
                placeholderTextColor={colors.textSecondary}
                value={comentario}
                onChangeText={(text) => setComentario(text.slice(0, 500))}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                accessibilityLabel="Comentário da avaliação"
              />
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.fontSizeXs,
                  textAlign: 'right',
                  marginTop: spacing.xs,
                }}
              >
                {comentario.length}/500
              </Text>

              {/* Review Error */}
              {reviewError && (
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: typography.fontSizeSm,
                    marginTop: spacing.sm,
                  }}
                  accessibilityRole="alert"
                >
                  {reviewError}
                </Text>
              )}

              {/* Submit Button */}
              <Button
                label="Enviar Avaliação"
                onPress={handleSubmitReview}
                variant="primary"
                loading={submittingReview}
                disabled={nota === 0}
                style={{ marginTop: spacing.lg }}
                accessibilityLabel="Enviar avaliação"
              />
            </View>
          )}
        </Card>
      )}

      {/* Not finalized message */}
      {pedido.status_aluguel !== 'FINALIZADO' && (
        <Card>
          <View
            style={[styles.messageBox, { backgroundColor: colors.warningLight, borderRadius: radius.md, padding: spacing.md }]}
            accessibilityRole="text"
            accessibilityLabel="Avaliação disponível após finalização"
          >
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Text
              style={{
                color: colors.warning,
                fontSize: typography.fontSizeSm,
                marginLeft: spacing.sm,
                flex: 1,
              }}
            >
              A avaliação estará disponível após a finalização do pedido.
            </Text>
          </View>
        </Card>
      )}
    </ScrollView>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontWeight: '400',
  },
  detailValue: {
    fontWeight: '500',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textArea: {
    borderWidth: 1,
    minHeight: 100,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
