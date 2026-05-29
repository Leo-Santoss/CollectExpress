import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import Button from '../../components/ui/Button';
import TextInputField from '../../components/ui/TextInputField';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';

// ─── Validation Helpers ──────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidSenha(senha: string): boolean {
  return senha.length >= 6;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState<{ email?: string; senha?: string }>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const newErrors: { email?: string; senha?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!isValidEmail(email.trim())) {
      newErrors.email = 'Formato de e-mail inválido';
    }

    if (!senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (!isValidSenha(senha)) {
      newErrors.senha = 'Senha deve ter no mínimo 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    setApiError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const result = await login(email.trim(), senha);
      // Navigate based on user profile type
      router.replace('/');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Erro ao realizar login. Tente novamente.';
      setApiError(message);
    } finally {
      setLoading(false);
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
        <View style={[styles.header, { marginBottom: spacing.xxl }]}>
          <Image 
            source={require('../../../assets/images/logo.png')} 
            style={{ width: 140, height: 180 }} 
            contentFit="contain" 
            accessibilityLabel="CollectExpress Logo"
          />
          <Text
            style={{
              fontSize: typography.fontSizeMd ?? 16,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: spacing.sm,
            }}
          >
            Faça login para continuar
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

        <TextInputField
          label="E-mail"
          placeholder="seu@email.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          keyboardType="email-address"
          error={errors.email}
          style={{ marginBottom: spacing.lg }}
          accessibilityLabel="Campo de e-mail"
        />

        <TextInputField
          label="Senha"
          placeholder="Sua senha"
          value={senha}
          onChangeText={(text) => {
            setSenha(text);
            if (errors.senha) setErrors((prev) => ({ ...prev, senha: undefined }));
          }}
          secureTextEntry
          error={errors.senha}
          style={{ marginBottom: spacing.xl }}
          accessibilityLabel="Campo de senha"
        />

        <Button
          label="Entrar"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          accessibilityLabel="Botão de login"
        />

        <View style={[styles.links, { marginTop: spacing.xl }]}>
          <Link href="/(auth)/forgot-password" asChild>
            <Text
              style={{
                color: colors.primaryGreen,
                fontSize: typography.fontSizeSm,
                textAlign: 'center',
              }}
              accessibilityRole="link"
            >
              Esqueceu sua senha?
            </Text>
          </Link>

          <View style={{ marginTop: spacing.md, flexDirection: 'row', justifyContent: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizeSm }}>
              Não tem conta?{' '}
            </Text>
            <Link href="/(auth)/register" asChild>
              <Text
                style={{
                  color: colors.primaryGreen,
                  fontSize: typography.fontSizeSm,
                  fontFamily: typography.fontFamilyMedium,
                }}
                accessibilityRole="link"
              >
                Cadastre-se
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  links: {
    alignItems: 'center',
  },
});
