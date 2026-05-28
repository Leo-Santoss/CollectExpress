import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import Button from './buttons/Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onActionPress,
  icon = 'file-tray-outline',
}) => {
  const { colors, spacing, typography } = useTheme();

  return (
    <View
      style={[styles.container, { padding: spacing.xl }]}
      accessibilityRole="text"
      accessibilityLabel={`${title}${description ? `. ${description}` : ''}`}
    >
      <Ionicons
        name={icon}
        size={48}
        color={colors.textSecondary}
        style={{ marginBottom: spacing.md }}
      />
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: typography.fontSizeLg,
          fontFamily: typography.fontFamilyBold,
          marginBottom: spacing.sm,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSizeSm,
            marginBottom: spacing.lg,
            textAlign: 'center',
            lineHeight: typography.lineHeightSm,
          }}
        >
          {description}
        </Text>
      )}
      {actionLabel && onActionPress && (
        <Button
          label={actionLabel}
          onPress={onActionPress}
          variant="primary"
          fullWidth={false}
          accessibilityLabel={actionLabel}
        />
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

export default EmptyState;