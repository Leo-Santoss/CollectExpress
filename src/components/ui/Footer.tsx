import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

const Footer: React.FC = () => {
  const { colors, spacing, typography } = useTheme();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.container, { paddingVertical: spacing.lg }]}>
      <Text
        style={{
          color: colors.textPrimary,
          fontFamily: typography.fontFamilyBold,
          fontSize: typography.fontSizeSm,
          marginBottom: spacing.sm,
        }}
      >
        Collect Express
      </Text>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.fontSizeXs,
          marginBottom: spacing.sm,
        }}
      >
        Plataforma para gestão e contratação de serviços de coleta de resíduos, caçambas
        e containers.
      </Text>

      <View style={styles.row}>
        <Text style={styles.sectionTitle}>Links rápidos</Text>
        <Text style={styles.link}>Sobre</Text>
        <Text style={styles.link}>Como funciona</Text>
        <Text style={styles.link}>Suporte</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.sectionTitle}>Contato</Text>
        <Text style={styles.smallText}>contato@collectexpress.com</Text>
        <Text style={styles.smallText}>+55 (11) 99999-9999</Text>
      </View>

      <View style={[styles.row, { marginTop: spacing.sm }]}>
        <Text style={styles.sectionTitle}>Redes sociais</Text>
        <View style={{ flexDirection: 'row', gap: 8 } as any}>
          <TouchableOpacity onPress={() => handleOpenLink('https://instagram.com')}>
            <Ionicons name="logo-instagram" size={20} color={colors.primaryGreen} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenLink('https://facebook.com')}>
            <Ionicons name="logo-facebook" size={20} color={colors.primaryGreen} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenLink('https://linkedin.com')}>
            <Ionicons name="logo-linkedin" size={20} color={colors.primaryGreen} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.copy}>
        © {new Date().getFullYear()} Collect Express. Todos os direitos reservados.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  row: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  link: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2,
  },
  smallText: {
    fontSize: 12,
    color: '#4B5563',
  },
  copy: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 10,
  },
});

export default Footer;