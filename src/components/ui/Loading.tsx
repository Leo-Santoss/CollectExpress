import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

const Loading: React.FC<LoadingProps> = ({ message, size = 'large' }) => {
  const { colors, spacing, typography } = useTheme();

  return (
    <View
      style={[styles.container, { padding: spacing.md }]}
      accessibilityRole="progressbar"
      accessibilityLabel={message || 'Carregando'}
    >
      <ActivityIndicator size={size} color={colors.primaryGreen} />
      {message && (
        <Text
          style={{
            marginTop: spacing.sm,
            color: colors.textSecondary,
            fontSize: typography.fontSizeSm,
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Loading;