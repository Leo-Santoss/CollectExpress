import React from 'react';
import {
    KeyboardTypeOptions,
    StyleSheet,
    Text,
    TextInput,
    View,
    ViewStyle,
} from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

export interface TextInputFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  error?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
  editable?: boolean;
}

const TextInputField: React.FC<TextInputFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
  error,
  style,
  accessibilityLabel,
  editable = true,
}) => {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <View style={style} accessibilityRole="none">
      {label && (
        <Text
          style={{
            marginBottom: spacing.xs,
            color: colors.textSecondary,
            fontSize: typography.fontSizeXs,
            fontFamily: typography.fontFamilyMedium,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            borderRadius: radius.md,
            borderColor: error ? colors.danger : colors.border,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            fontSize: typography.fontSizeSm,
            color: editable ? colors.textPrimary : colors.textDisabled,
            backgroundColor: editable ? colors.white : colors.surfaceVariant,
            minHeight: 44,
          },
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={accessibilityLabel || label || placeholder}
        accessibilityRole="none"
        accessibilityState={{ disabled: !editable }}
        editable={editable}
      />
      {error && (
        <Text
          style={{
            marginTop: 4,
            color: colors.danger,
            fontSize: typography.fontSizeXs,
          }}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
  },
});

export default TextInputField;