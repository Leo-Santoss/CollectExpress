import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/ui/Button';
import TextInputField from '../../components/ui/TextInputField';
import { useTheme } from '../../hooks/useTheme';
import { forgotPassword } from '../../services/authService';

// ─── Validation Helpers ──────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const { colors, spacing, typography, radius } = useTheme();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate(): boolean {
    if (!email.trim()) {
      setError('E-mail é obrigatório');
      return false;
    }
    if (!isValidEmail(email.trim())) {
      setError('Formato de e-mail inválido');
      return false;
    }
    setError('');
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      // Always show success per spec (don't leak email existence)
      setSubmitted(true);
    } catch {
      // Even on error, show success message to not leak email existence
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background, padding: spacing.xl }]}>
        <View
          style={{
            backgroundColor: colors.successLight,
            padding: spacing.xl,
            borderRadius: radius.md,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: typography.fontSizeMd ?? 16,
              fontFamily: typography.fontFamilyMedium,
              color: colors.success,
              textAlign: 'center',
              marginBottom: spacing.sm,
            }}
          >
            E-mail enviado!
          </Text>
          <Text
            style={{
              fontSize: typography.fontSizeSm,
              color: colors.textPrimary,
              textAlign: 'center',
            }}
          >
            Se o e-mail informado estiver cadastrado, você receberá as instruções para
            redefinir sua senha.
          </Text>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Link href="/(auth)/login" asChild>
            <Text
              style={{
                color: colors.primaryGreen,
                fontSize: typography.fontSizeSm,
                fontFamily: typography.fontFamilyMedium,
                textAlign: 'center',
              }}
              accessibilityRole="link"
            >
              Voltar para o login
            </Text>
          </Link>
        </View>
      </View>
    );
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
          <Text
            style={{
              fontSize: typography.fontSizeXl ?? 28,
              fontFamily: typography.fontFamilyBold,
              color: colors.primaryGreen,
              textAlign: 'center',
            }}
          >
            Recuperar Senha
          </Text>
          <Text
            style={{
              fontSize: typography.fontSizeMd ?? 16,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: spacing.sm,
            }}
          >
            Informe seu e-mail para receber as instruções de recuperação
          </Text>
        </View>

        <TextInputField
          label="E-mail"
          placeholder="seu@email.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError('');
          }}
          keyboardType="email-address"
          error={error}
          style={{ marginBottom: spacing.xl }}
          accessibilityLabel="Campo de e-mail para recuperação"
        />

        <Button
          label="Enviar"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          accessibilityLabel="Botão de enviar recuperação de senha"
        />

        <View style={[styles.links, { marginTop: spacing.xl }]}>
          <Link href="/(auth)/login" asChild>
            <Text
              style={{
                color: colors.primaryGreen,
                fontSize: typography.fontSizeSm,
                fontFamily: typography.fontFamilyMedium,
                textAlign: 'center',
              }}
              accessibilityRole="link"
            >
              Voltar para o login
            </Text>
          </Link>
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
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
  },
  links: {
    alignItems: 'center',
  },
});
