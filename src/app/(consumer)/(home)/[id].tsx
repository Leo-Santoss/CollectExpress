import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingSpinner,
} from '../../../components/ui';
import { useTheme } from '../../../hooks/useTheme';
import * as cacambasService from '../../../services/cacambasService';
import * as carrinhoService from '../../../services/carrinhoService';
import { Avaliacao, CacambaDetalhe } from '../../../types';

export default function DumpsterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, spacing, typography, radius } = useTheme();

  const [cacamba, setCacamba] = useState<CacambaDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cacambasService.detalhe(id);
      setCacamba(data);
    } catch {
      setError('Não foi possível carregar os detalhes da caçamba.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAddToCart = async () => {
    if (!cacamba || !cacamba.disponivel) return;
    setAddingToCart(true);
    try {
      await carrinhoService.adicionarItem({
        cacamba_id: cacamba.id,
        quantidade: 1,
        dias_aluguel: 1,
      });
      router.push('/(consumer)/carrinho');
    } catch {
      // Could show an alert here, but for now just stop loading
    } finally {
      setAddingToCart(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderStars = (nota: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= nota ? 'star' : 'star-outline'}
          size={16}
          color={i <= nota ? colors.warning : colors.textSecondary}
        />
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Carregando detalhes..." />
      </View>
    );
  }

  if (error || !cacamba) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Erro ao carregar"
          description={error || 'Caçamba não encontrada.'}
          icon="alert-circle-outline"
          actionLabel="Tentar novamente"
          onActionPress={fetchDetail}
        />
      </View>
    );
  }

  const { cacambeiro, avaliacoes } = cacamba;
  const recentReviews: Avaliacao[] = avaliacoes.slice(0, 10);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Dumpster Photo */}
        {cacamba.foto_url && (
          <Image
            source={{ uri: cacamba.foto_url }}
            style={[styles.photo, { borderRadius: radius.lg }]}
            accessibilityLabel={`Foto da caçamba ${cacamba.nome}`}
          />
        )}

        {/* Dumpster Info Section */}
        <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Text
            style={{
              fontSize: typography.fontSize.xl,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              marginBottom: spacing.sm,
            }}
          >
            {cacamba.nome}
          </Text>

          <View style={[styles.infoRow, { marginBottom: spacing.xs }]}>
            <Badge
              label={cacamba.tipo_residuo}
              variant="default"
              accessibilityLabel={`Tipo de resíduo: ${cacamba.tipo_residuo}`}
            />
            <Badge
              label={cacamba.disponivel ? 'Disponível' : 'Indisponível'}
              variant={cacamba.disponivel ? 'success' : 'warning'}
              style={{ marginLeft: spacing.sm }}
            />
          </View>

          <View style={[styles.detailsGrid, { marginTop: spacing.md }]}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.fontSizeXs }]}>
                Tamanho
              </Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary, fontSize: typography.fontSizeMd }]}>
                {cacamba.tamanho_m3} m³
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: typography.fontSizeXs }]}>
                Preço/dia
              </Text>
              <Text style={[styles.detailValue, { color: colors.primaryGreen, fontSize: typography.fontSizeMd, fontFamily: typography.fontFamilyBold }]}>
                R$ {Number(cacamba.preco_diaria).toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Cacambeiro Profile Section */}
        <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}>
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Sobre o Caçambeiro
          </Text>

          <View style={[styles.profileRow, { marginBottom: spacing.md }]}>
            <Avatar name={cacambeiro.nome_completo} size={48} />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text
                style={{
                  fontSize: typography.fontSizeMd,
                  fontFamily: typography.fontFamilyBold,
                  color: colors.textPrimary,
                }}
              >
                {cacambeiro.nome_completo}
              </Text>
              <Text
                style={{
                  fontSize: typography.fontSizeSm,
                  color: colors.textSecondary,
                  marginTop: spacing.xs,
                }}
              >
                {cacambeiro.telefone}
              </Text>
            </View>
          </View>

          <View style={[styles.profileDetails, { gap: spacing.sm }]}>
            <View style={styles.profileDetailRow}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.profileDetailText, { color: colors.textPrimary, fontSize: typography.fontSizeSm, marginLeft: spacing.sm }]}>
                {cacambeiro.horario_inicio} - {cacambeiro.horario_fim}
              </Text>
            </View>

            <View style={styles.profileDetailRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.profileDetailText, { color: colors.textPrimary, fontSize: typography.fontSizeSm, marginLeft: spacing.sm }]}>
                Raio de entrega: {cacambeiro.raio_entrega_km} km
              </Text>
            </View>

            <View style={styles.profileDetailRow}>
              <Ionicons name="star" size={16} color={colors.warning} />
              <Text style={[styles.profileDetailText, { color: colors.textPrimary, fontSize: typography.fontSizeSm, marginLeft: spacing.sm }]}>
                {cacambeiro.nota_media !== null
                  ? `${Number(cacambeiro.nota_media).toFixed(1)} / 5.0`
                  : 'Sem avaliações'}
              </Text>
            </View>

            <View style={styles.profileDetailRow}>
              <Ionicons name="car-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.profileDetailText, { color: colors.textPrimary, fontSize: typography.fontSizeSm, marginLeft: spacing.sm }]}>
                Taxa de entrega: R$ {Number(cacambeiro.taxa_entrega).toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Reviews Section */}
        <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}>
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Avaliações
          </Text>

          {recentReviews.length === 0 ? (
            <EmptyState
              title="Nenhuma avaliação"
              description="Este caçambeiro ainda não possui avaliações."
              icon="chatbubble-outline"
            />
          ) : (
            recentReviews.map((review, index) => (
              <View
                key={review.id || `review-${index}`}
                style={[
                  styles.reviewItem,
                  {
                    paddingVertical: spacing.md,
                    borderBottomWidth: index < recentReviews.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  },
                ]}
                accessibilityLabel={`Avaliação de ${review.consumidor_nome || 'Usuário'}: ${review.nota} estrelas`}
              >
                <View style={styles.reviewHeader}>
                  <Text
                    style={{
                      fontSize: typography.fontSizeSm,
                      fontFamily: typography.fontFamilyBold,
                      color: colors.textPrimary,
                    }}
                  >
                    {review.consumidor_nome || 'Usuário'}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.fontSizeXs,
                      color: colors.textSecondary,
                    }}
                  >
                    {formatDate(review.data_avaliacao)}
                  </Text>
                </View>
                {renderStars(review.nota)}
                {review.comentario && (
                  <Text
                    style={{
                      fontSize: typography.fontSizeSm,
                      color: colors.textPrimary,
                      marginTop: spacing.xs,
                      lineHeight: typography.lineHeightSm,
                    }}
                  >
                    {review.comentario}
                  </Text>
                )}
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {/* Add to Cart Button - Fixed at bottom */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          },
        ]}
      >
        {cacamba.disponivel ? (
          <Button
            label="Adicionar ao Carrinho"
            onPress={handleAddToCart}
            variant="primary"
            loading={addingToCart}
            accessibilityLabel="Adicionar caçamba ao carrinho"
          />
        ) : (
          <View>
            <Button
              label="Adicionar ao Carrinho"
              onPress={() => {}}
              variant="primary"
              disabled
              accessibilityLabel="Caçamba indisponível"
            />
            <Text
              style={{
                fontSize: typography.fontSizeXs,
                color: colors.textSecondary,
                textAlign: 'center',
                marginTop: spacing.xs,
              }}
            >
              Caçamba indisponível no momento
            </Text>
          </View>
        )}
      </View>
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
  photo: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    marginBottom: 2,
  },
  detailValue: {
    fontWeight: '600',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetails: {
    flexDirection: 'column',
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetailText: {
    flex: 1,
  },
  reviewItem: {},
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBar: {
    width: '100%',
  },
});
