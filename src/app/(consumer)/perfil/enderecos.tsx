import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Button,
    Card,
    EmptyState,
    LoadingSpinner,
    TextInputField,
} from '../../../components/ui';
import { renderRefreshControl } from '../../../components/ui/PlatformRefreshControl';
import { useTheme } from '../../../hooks/useTheme';
import * as enderecosService from '../../../services/enderecosService';
import { Endereco } from '../../../types';

// ─── Validation helpers ──────────────────────────────────────────────────────

interface FormErrors {
  cep?: string;
  logradouro?: string;
  numero?: string;
  cidade_estado?: string;
}

function validateForm(form: {
  cep: string;
  logradouro: string;
  numero: string;
  cidade_estado: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!form.cep || !/^\d{8}$/.test(form.cep)) {
    errors.cep = 'CEP deve conter exatamente 8 dígitos numéricos.';
  }

  if (!form.logradouro || form.logradouro.length < 1 || form.logradouro.length > 200) {
    errors.logradouro = 'Logradouro é obrigatório (máx. 200 caracteres).';
  }

  if (!form.numero || form.numero.length < 1 || form.numero.length > 20) {
    errors.numero = 'Número é obrigatório (máx. 20 caracteres).';
  }

  if (!form.cidade_estado || form.cidade_estado.length < 1 || form.cidade_estado.length > 100) {
    errors.cidade_estado = 'Cidade/Estado é obrigatório (máx. 100 caracteres).';
  }

  return errors;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function EnderecosScreen() {
  const { colors, spacing, typography, radius } = useTheme();

  // List state
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidadeEstado, setCidadeEstado] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch addresses ─────────────────────────────────────────────────────────

  const fetchEnderecos = useCallback(async () => {
    setError(null);
    try {
      const data = await enderecosService.listar();
      setEnderecos(data);
    } catch {
      setError('Não foi possível carregar os endereços. Tente novamente.');
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    await fetchEnderecos();
    setLoading(false);
  }, [fetchEnderecos]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEnderecos();
    setRefreshing(false);
  }, [fetchEnderecos]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // ── Form handlers ───────────────────────────────────────────────────────────

  function resetForm() {
    setCep('');
    setLogradouro('');
    setNumero('');
    setBairro('');
    setCidadeEstado('');
    setFormErrors({});
    setFormMessage(null);
  }

  async function handleSubmit() {
    setFormMessage(null);

    // Client-side validation
    const errors = validateForm({ cep, logradouro, numero, cidade_estado: cidadeEstado });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    // Check local limit before request
    if (enderecos.length >= 10) {
      setFormMessage('Limite de 10 endereços atingido. Remova um endereço para adicionar outro.');
      return;
    }

    setSubmitting(true);
    try {
      const novo = await enderecosService.criar({
        cep,
        logradouro,
        numero,
        bairro,
        cidade_estado: cidadeEstado,
      });
      setEnderecos((prev) => [novo, ...prev]);
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      const responseData = err?.response?.data;
      if (responseData?.error?.includes('Limite de 10')) {
        setFormMessage('Limite de 10 endereços atingido. Remova um endereço para adicionar outro.');
      } else if (responseData?.fields) {
        // Field-specific errors from backend
        setFormErrors(responseData.fields);
      } else {
        setFormMessage(responseData?.error || 'Erro ao salvar endereço. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete handler ──────────────────────────────────────────────────────────

  function handleDeletePress(endereco: Endereco) {
    Alert.alert(
      'Remover endereço',
      `Deseja remover o endereço "${endereco.logradouro}, ${endereco.numero}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => confirmDelete(endereco.id),
        },
      ]
    );
  }

  async function confirmDelete(id: string) {
    setDeletingId(id);
    try {
      await enderecosService.remover(id);
      setEnderecos((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      const message = err?.response?.data?.error || '';
      if (message.includes('pedidos ativos')) {
        Alert.alert(
          'Não é possível remover',
          'Este endereço possui pedidos ativos vinculados. Aguarde a finalização dos pedidos.'
        );
      } else {
        Alert.alert('Erro', message || 'Não foi possível remover o endereço. Tente novamente.');
      }
    } finally {
      setDeletingId(null);
    }
  }

  // ── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Carregando endereços..." />
      </View>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error && enderecos.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Erro ao carregar"
          description={error}
          icon="alert-circle-outline"
          actionLabel="Tentar novamente"
          onActionPress={loadInitial}
        />
      </View>
    );
  }

  // ── Main content ────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={renderRefreshControl({
            refreshing: refreshing,
            onRefresh: handleRefresh,
            colors: [colors.primaryGreen],
            tintColor: colors.primaryGreen,
        })}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
          <View>
            <Text
              style={{
                fontSize: typography.fontSizeLg,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
              }}
            >
              Meus Endereços
            </Text>
            <Text
              style={{
                fontSize: typography.fontSizeSm,
                color: colors.textSecondary,
                marginTop: spacing.xs,
              }}
            >
              {enderecos.length} de 10 endereços
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
            accessibilityLabel={showForm ? 'Fechar formulário' : 'Adicionar endereço'}
            accessibilityRole="button"
            style={[
              styles.addButton,
              {
                backgroundColor: showForm ? colors.error + '15' : colors.primaryGreen + '15',
                borderRadius: radius.md,
                padding: spacing.sm,
              },
            ]}
          >
            <Ionicons
              name={showForm ? 'close' : 'add'}
              size={22}
              color={showForm ? colors.error : colors.primaryGreen}
            />
          </TouchableOpacity>
        </View>

        {/* Add form */}
        {showForm && (
          <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}>
            <Text
              style={{
                fontSize: typography.fontSizeMd,
                fontFamily: typography.fontFamilyBold,
                color: colors.textPrimary,
                marginBottom: spacing.md,
              }}
            >
              Novo Endereço
            </Text>

            {formMessage && (
              <View
                style={[
                  styles.messageBox,
                  {
                    backgroundColor: colors.error + '15',
                    borderRadius: radius.sm,
                    padding: spacing.sm,
                    marginBottom: spacing.md,
                  },
                ]}
                accessibilityRole="alert"
              >
                <Text style={{ color: colors.error, fontSize: typography.fontSizeSm }}>
                  {formMessage}
                </Text>
              </View>
            )}

            <TextInputField
              label="CEP"
              placeholder="00000000"
              value={cep}
              onChangeText={(text) => {
                setCep(text.replace(/\D/g, '').slice(0, 8));
                if (formErrors.cep) setFormErrors((prev) => ({ ...prev, cep: undefined }));
              }}
              keyboardType="numeric"
              error={formErrors.cep}
              accessibilityLabel="CEP"
              style={{ marginBottom: spacing.md }}
            />

            <TextInputField
              label="Logradouro"
              placeholder="Rua, Avenida, etc."
              value={logradouro}
              onChangeText={(text) => {
                setLogradouro(text.slice(0, 200));
                if (formErrors.logradouro) setFormErrors((prev) => ({ ...prev, logradouro: undefined }));
              }}
              error={formErrors.logradouro}
              accessibilityLabel="Logradouro"
              style={{ marginBottom: spacing.md }}
            />

            <TextInputField
              label="Número"
              placeholder="123"
              value={numero}
              onChangeText={(text) => {
                setNumero(text.slice(0, 20));
                if (formErrors.numero) setFormErrors((prev) => ({ ...prev, numero: undefined }));
              }}
              error={formErrors.numero}
              accessibilityLabel="Número"
              style={{ marginBottom: spacing.md }}
            />

            <TextInputField
              label="Bairro (opcional)"
              placeholder="Bairro"
              value={bairro}
              onChangeText={setBairro}
              accessibilityLabel="Bairro"
              style={{ marginBottom: spacing.md }}
            />

            <TextInputField
              label="Cidade / Estado"
              placeholder="São Paulo - SP"
              value={cidadeEstado}
              onChangeText={(text) => {
                setCidadeEstado(text.slice(0, 100));
                if (formErrors.cidade_estado) setFormErrors((prev) => ({ ...prev, cidade_estado: undefined }));
              }}
              error={formErrors.cidade_estado}
              accessibilityLabel="Cidade e Estado"
              style={{ marginBottom: spacing.lg }}
            />

            <Button
              label="Salvar Endereço"
              onPress={handleSubmit}
              variant="primary"
              loading={submitting}
              disabled={submitting}
              accessibilityLabel="Salvar endereço"
            />
          </Card>
        )}

        {/* Empty state */}
        {enderecos.length === 0 && !showForm && (
          <View style={{ marginTop: spacing.xl }}>
            <EmptyState
              title="Nenhum endereço cadastrado"
              description="Adicione um endereço para facilitar suas entregas."
              icon="location-outline"
              actionLabel="Adicionar endereço"
              onActionPress={() => setShowForm(true)}
            />
          </View>
        )}

        {/* Address list */}
        {enderecos.map((endereco) => (
          <Card
            key={endereco.id}
            style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}
            accessibilityLabel={`Endereço: ${endereco.logradouro}, ${endereco.numero}`}
          >
            <View style={styles.addressRow}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: typography.fontSizeMd,
                    fontFamily: typography.fontFamilyBold,
                    color: colors.textPrimary,
                    marginBottom: spacing.xs,
                  }}
                >
                  {endereco.logradouro}, {endereco.numero}
                </Text>
                {endereco.bairro ? (
                  <Text
                    style={{
                      fontSize: typography.fontSizeSm,
                      color: colors.textSecondary,
                      marginBottom: spacing.xs,
                    }}
                  >
                    {endereco.bairro}
                  </Text>
                ) : null}
                <Text
                  style={{
                    fontSize: typography.fontSizeSm,
                    color: colors.textSecondary,
                    marginBottom: spacing.xs,
                  }}
                >
                  {endereco.cidade_estado}
                </Text>
                <Text
                  style={{
                    fontSize: typography.fontSizeXs,
                    color: colors.textSecondary,
                  }}
                >
                  CEP: {endereco.cep}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDeletePress(endereco)}
                disabled={deletingId === endereco.id}
                accessibilityLabel={`Remover endereço ${endereco.logradouro}, ${endereco.numero}`}
                accessibilityRole="button"
                style={[
                  styles.deleteButton,
                  {
                    backgroundColor: colors.error + '15',
                    borderRadius: radius.sm,
                    padding: spacing.sm,
                    opacity: deletingId === endereco.id ? 0.5 : 1,
                  },
                ]}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBox: {},
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
