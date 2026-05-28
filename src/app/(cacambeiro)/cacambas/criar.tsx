import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text
} from 'react-native';
import { Button, TextInputField } from '../../../components/ui';
import { useTheme } from '../../../hooks/useTheme';
import * as cacambasService from '../../../services/cacambasService';

interface FormErrors {
  nome?: string;
  tipo_residuo?: string;
  tamanho_m3?: string;
  preco_diaria?: string;
  foto_url?: string;
}

export default function CriarCacambaScreen() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();

  const [nome, setNome] = useState('');
  const [tipoResiduo, setTipoResiduo] = useState('');
  const [tamanhoM3, setTamanhoM3] = useState('');
  const [precoDiaria, setPrecoDiaria] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: FormErrors = {};

    // nome: 1-100 chars
    if (!nome.trim()) {
      newErrors.nome = 'Nome é obrigatório.';
    } else if (nome.trim().length > 100) {
      newErrors.nome = 'Nome deve ter no máximo 100 caracteres.';
    }

    // tipo_residuo: 1-50 chars
    if (!tipoResiduo.trim()) {
      newErrors.tipo_residuo = 'Tipo de resíduo é obrigatório.';
    } else if (tipoResiduo.trim().length > 50) {
      newErrors.tipo_residuo = 'Tipo de resíduo deve ter no máximo 50 caracteres.';
    }

    // tamanho_m3: 0.01-999.99
    const tamanhoNum = parseFloat(tamanhoM3.replace(',', '.'));
    if (!tamanhoM3.trim()) {
      newErrors.tamanho_m3 = 'Tamanho é obrigatório.';
    } else if (isNaN(tamanhoNum) || tamanhoNum < 0.01 || tamanhoNum > 999.99) {
      newErrors.tamanho_m3 = 'Tamanho deve ser entre 0.01 e 999.99 m³.';
    }

    // preco_diaria: 0.01-99999999.99
    const precoNum = parseFloat(precoDiaria.replace(',', '.'));
    if (!precoDiaria.trim()) {
      newErrors.preco_diaria = 'Preço por diária é obrigatório.';
    } else if (isNaN(precoNum) || precoNum < 0.01 || precoNum > 99999999.99) {
      newErrors.preco_diaria = 'Preço deve ser entre R$ 0.01 e R$ 99.999.999,99.';
    }

    // foto_url: optional, but if provided must be a valid URL
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

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await cacambasService.criar({
        nome: nome.trim(),
        tipo_residuo: tipoResiduo.trim(),
        tamanho_m3: parseFloat(tamanhoM3.replace(',', '.')),
        preco_diaria: parseFloat(precoDiaria.replace(',', '.')),
        foto_url: fotoUrl.trim() || null,
      });

      Alert.alert('Sucesso', 'Caçamba cadastrada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err?.response?.data?.mensagem ||
        err?.response?.data?.message ||
        'Não foi possível cadastrar a caçamba. Tente novamente.';

      // Check for field-specific errors from backend
      if (err?.response?.data?.erros) {
        const backendErrors: FormErrors = {};
        const erros = err.response.data.erros;
        if (erros.nome) backendErrors.nome = erros.nome;
        if (erros.tipo_residuo) backendErrors.tipo_residuo = erros.tipo_residuo;
        if (erros.tamanho_m3) backendErrors.tamanho_m3 = erros.tamanho_m3;
        if (erros.preco_diaria) backendErrors.preco_diaria = erros.preco_diaria;
        if (erros.foto_url) backendErrors.foto_url = erros.foto_url;

        if (Object.keys(backendErrors).length > 0) {
          setErrors(backendErrors);
          return;
        }
      }

      Alert.alert('Erro', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Clear field error on change ─────────────────────────────────────────────

  function clearError(field: keyof FormErrors) {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

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
        <Text
          style={{
            fontSize: typography.fontSizeLg,
            fontFamily: typography.fontFamilyBold,
            color: colors.textPrimary,
            marginBottom: spacing.xl,
          }}
        >
          Cadastrar Nova Caçamba
        </Text>

        <TextInputField
          label="Nome"
          placeholder="Ex: Caçamba Entulho 5m³"
          value={nome}
          onChangeText={(text) => {
            setNome(text);
            clearError('nome');
          }}
          error={errors.nome}
          accessibilityLabel="Nome da caçamba"
          style={{ marginBottom: spacing.lg }}
        />

        <TextInputField
          label="Tipo de Resíduo"
          placeholder="Ex: Entulho, Madeira, Metálico"
          value={tipoResiduo}
          onChangeText={(text) => {
            setTipoResiduo(text);
            clearError('tipo_residuo');
          }}
          error={errors.tipo_residuo}
          accessibilityLabel="Tipo de resíduo"
          style={{ marginBottom: spacing.lg }}
        />

        <TextInputField
          label="Tamanho (m³)"
          placeholder="Ex: 5.00"
          value={tamanhoM3}
          onChangeText={(text) => {
            setTamanhoM3(text);
            clearError('tamanho_m3');
          }}
          keyboardType="decimal-pad"
          error={errors.tamanho_m3}
          accessibilityLabel="Tamanho em metros cúbicos"
          style={{ marginBottom: spacing.lg }}
        />

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

        <Button
          label={isSubmitting ? 'Cadastrando...' : 'Cadastrar Caçamba'}
          onPress={handleSubmit}
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
          accessibilityLabel="Cadastrar caçamba"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
