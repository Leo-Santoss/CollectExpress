import { Link } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import Button from '../../components/ui/Button';
import TextInputField from '../../components/ui/TextInputField';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { TipoPerfil } from '../../types';

// ─── Validation Helpers ──────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidSenha(senha: string): boolean {
  if (senha.length < 8 || senha.length > 128) return false;
  if (!/[A-Z]/.test(senha)) return false;
  if (!/[a-z]/.test(senha)) return false;
  if (!/\d/.test(senha)) return false;
  return true;
}

function isValidDocumento(documento: string): boolean {
  const digits = documento.replace(/\D/g, '');
  return digits.length === 11 || digits.length === 14;
}

function isValidTelefone(telefone: string): boolean {
  const digits = telefone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}

function isValidTime(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormErrors {
  nome_completo?: string;
  email?: string;
  senha?: string;
  tipo_perfil?: string;
  documento?: string;
  telefone?: string;
  horario_inicio?: string;
  horario_fim?: string;
  raio_entrega_km?: string;
  taxa_entrega?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { register } = useAuth();

  // Form state
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoPerfil, setTipoPerfil] = useState<TipoPerfil | ''>('');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');

  // CACAMBEIRO additional fields
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [raioEntregaKm, setRaioEntregaKm] = useState('');
  const [taxaEntrega, setTaxaEntrega] = useState('');

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const isCacambeiro = tipoPerfil === 'CACAMBEIRO';

  function validate(): boolean {
    const newErrors: FormErrors = {};

    // nome_completo: 3-150 chars
    if (!nomeCompleto.trim()) {
      newErrors.nome_completo = 'Nome completo é obrigatório';
    } else if (nomeCompleto.trim().length < 3 || nomeCompleto.trim().length > 150) {
      newErrors.nome_completo = 'Nome deve ter entre 3 e 150 caracteres';
    }

    // email
    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!isValidEmail(email.trim())) {
      newErrors.email = 'Formato de e-mail inválido';
    }

    // senha: 8-128 chars, 1 uppercase, 1 lowercase, 1 digit
    if (!senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (!isValidSenha(senha)) {
      newErrors.senha = 'Senha deve ter 8-128 caracteres, com maiúscula, minúscula e número';
    }

    // tipo_perfil
    if (!tipoPerfil) {
      newErrors.tipo_perfil = 'Selecione o tipo de perfil';
    }

    // documento: CPF (11) or CNPJ (14)
    if (!documento.trim()) {
      newErrors.documento = 'Documento é obrigatório';
    } else if (!isValidDocumento(documento.trim())) {
      newErrors.documento = 'Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)';
    }

    // telefone: 10-11 digits
    if (!telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    } else if (!isValidTelefone(telefone.trim())) {
      newErrors.telefone = 'Telefone deve ter 10 ou 11 dígitos';
    }

    // CACAMBEIRO business details
    if (isCacambeiro) {
      if (!horarioInicio.trim()) {
        newErrors.horario_inicio = 'Horário de início é obrigatório';
      } else if (!isValidTime(horarioInicio.trim())) {
        newErrors.horario_inicio = 'Formato inválido (use HH:MM)';
      }

      if (!horarioFim.trim()) {
        newErrors.horario_fim = 'Horário de fim é obrigatório';
      } else if (!isValidTime(horarioFim.trim())) {
        newErrors.horario_fim = 'Formato inválido (use HH:MM)';
      } else if (
        isValidTime(horarioInicio.trim()) &&
        horarioFim.trim() <= horarioInicio.trim()
      ) {
        newErrors.horario_fim = 'Horário de fim deve ser após o horário de início';
      }

      const raio = parseFloat(raioEntregaKm);
      if (!raioEntregaKm.trim()) {
        newErrors.raio_entrega_km = 'Raio de entrega é obrigatório';
      } else if (isNaN(raio) || raio < 1 || raio > 200) {
        newErrors.raio_entrega_km = 'Raio deve ser entre 1 e 200 km';
      }

      const taxa = parseFloat(taxaEntrega);
      if (!taxaEntrega.trim()) {
        newErrors.taxa_entrega = 'Taxa de entrega é obrigatória';
      } else if (isNaN(taxa) || taxa < 0.01 || taxa > 99999.99) {
        newErrors.taxa_entrega = 'Taxa deve ser entre 0,01 e 99.999,99';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    setApiError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const payload: any = {
        nome_completo: nomeCompleto.trim(),
        email: email.trim(),
        senha,
        tipo_perfil: tipoPerfil as TipoPerfil,
        documento: documento.replace(/\D/g, ''),
        telefone: telefone.replace(/\D/g, ''),
      };

      if (isCacambeiro) {
        payload.horario_inicio = horarioInicio.trim();
        payload.horario_fim = horarioFim.trim();
        payload.raio_entrega_km = parseFloat(raioEntregaKm);
        payload.taxa_entrega = parseFloat(taxaEntrega);
      }

      await register(payload);
      // AuthContext handles navigation on success (auto-login)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Erro ao realizar cadastro. Tente novamente.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  function clearFieldError(field: keyof FormErrors) {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { padding: spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { marginBottom: spacing.xl }]}>
          <Text
            style={{
              fontSize: typography.fontSizeXl ?? 28,
              fontFamily: typography.fontFamilyBold,
              color: colors.primaryGreen,
              textAlign: 'center',
            }}
          >
            Criar Conta
          </Text>
          <Text
            style={{
              fontSize: typography.fontSizeMd ?? 16,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: spacing.sm,
            }}
          >
            Preencha os dados para se cadastrar
          </Text>
        </View>

        {apiError ? (
          <View
            style={{
              backgroundColor: colors.errorLight,
              padding: spacing.md,
              borderRadius: radius.md,
              marginBottom: spacing.lg,
            }}
            accessibilityRole="alert"
          >
            <Text style={{ color: colors.error, fontSize: typography.fontSizeSm }}>
              {apiError}
            </Text>
          </View>
        ) : null}

        {/* Nome Completo */}
        <TextInputField
          label="Nome Completo"
          placeholder="Seu nome completo"
          value={nomeCompleto}
          onChangeText={(text) => {
            setNomeCompleto(text);
            clearFieldError('nome_completo');
          }}
          error={errors.nome_completo}
          style={{ marginBottom: spacing.md }}
          accessibilityLabel="Campo de nome completo"
        />

        {/* Email */}
        <TextInputField
          label="E-mail"
          placeholder="seu@email.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearFieldError('email');
          }}
          keyboardType="email-address"
          error={errors.email}
          style={{ marginBottom: spacing.md }}
          accessibilityLabel="Campo de e-mail"
        />

        {/* Senha */}
        <TextInputField
          label="Senha"
          placeholder="Mínimo 8 caracteres"
          value={senha}
          onChangeText={(text) => {
            setSenha(text);
            clearFieldError('senha');
          }}
          secureTextEntry
          error={errors.senha}
          style={{ marginBottom: spacing.md }}
          accessibilityLabel="Campo de senha"
        />

        {/* Tipo Perfil Selector */}
        <View style={{ marginBottom: spacing.md }}>
          <Text
            style={{
              marginBottom: spacing.xs,
              color: colors.textSecondary,
              fontSize: typography.fontSizeXs,
              fontFamily: typography.fontFamilyMedium,
            }}
          >
            Tipo de Perfil
          </Text>
          <View style={styles.profileSelector}>
            <TouchableOpacity
              style={[
                styles.profileOption,
                {
                  borderRadius: radius.md,
                  borderColor:
                    tipoPerfil === 'CONSUMIDOR' ? colors.primaryGreen : colors.border,
                  borderWidth: tipoPerfil === 'CONSUMIDOR' ? 2 : 1,
                  backgroundColor:
                    tipoPerfil === 'CONSUMIDOR' ? colors.successLight : colors.surface,
                  padding: spacing.md,
                  marginRight: spacing.sm,
                },
              ]}
              onPress={() => {
                setTipoPerfil('CONSUMIDOR');
                clearFieldError('tipo_perfil');
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: tipoPerfil === 'CONSUMIDOR' }}
              accessibilityLabel="Selecionar perfil Consumidor"
            >
              <Text
                style={{
                  color:
                    tipoPerfil === 'CONSUMIDOR' ? colors.primaryGreen : colors.textPrimary,
                  fontSize: typography.fontSizeSm,
                  fontFamily: typography.fontFamilyMedium,
                  textAlign: 'center',
                }}
              >
                Consumidor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.profileOption,
                {
                  borderRadius: radius.md,
                  borderColor:
                    tipoPerfil === 'CACAMBEIRO' ? colors.primaryGreen : colors.border,
                  borderWidth: tipoPerfil === 'CACAMBEIRO' ? 2 : 1,
                  backgroundColor:
                    tipoPerfil === 'CACAMBEIRO' ? colors.successLight : colors.surface,
                  padding: spacing.md,
                },
              ]}
              onPress={() => {
                setTipoPerfil('CACAMBEIRO');
                clearFieldError('tipo_perfil');
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: tipoPerfil === 'CACAMBEIRO' }}
              accessibilityLabel="Selecionar perfil Caçambeiro"
            >
              <Text
                style={{
                  color:
                    tipoPerfil === 'CACAMBEIRO' ? colors.primaryGreen : colors.textPrimary,
                  fontSize: typography.fontSizeSm,
                  fontFamily: typography.fontFamilyMedium,
                  textAlign: 'center',
                }}
              >
                Caçambeiro
              </Text>
            </TouchableOpacity>
          </View>
          {errors.tipo_perfil ? (
            <Text
              style={{
                marginTop: 4,
                color: colors.danger,
                fontSize: typography.fontSizeXs,
              }}
              accessibilityRole="alert"
            >
              {errors.tipo_perfil}
            </Text>
          ) : null}
        </View>

        {/* Documento */}
        <TextInputField
          label="Documento (CPF ou CNPJ)"
          placeholder="Somente números"
          value={documento}
          onChangeText={(text) => {
            setDocumento(text);
            clearFieldError('documento');
          }}
          keyboardType="numeric"
          error={errors.documento}
          style={{ marginBottom: spacing.md }}
          accessibilityLabel="Campo de documento"
        />

        {/* Telefone */}
        <TextInputField
          label="Telefone"
          placeholder="(00) 00000-0000"
          value={telefone}
          onChangeText={(text) => {
            setTelefone(text);
            clearFieldError('telefone');
          }}
          keyboardType="phone-pad"
          error={errors.telefone}
          style={{ marginBottom: spacing.md }}
          accessibilityLabel="Campo de telefone"
        />

        {/* CACAMBEIRO Business Details */}
        {isCacambeiro ? (
          <View
            style={{
              marginTop: spacing.md,
              padding: spacing.lg,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: typography.fontSizeMd ?? 16,
                fontFamily: typography.fontFamilyMedium,
                color: colors.textPrimary,
                marginBottom: spacing.md,
              }}
            >
              Detalhes do Negócio
            </Text>

            <TextInputField
              label="Horário de Início (HH:MM)"
              placeholder="08:00"
              value={horarioInicio}
              onChangeText={(text) => {
                setHorarioInicio(text);
                clearFieldError('horario_inicio');
              }}
              error={errors.horario_inicio}
              style={{ marginBottom: spacing.md }}
              accessibilityLabel="Campo de horário de início"
            />

            <TextInputField
              label="Horário de Fim (HH:MM)"
              placeholder="18:00"
              value={horarioFim}
              onChangeText={(text) => {
                setHorarioFim(text);
                clearFieldError('horario_fim');
              }}
              error={errors.horario_fim}
              style={{ marginBottom: spacing.md }}
              accessibilityLabel="Campo de horário de fim"
            />

            <TextInputField
              label="Raio de Entrega (km)"
              placeholder="Ex: 50"
              value={raioEntregaKm}
              onChangeText={(text) => {
                setRaioEntregaKm(text);
                clearFieldError('raio_entrega_km');
              }}
              keyboardType="numeric"
              error={errors.raio_entrega_km}
              style={{ marginBottom: spacing.md }}
              accessibilityLabel="Campo de raio de entrega em quilômetros"
            />

            <TextInputField
              label="Taxa de Entrega (R$)"
              placeholder="Ex: 50.00"
              value={taxaEntrega}
              onChangeText={(text) => {
                setTaxaEntrega(text);
                clearFieldError('taxa_entrega');
              }}
              keyboardType="numeric"
              error={errors.taxa_entrega}
              accessibilityLabel="Campo de taxa de entrega"
            />
          </View>
        ) : null}

        <View style={{ marginTop: spacing.xl }}>
          <Button
            label="Cadastrar"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            accessibilityLabel="Botão de cadastro"
          />
        </View>

        <View style={[styles.links, { marginTop: spacing.xl, marginBottom: spacing.xl }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizeSm }}>
              Já tem conta?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Text
                style={{
                  color: colors.primaryGreen,
                  fontSize: typography.fontSizeSm,
                  fontFamily: typography.fontFamilyMedium,
                }}
                accessibilityRole="link"
              >
                Faça login
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
  },
  profileSelector: {
    flexDirection: 'row',
  },
  profileOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  links: {
    alignItems: 'center',
  },
});
