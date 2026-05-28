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
import { Badge, Card, EmptyState, LoadingSpinner } from '../../../components/ui';
import { useTheme } from '../../../hooks/useTheme';
import * as usuariosService from '../../../services/usuariosService';
import { Endereco, Pedido, TipoPerfil } from '../../../types';

interface UserDetail {
  id: string;
  nome_completo: string;
  email: string;
  tipo_perfil: TipoPerfil;
  documento: string;
  telefone: string;
  criado_em: string;
  enderecos: Endereco[];
  pedidos: Pedido[];
}

function getBadgeVariant(tipo: TipoPerfil): 'success' | 'warning' | 'default' {
  switch (tipo) {
    case 'ADMIN':
      return 'warning';
    case 'CACAMBEIRO':
      return 'success';
    default:
      return 'default';
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

export default function UsuarioDetalheScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, typography, radius } = useTheme();

  const [usuario, setUsuario] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuario = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await usuariosService.detalheUsuario(id);
      setUsuario(response as unknown as UserDetail);
    } catch {
      setError('Não foi possível carregar os dados do usuário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUsuario();
  }, [fetchUsuario]);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Carregando dados do usuário..." />
      </View>
    );
  }

  // Error state
  if (error || !usuario) {
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
          {error || 'Usuário não encontrado.'}
        </Text>
        <TouchableOpacity
          onPress={fetchUsuario}
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
            {usuario.nome_completo}
          </Text>
        </View>

        {/* User Info Card */}
        <Card
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg }}
          accessibilityLabel={`Informações de ${usuario.nome_completo}`}
        >
          <View style={[styles.infoRow, { marginBottom: spacing.md }]}>
            <Badge label={usuario.tipo_perfil} variant={getBadgeVariant(usuario.tipo_perfil)} />
          </View>

          <InfoField label="ID" value={usuario.id} colors={colors} spacing={spacing} typography={typography} />
          <InfoField label="Nome" value={usuario.nome_completo} colors={colors} spacing={spacing} typography={typography} />
          <InfoField label="Email" value={usuario.email} colors={colors} spacing={spacing} typography={typography} />
          <InfoField label="Documento" value={usuario.documento || '—'} colors={colors} spacing={spacing} typography={typography} />
          <InfoField label="Telefone" value={usuario.telefone || '—'} colors={colors} spacing={spacing} typography={typography} />
          <InfoField label="Criado em" value={formatDate(usuario.criado_em)} colors={colors} spacing={spacing} typography={typography} />
        </Card>

        {/* Addresses Section */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Endereços
          </Text>

          {!usuario.enderecos || usuario.enderecos.length === 0 ? (
            <EmptyState
              title="Nenhum endereço"
              description="Este usuário não possui endereços cadastrados."
              icon="location-outline"
            />
          ) : (
            usuario.enderecos.map((endereco) => (
              <Card
                key={endereco.id}
                style={{ marginBottom: spacing.md }}
                accessibilityLabel={`Endereço: ${endereco.logradouro}, ${endereco.numero}`}
              >
                <View style={styles.addressIcon}>
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
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {endereco.logradouro}, {endereco.numero}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: typography.fontSizeSm,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                >
                  {endereco.bairro} - {endereco.cidade_estado}
                </Text>
                <Text
                  style={{
                    fontSize: typography.fontSizeXs,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                >
                  CEP: {endereco.cep}
                </Text>
              </Card>
            ))
          )}
        </View>

        {/* Order History Section */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Histórico de Pedidos
          </Text>

          {!usuario.pedidos || usuario.pedidos.length === 0 ? (
            <EmptyState
              title="Nenhum pedido"
              description="Este usuário não possui pedidos realizados."
              icon="receipt-outline"
            />
          ) : (
            usuario.pedidos.map((pedido) => (
              <Card
                key={pedido.id}
                style={{ marginBottom: spacing.md }}
                accessibilityLabel={`Pedido de ${formatDate(pedido.data_pedido)}`}
              >
                <View style={styles.orderHeader}>
                  <Text
                    style={{
                      fontSize: typography.fontSizeSm,
                      color: colors.textSecondary,
                    }}
                  >
                    {formatDate(pedido.data_pedido)}
                  </Text>
                  <Badge
                    label={pedido.status_aluguel.replace(/_/g, ' ')}
                    variant={
                      pedido.status_aluguel === 'FINALIZADO'
                        ? 'success'
                        : pedido.status_aluguel === 'AGUARDANDO_ENTREGA'
                        ? 'warning'
                        : 'default'
                    }
                  />
                </View>
                <View style={[styles.orderPrice, { marginTop: spacing.sm }]}>
                  <Text
                    style={{
                      fontSize: typography.fontSizeMd,
                      fontFamily: typography.fontFamilyBold,
                      color: colors.primaryGreen,
                    }}
                  >
                    {formatCurrency(pedido.preco_final)}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
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
          width: 90,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
