import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Card, EmptyState, LoadingSpinner, TextInputField } from '../../../components/ui';
import { useTheme } from '../../../hooks/useTheme';
import * as cacambasService from '../../../services/cacambasService';
import { Cacamba } from '../../../types';

interface FormErrors {
  preco_diaria?: string;
  foto_url?: string;
}

export default function EditarCacambaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, spacing, typography, radius } = useTheme();

  const [cacamba, setCacamba] = useState<Cacamba | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [precoDiaria, setPrecoDiaria] = useState('');
  const [disponivel, setDisponivel] = useState(true);
  const [fotoUrl, setFotoUrl] = useState('');

  // Form state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Fetch dumpster details ──────────────────────────────────────────────────

  const fetchCacamba = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await cacambasService.detalhe(id);
      setCacamba(data);
      setPrecoDiaria(data.preco_diaria.toString());
      setDisponivel(data.disponivel);
      setFotoUrl(data.foto_url || '');
    } catch (err: any) {
      const message =
        err?.response?.data?.mensagem ||
        err?.response?.data?.message ||
        'Não foi possível carregar os dados da caçamba.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCacamba();
  }, [fetchCacamba]);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: FormErrors = {};

    const precoNum = parseFloat(precoDiaria.replace(',', '.'));
    if (!precoDiaria.trim()) {
      newErrors.preco_diaria = 'Preço por diária é obrigatório.';
    } else if (isNaN(precoNum) || precoNum < 0.01 || precoNum > 99999999.99) {
      newErrors.preco_diaria = 'Preço deve ser entre R$ 0.01 e R$ 99.999.999,99.';
    }

    if (fotoUrl.trim()) {
      try {
        new URL(fotoUrl.trim());
      } catch {
        newErrors.foto_url = 'URL da foto inválida.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!id || !validate()) return;

    setIsSaving(true);
    try {
      await cacambasService.atualizar(id, {
        preco_diaria: parseFloat(precoDiaria.replace(',', '.')),
        disponivel,
        foto_url: fotoUrl.trim() || null,
      });

      Alert.alert('Sucesso', 'Caçamba atualizada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err?.response?.data?.mensagem ||
        err?.response?.data?.message ||
        'Não foi possível atualizar a caçamba. Tente novamente.';

      if (err?.response?.data?.erros) {
        const backendErrors: FormErrors = {};
        const erros = err.response.data.erros;
        if (erros.preco_diaria) backendErrors.preco_diaria = erros.preco_diaria;
        if (erros.foto_url) backendErrors.foto_url = erros.foto_url;

        if (Object.keys(backendErrors).length > 0) {
          setErrors(backendErrors);
          return;
        }
      }

      Alert.alert('Erro', message);
    } finally {
      setIsSaving(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  function handleDeletePress() {
    setDeleteError(null);
    Alert.alert(
      'Excluir Caçamba',
      `Tem certeza que deseja excluir "${cacamba?.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: confirmDelete },
      ]
    );
  }

  async function confirmDelete() {
    if (!id) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await cacambasService.remover(id);
      Alert.alert('Sucesso', 'Caçamba excluída com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err?.response?.data?.mensagem ||
        err?.response?.data?.message ||
        'Não foi possível excluir a caçamba.';

      // Check for constraint error (active orders)
      const status = err?.response?.status;
      if (status === 409 || status === 400) {
        setDeleteError(message);
      } else {
        Alert.alert('Erro', message);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  // ── Clear field error on change ─────────────────────────────────────────────

  function clearError(field: keyof FormErrors) {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  // ── Loading state ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Carregando caçamba..." />
      </View>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error || !cacamba) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Erro ao carregar"
          description={error || 'Caçamba não encontrada.'}
          icon="alert-circle-outline"
          actionLabel="Tentar novamente"
          onActionPress={fetchCacamba}
        />
      </View>
    );
  }

  // ── Edit form ───────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Non-editable info */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: typography.fontSizeSm,
              fontFamily: typography.fontFamilyMedium,
              color: colors.textSecondary,
              marginBottom: spacing.md,
            }}
          >
            Informações da Caçamba
          </Text>

          <View style={[styles.infoRow, { marginBottom: spacing.sm }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: typography.fontSizeXs }]}>
              Nome
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary, fontSize: typography.fontSizeSm, fontFamily: typography.fontFamilyMedium }]}>
              {cacamba.nome}
            </Text>
          </View>

          <View style={[styles.infoRow, { marginBottom: spacing.sm }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: typography.fontSizeXs }]}>
              Tipo de Resíduo
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary, fontSize: typography.fontSizeSm, fontFamily: typography.fontFamilyMedium }]}>
              {cacamba.tipo_residuo}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: typography.fontSizeXs }]}>
              Tamanho
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary, fontSize: typography.fontSizeSm, fontFamily: typography.fontFamilyMedium }]}>
              {cacamba.tamanho_m3} m³
            </Text>
          </View>
        </Card>

        {/* Editable fields */}
        <Text
          style={{
            fontSize: typography.fontSizeSm,
            fontFamily: typography.fontFamilyMedium,
            color: colors.textSecondary,
            marginBottom: spacing.md,
          }}
        >
          Editar
        </Text>

        <TextInputField
          label="Preço por Diária (R$)"
          placeholder="Ex: 150.00"
          value={precoDiaria}
          onChangeText={(text) => {
            setPrecoDiaria(text);
            clearError('preco_diaria');
          }}
          keyboardType="decimal-pad"
          error={errors.preco_diaria}
          accessibilityLabel="Preço por diária em reais"
          style={{ marginBottom: spacing.lg }}
        />

        {/* Disponível toggle */}
        <View
          style={[
            styles.toggleRow,
            {
              marginBottom: spacing.lg,
              padding: spacing.md,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                fontFamily: typography.fontFamilyMedium,
                color: colors.textPrimary,
              }}
            >
              Disponível para aluguel
            </Text>
            <Text
              style={{
                fontSize: typography.fontSizeXs,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {disponivel
                ? 'A caçamba está visível no marketplace'
                : 'A caçamba não aparece no marketplace'}
            </Text>
          </View>
          <Switch
            value={disponivel}
            onValueChange={setDisponivel}
            trackColor={{ false: colors.border, true: colors.primaryGreen + '80' }}
            thumbColor={disponivel ? colors.primaryGreen : colors.gray}
            accessibilityLabel="Disponível para aluguel"
            accessibilityRole="switch"
          />
        </View>

        <TextInputField
          label="URL da Foto (opcional)"
          placeholder="https://exemplo.com/foto.jpg"
          value={fotoUrl}
          onChangeText={(text) => {
            setFotoUrl(text);
            clearError('foto_url');
          }}
          error={errors.foto_url}
          accessibilityLabel="URL da foto da caçamba"
          style={{ marginBottom: spacing.xl }}
        />

        {/* Save button */}
        <Button
          label={isSaving ? 'Salvando...' : 'Salvar Alterações'}
          onPress={handleSave}
          variant="primary"
          loading={isSaving}
          disabled={isSaving || isDeleting}
          accessibilityLabel="Salvar alterações"
          style={{ marginBottom: spacing.lg }}
        />

        {/* Delete section */}
        <View
          style={[
            styles.deleteSection,
            {
              paddingTop: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            },
          ]}
        >
          {deleteError && (
            <View
              style={[
                styles.deleteErrorContainer,
                {
                  backgroundColor: colors.errorLight,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <View style={styles.deleteErrorRow}>
                <Ionicons name="warning-outline" size={18} color={colors.error} />
                <Text
                  style={{
                    fontSize: typography.fontSizeSm,
                    color: colors.error,
                    marginLeft: spacing.sm,
                    flex: 1,
                  }}
                  accessibilityRole="alert"
                >
                  {deleteError}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleDeletePress}
            disabled={isDeleting || isSaving}
            activeOpacity={0.7}
            accessibilityLabel="Excluir caçamba"
            accessibilityRole="button"
            style={[
              styles.deleteButton,
              {
                padding: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.error,
                opacity: isDeleting || isSaving ? 0.5 : 1,
              },
            ]}
          >
            {isDeleting ? (
              <Text
                style={{
                  fontSize: typography.fontSizeSm,
                  fontFamily: typography.fontFamilyMedium,
                  color: colors.error,
                }}
              >
                Excluindo...
              </Text>
            ) : (
              <View style={styles.deleteButtonContent}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <Text
                  style={{
                    fontSize: typography.fontSizeSm,
                    fontFamily: typography.fontFamilyMedium,
                    color: colors.error,
                    marginLeft: spacing.sm,
                  }}
                >
                  Excluir Caçamba
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {},
  infoValue: {},
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteSection: {},
  deleteErrorContainer: {},
  deleteErrorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
