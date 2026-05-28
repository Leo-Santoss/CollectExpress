import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, EmptyState, LoadingSpinner, TextInputField } from '../../../components/ui';
import { renderRefreshControl } from '../../../components/ui/PlatformRefreshControl';
import { useDebounce } from '../../../hooks/useDebounce';
import { useTheme } from '../../../hooks/useTheme';
import type { CacambaFilters, PaginatedResponse } from '../../../services/cacambasService';
import * as cacambasService from '../../../services/cacambasService';
import type { Cacamba } from '../../../types';

// Extended type for listing that includes cacambeiro name from API
interface CacambaListItem extends Cacamba {
  cacambeiro_nome?: string;
}

const PAGE_SIZE = 20;

export default function MarketplaceScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [cacambas, setCacambas] = useState<CacambaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [tipoResiduoFilter, setTipoResiduoFilter] = useState<string | null>(null);
  const [cacambeiroFilter, setCacambeiroFilter] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchText, 300);

  // Derived search value (only trigger at 3+ chars)
  const activeSearch = useMemo(
    () => (debouncedSearch.length >= 3 ? debouncedSearch : undefined),
    [debouncedSearch]
  );

  // Available filter options (derived from loaded data)
  const [tipoResiduoOptions, setTipoResiduoOptions] = useState<string[]>([]);

  // Build filters object
  const buildFilters = useCallback(
    (pageNum: number): CacambaFilters => ({
      page: pageNum,
      limit: PAGE_SIZE,
      ...(activeSearch && { search: activeSearch }),
      ...(tipoResiduoFilter && { tipo_residuo: tipoResiduoFilter }),
      ...(cacambeiroFilter && { cacambeiro_id: cacambeiroFilter }),
    }),
    [activeSearch, tipoResiduoFilter, cacambeiroFilter]
  );

  // Fetch data
  const fetchCacambas = useCallback(
    async (pageNum: number, isRefresh = false) => {
      try {
        if (pageNum === 1 && !isRefresh) {
          setIsLoading(true);
        }
        setError(null);

        const filters = buildFilters(pageNum);
        const response: PaginatedResponse<CacambaListItem> =
          await cacambasService.listar(filters);

        if (pageNum === 1) {
          setCacambas(response.data);
        } else {
          setCacambas((prev) => [...prev, ...response.data]);
        }

        setTotalPages(response.totalPages);
        setPage(pageNum);

        // Extract unique tipo_residuo values for filter options
        if (pageNum === 1 && response.data.length > 0) {
          const tipos = [...new Set(response.data.map((c) => c.tipo_residuo))];
          setTipoResiduoOptions((prev) => {
            const merged = [...new Set([...prev, ...tipos])];
            return merged.sort();
          });
        }
      } catch (err) {
        setError('Não foi possível carregar as caçambas. Tente novamente.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [buildFilters]
  );

  // Initial load and filter changes
  useEffect(() => {
    setCacambas([]);
    setPage(1);
    fetchCacambas(1);
  }, [activeSearch, tipoResiduoFilter, cacambeiroFilter]);

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchCacambas(1, true);
  }, [fetchCacambas]);

  // Load more (pagination)
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    fetchCacambas(page + 1);
  }, [isLoadingMore, page, totalPages, fetchCacambas]);

  // Retry on error
  const handleRetry = useCallback(() => {
    fetchCacambas(1);
  }, [fetchCacambas]);

  // Navigate to detail
  const handleCardPress = useCallback((id: string) => {
    router.push(`/(consumer)/(home)/${id}`);
  }, []);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setTipoResiduoFilter(null);
    setCacambeiroFilter(null);
    setSearchText('');
  }, []);

  // Format price
  const formatPrice = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Render dumpster card
  const renderItem = useCallback(
    ({ item }: { item: CacambaListItem }) => (
      <TouchableOpacity
        onPress={() => handleCardPress(item.id)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Caçamba ${item.nome}, ${item.tipo_residuo}, ${item.tamanho_m3}m³, ${formatPrice(item.preco_diaria)} por dia`}
      >
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.cardContent}>
            {item.foto_url && (
              <Image
                source={{ uri: item.foto_url }}
                style={[styles.cardImage, { borderRadius: radius.md }]}
                contentFit="cover"
                accessibilityLabel={`Foto da caçamba ${item.nome}`}
              />
            )}
            <View style={styles.cardInfo}>
              <Text
                style={{
                  fontSize: typography.fontSize.md,
                  fontFamily: typography.fontFamilyBold,
                  color: colors.textPrimary,
                  marginBottom: spacing.xs,
                }}
                numberOfLines={1}
              >
                {item.nome}
              </Text>
              <View style={styles.cardRow}>
                <Ionicons name="trash-outline" size={14} color={colors.textSecondary} />
                <Text
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.textSecondary,
                    marginLeft: spacing.xs,
                  }}
                >
                  {item.tipo_residuo}
                </Text>
              </View>
              <View style={styles.cardRow}>
                <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
                <Text
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.textSecondary,
                    marginLeft: spacing.xs,
                  }}
                >
                  {item.tamanho_m3}m³
                </Text>
              </View>
              <View style={[styles.cardRow, { marginTop: spacing.xs }]}>
                <Text
                  style={{
                    fontSize: typography.fontSize.md,
                    fontFamily: typography.fontFamilyBold,
                    color: colors.primaryGreen,
                  }}
                >
                  {formatPrice(item.preco_diaria)}/dia
                </Text>
              </View>
              {item.cacambeiro_nome && (
                <View style={[styles.cardRow, { marginTop: spacing.xs }]}>
                  <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                  <Text
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.textSecondary,
                      marginLeft: spacing.xs,
                    }}
                    numberOfLines={1}
                  >
                    {item.cacambeiro_nome}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    ),
    [colors, spacing, typography, radius, handleCardPress]
  );

  // Render filter chips
  const renderFilters = () => (
    <View style={[styles.filtersContainer, { marginBottom: spacing.md }]}>
      {tipoResiduoOptions.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tipoResiduoOptions}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          renderItem={({ item: tipo }) => {
            const isActive = tipoResiduoFilter === tipo;
            return (
              <TouchableOpacity
                onPress={() =>
                  setTipoResiduoFilter(isActive ? null : tipo)
                }
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? colors.primaryGreen : colors.surfaceVariant,
                    borderRadius: radius.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    marginRight: spacing.sm,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${tipo}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={{
                    fontSize: typography.fontSize.xs,
                    fontFamily: typography.fontFamilyMedium,
                    color: isActive ? colors.textInverse : colors.textPrimary,
                  }}
                >
                  {tipo}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );

  // Render footer (loading more indicator)
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: spacing.lg }}>
        <LoadingSpinner size="small" message="Carregando mais..." />
      </View>
    );
  };

  // Render header (search + filters)
  const renderHeader = () => (
    <View>
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <TextInputField
          placeholder="Buscar caçambas..."
          value={searchText}
          onChangeText={setSearchText}
          accessibilityLabel="Campo de busca de caçambas"
        />
      </View>
      {renderFilters()}
      {(tipoResiduoFilter || cacambeiroFilter) && (
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
          <TouchableOpacity
            onPress={handleClearFilters}
            accessibilityRole="button"
            accessibilityLabel="Limpar filtros"
          >
            <Text
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.primaryGreen,
                fontFamily: typography.fontFamilyMedium,
              }}
            >
              Limpar filtros
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Loading state (initial)
  if (isLoading && cacambas.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
          <Text
            style={{
              fontSize: typography.fontSize.xl,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
            }}
          >
            Marketplace
          </Text>
        </View>
        <View style={styles.centered}>
          <LoadingSpinner message="Carregando caçambas..." />
        </View>
      </View>
    );
  }

  // Error state
  if (error && cacambas.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
          <Text
            style={{
              fontSize: typography.fontSize.xl,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
            }}
          >
            Marketplace
          </Text>
        </View>
        <View style={styles.centered}>
          <EmptyState
            title="Erro ao carregar"
            description={error}
            actionLabel="Tentar novamente"
            onActionPress={handleRetry}
            icon="alert-circle-outline"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <Text
          style={{
            fontSize: typography.fontSize.xl,
            fontFamily: typography.fontFamilyBold,
            color: colors.textPrimary,
          }}
        >
          Marketplace
        </Text>
      </View>

      <FlatList
        data={cacambas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <EmptyState
            title="Nenhuma caçamba encontrada"
            description="Tente ajustar os filtros ou a busca para encontrar caçambas disponíveis."
            icon="search-outline"
            actionLabel={tipoResiduoFilter || searchText ? 'Limpar filtros' : undefined}
            onActionPress={tipoResiduoFilter || searchText ? handleClearFilters : undefined}
          />
        }
        refreshControl={renderRefreshControl({
            refreshing: isRefreshing,
            onRefresh: handleRefresh,
            colors: [colors.primaryGreen],
            tintColor: colors.primaryGreen,
        })}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />
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
  filtersContainer: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flexDirection: 'row',
  },
  cardImage: {
    width: 80,
    height: 80,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
