import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Button,
    Card,
    EmptyState,
    LoadingSpinner,
    TextInputField,
} from '../../components/ui';
import { renderRefreshControl } from '../../components/ui/PlatformRefreshControl';
import { useTheme } from '../../hooks/useTheme';
import * as adminService from '../../services/adminService';
import type { Categoria } from '../../types';

type FormMode = 'create' | 'edit';

export default function CategoriasScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();

  // ─── State ─────────────────────────────────────────────────────────────────
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [nome, setNome] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const fetchCategorias = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);
      const result = await adminService.listarCategorias();
      setCategorias(result);
    } catch {
      setError('Não foi possível carregar as categorias. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchCategorias(true);
  }, [fetchCategorias]);

  // ─── Validation ────────────────────────────────────────────────────────────
  const validate = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'O nome da categoria é obrigatório.';
    }
    if (trimmed.length > 100) {
      return 'O nome deve ter no máximo 100 caracteres.';
    }
    return null;
  };

  // ─── Form Handlers ─────────────────────────────────────────────────────────
  const openCreateForm = () => {
    setFormMode('create');
    setEditingCategoria(null);
    setNome('');
    setFormError(null);
    setModalVisible(true);
  };

  const openEditForm = (categoria: Categoria) => {
    setFormMode('edit');
    setEditingCategoria(categoria);
    setNome(categoria.nome);
    setFormError(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setFormError(null);
  };

  const handleSave = async () => {
    const validationError = validate(nome);
    if (validationError) {
      setFormError(validationError);
      return; // Preserve input on validation failure
    }

    try {
      setIsSaving(true);
      setFormError(null);

      if (formMode === 'create') {
        await adminService.criarCategoria({ nome: nome.trim() });
      } else if (editingCategoria) {
        await adminService.atualizarCategoria(editingCategoria.id, { nome: nome.trim() });
      }

      setModalVisible(false);
      setNome('');
      await fetchCategorias();
    } catch (err: unknown) {
      // Handle 409 duplicate name
      if (isAxiosError(err) && err.response?.status === 409) {
        setFormError('Já existe uma categoria com este nome.');
      } else {
        setFormError('Erro ao salvar categoria. Tente novamente.');
      }
      // Preserve input on error - don't clear nome
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Delete Handler ────────────────────────────────────────────────────────
  const handleDelete = (categoria: Categoria) => {
    const count = categoria.cacambas_count ?? 0;

    if (count > 0) {
      Alert.alert(
        'Não é possível excluir',
        `A categoria "${categoria.nome}" possui ${count} caçamba${count > 1 ? 's' : ''} associada${count > 1 ? 's' : ''}. Remova as caçambas antes de excluir.`,
        [{ text: 'Entendi', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Excluir categoria',
      `Tem certeza que deseja excluir "${categoria.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.removerCategoria(categoria.id);
              await fetchCategorias();
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a categoria. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  // ─── Loading State ─────────────────────────────────────────────────────────
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
            Categorias
          </Text>
        </View>
        <View style={styles.centered}>
          <LoadingSpinner message="Carregando categorias..." />
        </View>
      </View>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────────
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
            Categorias
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
            onPress={fetchCategorias}
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

  // ─── Main Content ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }]}>
        <Text
          style={{
            fontSize: typography.fontSize.xl,
            fontFamily: typography.fontFamilyBold,
            color: colors.textPrimary,
          }}
        >
          Categorias
        </Text>
        <TouchableOpacity
          onPress={openCreateForm}
          style={[
            styles.addButton,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Adicionar categoria"
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamilyMedium,
              color: colors.textInverse,
              marginLeft: spacing.xs,
            }}
          >
            Nova
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category List */}
      {categorias.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState
            title="Nenhuma categoria"
            description="Adicione categorias para organizar as caçambas."
            actionLabel="Criar categoria"
            onActionPress={openCreateForm}
            icon="folder-open-outline"
          />
        </View>
      ) : (
        <FlatList
          data={categorias}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
          refreshControl={renderRefreshControl({
            refreshing: isRefreshing,
            onRefresh: handleRefresh,
            colors: [colors.primaryGreen],
            tintColor: colors.primaryGreen,
          })}
          renderItem={({ item }) => (
            <Card
              style={{ marginBottom: spacing.md }}
              accessibilityLabel={`Categoria ${item.nome}, ${item.cacambas_count ?? 0} caçambas`}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardInfo}>
                  <Text
                    style={{
                      fontSize: typography.fontSize.md,
                      fontFamily: typography.fontFamilyBold,
                      color: colors.textPrimary,
                    }}
                    numberOfLines={1}
                  >
                    {item.nome}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.textSecondary,
                      marginTop: spacing.xs,
                    }}
                  >
                    {item.cacambas_count ?? 0} caçamba{(item.cacambas_count ?? 0) !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => openEditForm(item)}
                    style={[styles.iconButton, { marginRight: spacing.sm }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar categoria ${item.nome}`}
                  >
                    <Ionicons name="pencil-outline" size={20} color={colors.info} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    style={styles.iconButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir categoria ${item.nome}`}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.xl,
                marginHorizontal: spacing.lg,
              },
            ]}
          >
            <Text
              style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
                marginBottom: spacing.lg,
              }}
            >
              {formMode === 'create' ? 'Nova Categoria' : 'Editar Categoria'}
            </Text>

            <TextInputField
              label="Nome da categoria"
              placeholder="Ex: Entulho"
              value={nome}
              onChangeText={(text) => {
                setNome(text);
                if (formError) setFormError(null);
              }}
              error={formError ?? undefined}
              accessibilityLabel="Nome da categoria"
            />

            <View style={[styles.modalActions, { marginTop: spacing.xl }]}>
              <Button
                label="Cancelar"
                onPress={closeModal}
                variant="outline"
                fullWidth={false}
                style={{ flex: 1, marginRight: spacing.sm }}
                disabled={isSaving}
              />
              <Button
                label={formMode === 'create' ? 'Criar' : 'Salvar'}
                onPress={handleSave}
                variant="primary"
                fullWidth={false}
                loading={isSaving}
                disabled={isSaving}
                style={{ flex: 1, marginLeft: spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface AxiosErrorLike {
  response?: { status: number };
}

function isAxiosError(err: unknown): err is AxiosErrorLike {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as AxiosErrorLike).response?.status === 'number'
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
