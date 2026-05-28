import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import TextInputField from '../../components/ui/TextInputField';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import * as usuariosService from '../../services/usuariosService';
import { DetalhesCacambeiro, User } from '../../types';

// ─── Validation ──────────────────────────────────────────────────────────────

interface FormErrors {
  nome_completo?: string;
  telefone?: string;
}

function validate(nome: string, telefone: string): FormErrors {
  const errors: FormErrors = {};

  if (nome.trim().length < 3 || nome.trim().length > 120) {
    errors.nome_completo = 'Nome deve ter entre 3 e 120 caracteres';
  }

  const digits = telefone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    errors.telefone = 'Telefone deve ter entre 10 e 15 dígitos';
  }

  return errors;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface PerfilCacambeiro extends User {
  detalhes_cacambeiro?: DetalhesCacambeiro;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function PerfilScreen() {
  const { colors, spacing, typography } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();

  const [perfil, setPerfil] = useState<PerfilCacambeiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  // ── Fetch profile on mount ────────────────────────────────────────────────

  const fetchPerfil = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await usuariosService.getPerfil()) as PerfilCacambeiro;
      setPerfil(data);
      setNomeCompleto(data.nome_completo);
      setTelefone(data.telefone);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o perfil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerfil();
  }, [fetchPerfil]);

  // ── Save profile ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSuccessMessage('');
    const validationErrors = validate(nomeCompleto, telefone);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setSaving(true);
      const updated = (await usuariosService.updatePerfil({
        nome_completo: nomeCompleto.trim(),
        telefone: telefone.trim(),
      })) as PerfilCacambeiro;
      setPerfil(updated);
      setNomeCompleto(updated.nome_completo);
      setTelefone(updated.telefone);
      setSuccessMessage('Perfil atualizado com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const detalhes = perfil?.detalhes_cacambeiro;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.lg }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={[styles.header, { marginBottom: spacing.lg }]}>
        <Ionicons name="person-circle-outline" size={64} color={colors.primary} />
        <Text
          style={{
            fontSize: typography.fontSizeLg,
            fontFamily: typography.fontFamilyBold,
            color: colors.textPrimary,
            marginTop: spacing.sm,
          }}
        >
          Meu Perfil
        </Text>
      </View>

      {/* Editable fields */}
      <Card style={{ marginBottom: spacing.md }}>
        <TextInputField
          label="Nome completo"
          value={nomeCompleto}
          onChangeText={(text) => {
            setNomeCompleto(text);
            if (errors.nome_completo) setErrors((prev) => ({ ...prev, nome_completo: undefined }));
          }}
          error={errors.nome_completo}
          accessibilityLabel="Nome completo"
          style={{ marginBottom: spacing.md }}
        />

        <TextInputField
          label="Telefone"
          value={telefone}
          onChangeText={(text) => {
            setTelefone(text);
            if (errors.telefone) setErrors((prev) => ({ ...prev, telefone: undefined }));
          }}
          keyboardType="phone-pad"
          error={errors.telefone}
          accessibilityLabel="Telefone"
        />
      </Card>

      {/* Read-only fields */}
      <Card style={{ marginBottom: spacing.md }}>
        <TextInputField
          label="Email"
          value={perfil?.email ?? ''}
          onChangeText={() => {}}
          editable={false}
          accessibilityLabel="Email"
          style={{ marginBottom: spacing.md }}
        />

        <TextInputField
          label="Documento"
          value={perfil?.documento ?? ''}
          onChangeText={() => {}}
          editable={false}
          accessibilityLabel="Documento"
          style={{ marginBottom: spacing.md }}
        />

        <View style={styles.badgeRow}>
          <Text
            style={{
              fontSize: typography.fontSizeXs,
              fontFamily: typography.fontFamilyMedium,
              color: colors.textSecondary,
              marginBottom: spacing.xs,
            }}
          >
            Tipo de perfil
          </Text>
          <Badge
            label={perfil?.tipo_perfil ?? ''}
            variant="warning"
            accessibilityLabel={`Tipo de perfil: ${perfil?.tipo_perfil}`}
          />
        </View>
      </Card>

      {/* Business details (read-only) */}
      {detalhes && (
        <Card style={{ marginBottom: spacing.md }} accessibilityLabel="Detalhes do negócio">
          <Text
            style={{
              fontSize: typography.fontSizeMd,
              fontFamily: typography.fontFamilyBold,
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            Detalhes do Negócio
          </Text>

          <TextInputField
            label="Horário de início"
            value={detalhes.horario_inicio}
            onChangeText={() => {}}
            editable={false}
            accessibilityLabel="Horário de início"
            style={{ marginBottom: spacing.md }}
          />

          <TextInputField
            label="Horário de fim"
            value={detalhes.horario_fim}
            onChangeText={() => {}}
            editable={false}
            accessibilityLabel="Horário de fim"
            style={{ marginBottom: spacing.md }}
          />

          <TextInputField
            label="Raio de entrega (km)"
            value={String(detalhes.raio_entrega_km)}
            onChangeText={() => {}}
            editable={false}
            accessibilityLabel="Raio de entrega em quilômetros"
            style={{ marginBottom: spacing.md }}
          />

          <TextInputField
            label="Taxa de entrega (R$)"
            value={detalhes.taxa_entrega.toFixed(2)}
            onChangeText={() => {}}
            editable={false}
            accessibilityLabel="Taxa de entrega"
          />
        </Card>
      )}

      {/* Success message */}
      {successMessage !== '' && (
        <View
          style={[
            styles.successBanner,
            {
              backgroundColor: colors.successLight,
              padding: spacing.sm,
              borderRadius: 8,
              marginBottom: spacing.md,
            },
          ]}
          accessibilityRole="alert"
        >
          <Text style={{ color: colors.success, fontSize: typography.fontSizeSm }}>
            {successMessage}
          </Text>
        </View>
      )}

      {/* Save button */}
      <Button
        label="Salvar alterações"
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        variant="primary"
        accessibilityLabel="Salvar alterações do perfil"
        style={{ marginBottom: spacing.lg }}
      />

      {/* Logout button */}
      <Button
        label="Sair da conta"
        onPress={handleLogout}
        variant="outline"
        accessibilityLabel="Sair da conta"
        style={{ marginBottom: spacing.xl }}
      />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
    alignItems: 'center',
  },
  badgeRow: {
    marginTop: 4,
  },
  successBanner: {
    alignItems: 'center',
  },
});
