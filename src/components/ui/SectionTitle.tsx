import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, style }) => {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: typography.fontSizeLg,
          fontFamily: typography.fontFamilyBold,
          marginBottom: subtitle ? spacing.xs : 0,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSizeSm,
            fontFamily: typography.fontFamilyRegular,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
});

export default SectionTitle;