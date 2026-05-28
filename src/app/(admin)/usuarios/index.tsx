import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Badge, Card, EmptyState, LoadingSpinner } from '../../../components/ui';
import { renderRefreshControl } from '../../../components/ui/PlatformRefreshControl';
import { useDebounce } from '../../../hooks/useDebounce';
import { useTheme } from '../../../hooks/useTheme';
import * as usuariosService from '../../../services/usuariosService';
import { TipoPerfil, User } from '../../../types';

const PERFIL_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Todos', value: '' },
  { label: 'Consumidor', value: 'CONSUMIDOR' },
  { label: 'Caçambeiro', value: 'CACAMBEIRO' },
  { label: 'Admin', value: 'ADMIN' },
];

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

export default function UsuariosScreen() {
  const router = useRouter();
  const { colors, spacing, typography, radius } = useTheme();

  // State
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [tipoPerfil, setTipoPerfil] = useState('');

  const debouncedSearch = useDebounce(searchText, 300);

  // Fetch users
  const fetchUsuarios = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const params: usuariosService.UserFilters = {
          page: pageNum,
        };

        if (tipoPerfil) {
          params.tipo_perfil = tipoPerfil;
        }

        if (debouncedSearch.length >= 3) {
          params.search = debouncedSearch;
        }

        const response = await usuariosService.listarUsuarios(params);

        if (reset) {
          setUsuarios(response.data);
        } else {
          setUsuarios((prev) => [...prev, ...response.data]);
        }

        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotal(response.total);
      } catch {
        setError('Não foi possível carregar os usuários. Tente novamente.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [tipoPerfil, debouncedSearch]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchUsuarios(1, true);
  }, [tipoPerfil, debouncedSearch]);

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPage(1);
    fetchUsuarios(1, true);
  }, [fetchUsuarios]);

  // Load more
  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      fetchUsuarios(page + 1, false);
    }
  };

  // Retry
  const handleRetry = () => {
    setPage(1);
    fetchUsuarios(1, true);
  };

  // Navigate to detail
  const handleUserPress = (id: string) => {
    router.push(`/(admin)/usuarios/${id}`);
  };

  // Render user item
  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(item.id)}
      accessibilityLabel={`Usuário ${item.nome_completo}`}
      accessibilityRole="button"
      activeOpacity={0.7}
    >
      <Card style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <View style={styles.userRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: typography.fontSizeMd,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
                marginBottom: spacing.xs,
              }}
              numberOfLines={1}
            >
              {item.nome_completo}
            </Text>
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                color: colors.textSecondary,
                marginBottom: spacing.xs,
              }}
              numberOfLines={1}
            >
              {item.email}
            </Text>
            <Text
              style={{
                fontSize: typography.fontSizeXs,
                color: colors.textSecondary,
              }}
            >
              {new Date(item.criado_em).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <View style={styles.badgeContainer}>
            <Badge label={item.tipo_perfil} variant={getBadgeVariant(item.tipo_perfil)} />
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
              style={{ marginLeft: spacing.sm }}
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Footer (load more indicator)
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primaryGreen} />
      </View>
    );
  };

  // Empty state
  const renderEmpty = () => {
    if (loading) return null;
    return (
      <EmptyState
        title="Nenhum usuário encontrado"
        description={
          debouncedSearch.length >= 3 || tipoPerfil
            ? 'Tente ajustar os filtros ou o termo de busca.'
            : 'Nenhum usuário cadastrado no sistema.'
        }
        icon="people-outline"
      />
    );
  };

  // Error state
  if (error && usuarios.length === 0) {
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
          {error}
        </Text>
        <TouchableOpacity
          onPress={handleRetry}
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
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
        <Text
          style={{
            fontSize: typography.fontSize.xl,
            fontFamily: typography.fontFamilyBold,
            color: colors.textPrimary,
          }}
        >
          Usuários
        </Text>
        {total > 0 && (
          <Text style={{ fontSize: typography.fontSizeSm, color: colors.textSecondary }}>
            {total} {total === 1 ? 'usuário' : 'usuários'}
          </Text>
        )}
      </View>

      {/* Search Input */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar por nome ou email (mín. 3 caracteres)"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.searchInput,
              {
                color: colors.textPrimary,
                fontSize: typography.fontSizeSm,
                marginLeft: spacing.sm,
              },
            ]}
            accessibilityLabel="Buscar usuários"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              accessibilityLabel="Limpar busca"
              accessibilityRole="button"
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
        <FlatList
          horizontal
          data={PERFIL_OPTIONS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setTipoPerfil(item.value)}
              accessibilityLabel={`Filtrar por ${item.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: tipoPerfil === item.value }}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    tipoPerfil === item.value ? colors.primaryGreen : colors.surface,
                  borderRadius: radius.pill,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  marginRight: spacing.sm,
                  borderWidth: 1,
                  borderColor:
                    tipoPerfil === item.value ? colors.primaryGreen : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: typography.fontSizeSm,
                  fontFamily:
                    tipoPerfil === item.value
                      ? typography.fontFamilyBold
                      : typography.fontFamilyRegular,
                  color:
                    tipoPerfil === item.value ? colors.textInverse : colors.textPrimary,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.centered}>
          <LoadingSpinner message="Carregando usuários..." />
        </View>
      ) : (
        /* User List */
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxxl }}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  filterButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
